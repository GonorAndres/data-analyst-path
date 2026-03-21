"""Pure analytics functions for KPI analysis, anomaly detection, and forecasting.

All functions are side-effect free and depend only on numpy, scipy, pandas,
and (optionally) statsmodels.
"""

from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from scipy import stats as sp_stats


# ═══════════════════════════════════════════════════════════════════════════
# ANOMALY DETECTION
# ═══════════════════════════════════════════════════════════════════════════


def anomaly_severity(zscore: float) -> str:
    """Classify anomaly severity based on absolute z-score.

    Returns:
        "critical" if |z| > 3, "warning" if |z| > 2, "info" otherwise.
    """
    abs_z = abs(zscore)
    if abs_z > 3:
        return "critical"
    elif abs_z > 2:
        return "warning"
    return "info"


def detect_anomalies_zscore(
    series: pd.Series,
    index_labels: Optional[pd.Series] = None,
    threshold: float = 2.0,
) -> List[Dict]:
    """Detect anomalies via z-score method.

    Args:
        series: Numeric values (e.g. a monthly KPI).
        index_labels: Corresponding labels (e.g. month strings).
        threshold: Absolute z-score threshold to flag as anomaly.

    Returns:
        List of dicts with month, value, zscore, severity for flagged points.
    """
    if series.empty or series.std() == 0:
        return []

    mean = series.mean()
    std = series.std()
    zscores = (series - mean) / std

    anomalies = []
    for i, z in enumerate(zscores):
        if abs(z) >= threshold:
            label = (
                str(index_labels.iloc[i])
                if index_labels is not None
                else str(i)
            )
            anomalies.append({
                "month": label,
                "value": round(float(series.iloc[i]), 4),
                "zscore": round(float(z), 4),
                "severity": anomaly_severity(z),
            })
    return anomalies


def detect_anomalies_iqr(
    series: pd.Series,
    index_labels: Optional[pd.Series] = None,
    multiplier: float = 1.5,
) -> List[Dict]:
    """Detect anomalies via IQR method.

    Args:
        series: Numeric values.
        index_labels: Corresponding labels.
        multiplier: IQR multiplier for fence calculation.

    Returns:
        List of dicts with month, value, zscore (approximated), severity.
    """
    if series.empty:
        return []

    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1

    if iqr == 0:
        return []

    lower_fence = q1 - multiplier * iqr
    upper_fence = q3 + multiplier * iqr

    mean = series.mean()
    std = series.std() if series.std() > 0 else 1.0

    anomalies = []
    for i, val in enumerate(series):
        if val < lower_fence or val > upper_fence:
            approx_z = (val - mean) / std
            label = (
                str(index_labels.iloc[i])
                if index_labels is not None
                else str(i)
            )
            anomalies.append({
                "month": label,
                "value": round(float(val), 4),
                "zscore": round(float(approx_z), 4),
                "severity": anomaly_severity(approx_z),
            })
    return anomalies


# ═══════════════════════════════════════════════════════════════════════════
# FORECASTING
# ═══════════════════════════════════════════════════════════════════════════


def exponential_smoothing_forecast(
    series: pd.Series,
    periods: int = 6,
    alpha: float = 0.3,
) -> Dict:
    """Forecast future values using exponential smoothing.

    Attempts Holt-Winters (additive trend) via statsmodels. Falls back to
    simple exponential smoothing if statsmodels is unavailable or the series
    is too short.

    Args:
        series: Historical numeric values (chronologically ordered).
        periods: Number of future periods to forecast.
        alpha: Smoothing parameter (used in fallback).

    Returns:
        Dict with ``forecast`` (list of floats), ``ci_lower`` and
        ``ci_upper`` (95 % confidence bands), and ``fitted`` values.
    """
    values = series.dropna().values.astype(float)

    if len(values) < 3:
        return {
            "forecast": [],
            "ci_lower": [],
            "ci_upper": [],
            "fitted": [],
        }

    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        model = ExponentialSmoothing(
            values,
            trend="add",
            seasonal=None,
            initialization_method="estimated",
        ).fit(optimized=True)

        fcast = model.forecast(periods)
        fitted = model.fittedvalues

        # Approximate 95% CI using residual standard error
        residuals = values - fitted
        rse = float(np.std(residuals))
        ci_mult = 1.96

        ci_lower = []
        ci_upper = []
        for i in range(periods):
            # Widen CI as horizon increases
            width = rse * ci_mult * np.sqrt(1 + i * 0.1)
            ci_lower.append(round(float(fcast[i] - width), 2))
            ci_upper.append(round(float(fcast[i] + width), 2))

        return {
            "forecast": [round(float(v), 2) for v in fcast],
            "ci_lower": ci_lower,
            "ci_upper": ci_upper,
            "fitted": [round(float(v), 2) for v in fitted],
        }

    except Exception:
        # Fallback: simple exponential smoothing
        level = values[0]
        fitted_vals = [level]

        for v in values[1:]:
            level = alpha * v + (1 - alpha) * level
            fitted_vals.append(level)

        residuals = values - np.array(fitted_vals)
        rse = float(np.std(residuals)) if len(residuals) > 1 else 0.0
        ci_mult = 1.96

        forecast = []
        ci_lower = []
        ci_upper = []
        for i in range(periods):
            forecast.append(round(float(level), 2))
            width = rse * ci_mult * np.sqrt(1 + i * 0.1)
            ci_lower.append(round(float(level - width), 2))
            ci_upper.append(round(float(level + width), 2))

        return {
            "forecast": forecast,
            "ci_lower": ci_lower,
            "ci_upper": ci_upper,
            "fitted": [round(float(v), 2) for v in fitted_vals],
        }


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH SCORE & TRAFFIC LIGHTS
# ═══════════════════════════════════════════════════════════════════════════


def compute_health_score(row: Dict) -> float:
    """Compute a composite 0-100 health score from KPI values.

    Weights:
        MRR growth  20%  | NRR           20%  | Churn       15%
        NPS         15%  | Rule of 40    15%  | LTV:CAC     15%

    Args:
        row: Dict-like object with KPI values.

    Returns:
        Health score (0-100).
    """
    score = 0.0

    # MRR growth (20%) -- target 3% MoM, 0 at -2%, 100 at 8%
    mrr_growth = float(row.get("mrr_growth_rate", 0))
    mrr_pts = _scale(mrr_growth, lower=-0.02, upper=0.08)
    score += mrr_pts * 20

    # NRR (20%) -- target 110%, 0 at 80%, 100 at 130%
    nrr = float(row.get("nrr", row.get("net_revenue_retention", 1.0)))
    nrr_pts = _scale(nrr, lower=0.80, upper=1.30)
    score += nrr_pts * 20

    # Churn (15%) -- inverted: lower is better. 0 at 8%, 100 at 0%
    churn = float(row.get("logo_churn_rate", row.get("churn_rate", 0.02)))
    churn_pts = 1.0 - _scale(churn, lower=0.0, upper=0.08)
    score += churn_pts * 15

    # NPS (15%) -- 0 at -20, 100 at 80
    nps = float(row.get("nps", 50))
    nps_pts = _scale(nps, lower=-20, upper=80)
    score += nps_pts * 15

    # Rule of 40 (15%) -- 0 at 10, 100 at 60
    rule40 = float(row.get("rule_of_40", 30))
    rule40_pts = _scale(rule40, lower=10, upper=60)
    score += rule40_pts * 15

    # LTV:CAC (15%) -- 0 at 1, 100 at 6
    ltv_cac = float(row.get("ltv_cac_ratio", 3.0))
    ltv_cac_pts = _scale(ltv_cac, lower=1.0, upper=6.0)
    score += ltv_cac_pts * 15

    return round(max(0.0, min(100.0, score)), 1)


def _scale(value: float, lower: float, upper: float) -> float:
    """Linear scaling: returns 0.0 at lower, 1.0 at upper, clamped."""
    if upper == lower:
        return 0.5
    return max(0.0, min(1.0, (value - lower) / (upper - lower)))


def traffic_light_status(
    value: float,
    target: float,
    higher_is_better: bool = True,
) -> str:
    """Return traffic light status for a KPI relative to its target.

    Args:
        value: Current KPI value.
        target: Target / benchmark value.
        higher_is_better: True if exceeding target is good.

    Returns:
        "green", "yellow", or "red".
    """
    if target == 0:
        return "green"

    if higher_is_better:
        ratio = value / target
        if ratio >= 1.0:
            return "green"
        elif ratio >= 0.9:
            return "yellow"
        return "red"
    else:
        ratio = target / value if value != 0 else 0
        if ratio >= 1.0:
            return "green"
        elif ratio >= 0.9:
            return "yellow"
        return "red"


# ═══════════════════════════════════════════════════════════════════════════
# PERIOD COMPARISON
# ═══════════════════════════════════════════════════════════════════════════


def period_comparison(
    current_df: pd.DataFrame,
    previous_df: pd.DataFrame,
    metrics: List[str],
) -> Dict:
    """Compare aggregated metric values between two periods.

    Args:
        current_df: DataFrame for the current period.
        previous_df: DataFrame for the comparison period.
        metrics: Column names to compare.

    Returns:
        Dict mapping each metric to {current, previous, change, change_pct}.
    """
    result = {}
    for m in metrics:
        cur = float(current_df[m].mean()) if m in current_df.columns and not current_df.empty else 0.0
        prev = float(previous_df[m].mean()) if m in previous_df.columns and not previous_df.empty else 0.0
        change = cur - prev
        change_pct = (change / prev * 100) if prev != 0 else 0.0
        result[m] = {
            "current": round(cur, 4),
            "previous": round(prev, 4),
            "change": round(change, 4),
            "change_pct": round(change_pct, 2),
        }
    return result


# ═══════════════════════════════════════════════════════════════════════════
# MRR WATERFALL
# ═══════════════════════════════════════════════════════════════════════════


def mrr_waterfall(row: Dict) -> Dict:
    """Build an MRR waterfall breakdown from a monthly metrics row.

    Args:
        row: Dict-like with MRR component columns.

    Returns:
        Dict with starting_mrr, new, expansion, contraction, churned,
        ending_mrr.
    """
    starting = float(row.get("starting_mrr", row.get("mrr", 0)))
    new = float(row.get("new_mrr", 0))
    expansion = float(row.get("expansion_mrr", 0))
    contraction = float(row.get("contraction_mrr", 0))
    churned = float(row.get("churned_mrr", 0))
    ending = starting + new + expansion - contraction - churned

    return {
        "starting_mrr": round(starting, 2),
        "new": round(new, 2),
        "expansion": round(expansion, 2),
        "contraction": round(contraction, 2),
        "churned": round(churned, 2),
        "ending_mrr": round(ending, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# CONCENTRATION / LORENZ CURVE
# ═══════════════════════════════════════════════════════════════════════════


def customer_concentration_lorenz(segments_data: List[Dict]) -> Dict:
    """Compute Lorenz curve data for customer revenue concentration.

    Args:
        segments_data: List of dicts with ``customers`` and ``revenue`` keys.

    Returns:
        Dict with ``percentiles`` and ``cumulative_revenue_share`` lists,
        plus ``gini_coefficient``.
    """
    if not segments_data:
        return {"percentiles": [], "cumulative_revenue_share": [], "gini_coefficient": 0.0}

    # Sort by revenue per customer ascending (poorest first)
    sorted_segs = sorted(
        segments_data,
        key=lambda x: x.get("revenue", 0) / max(x.get("customers", 1), 1),
    )

    total_customers = sum(s.get("customers", 0) for s in sorted_segs)
    total_revenue = sum(s.get("revenue", 0) for s in sorted_segs)

    if total_customers == 0 or total_revenue == 0:
        return {"percentiles": [], "cumulative_revenue_share": [], "gini_coefficient": 0.0}

    percentiles = [0.0]
    cum_revenue = [0.0]
    running_cust = 0
    running_rev = 0.0

    for seg in sorted_segs:
        running_cust += seg.get("customers", 0)
        running_rev += seg.get("revenue", 0)
        percentiles.append(round(running_cust / total_customers, 4))
        cum_revenue.append(round(running_rev / total_revenue, 4))

    # Gini coefficient via trapezoidal approximation
    _trapz = getattr(np, "trapezoid", None) or np.trapz
    area_under_lorenz = _trapz(cum_revenue, percentiles)
    gini = round(float(1 - 2 * area_under_lorenz), 4)

    return {
        "percentiles": percentiles,
        "cumulative_revenue_share": cum_revenue,
        "gini_coefficient": gini,
    }
