"""Frequentist statistical tests endpoint."""

from typing import Optional

import numpy as np
from fastapi import APIRouter, Query
from scipy import stats as sp_stats

from abtest_backend import data_loader
from abtest_backend.stats_engine import (
    chi_squared_test,
    cohens_h,
    wilson_confidence_interval,
    z_test_proportions,
)

router = APIRouter()


def _metric_test(control_vals, treatment_vals, metric_name: str) -> dict:
    """Run a two-sample t-test on a continuous metric and return summary."""
    c_mean = float(np.nanmean(control_vals)) if len(control_vals) > 0 else 0.0
    t_mean = float(np.nanmean(treatment_vals)) if len(treatment_vals) > 0 else 0.0
    if len(control_vals) > 1 and len(treatment_vals) > 1:
        t_stat, p_value = sp_stats.ttest_ind(
            control_vals.dropna(), treatment_vals.dropna(), equal_var=False
        )
    else:
        t_stat, p_value = 0.0, 1.0

    lift = (t_mean - c_mean) / c_mean * 100 if c_mean != 0 else 0.0

    return {
        "metric": metric_name,
        "control_mean": round(c_mean, 6),
        "treatment_mean": round(t_mean, 6),
        "lift_pct": round(lift, 4),
        "t_stat": round(float(t_stat), 6),
        "p_value": round(float(p_value), 6),
        "is_significant": float(p_value) < 0.05,
    }


@router.get("/frequentist")
def frequentist(
    device_type: Optional[str] = Query(None),
    browser: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    user_segment: Optional[str] = Query(None),
    traffic_source: Optional[str] = Query(None),
):
    """Return frequentist test results: z-test, chi-squared, Wilson CIs,
    Cohen's h, and multi-metric comparison table."""
    df = data_loader.apply_filters(
        data_loader.df,
        device_type=device_type,
        browser=browser,
        country=country,
        user_segment=user_segment,
        traffic_source=traffic_source,
    )

    if df.empty:
        return {"error": "No data matches the selected filters."}

    control = df[df["group"] == "control"]
    treatment = df[df["group"] == "treatment"]

    n_a = len(control)
    n_b = len(treatment)
    conv_a = int(control["converted"].sum())
    conv_b = int(treatment["converted"].sum())

    # Core tests
    z_result = z_test_proportions(n_a, conv_a, n_b, conv_b)
    chi2_result = chi_squared_test(n_a, conv_a, n_b, conv_b)

    # Wilson CIs
    wilson_control = wilson_confidence_interval(conv_a, n_a)
    wilson_treatment = wilson_confidence_interval(conv_b, n_b)

    # Effect size
    p_a = conv_a / n_a if n_a > 0 else 0.0
    p_b = conv_b / n_b if n_b > 0 else 0.0
    effect = cohens_h(p_a, p_b)

    # Multiple-metrics table
    metrics_table = []

    # 1. Conversion rate (already computed via z-test, include for completeness)
    metrics_table.append({
        "metric": "conversion_rate",
        "control_mean": round(p_a, 6),
        "treatment_mean": round(p_b, 6),
        "lift_pct": round((p_b - p_a) / p_a * 100, 4) if p_a > 0 else 0.0,
        "test_stat": z_result["z_stat"],
        "p_value": z_result["p_value"],
        "is_significant": z_result["p_value"] < 0.05,
    })

    # 2. Revenue per user
    if "revenue" in df.columns:
        metrics_table.append(
            _metric_test(control["revenue"], treatment["revenue"], "revenue_per_user")
        )

    # 3. Session duration
    if "session_duration_sec" in df.columns:
        metrics_table.append(
            _metric_test(
                control["session_duration_sec"],
                treatment["session_duration_sec"],
                "session_duration_sec",
            )
        )

    # Contingency table for display
    contingency_table = [
        {
            "group": "Control",
            "converted": conv_a,
            "not_converted": n_a - conv_a,
            "total": n_a,
        },
        {
            "group": "Treatment",
            "converted": conv_b,
            "not_converted": n_b - conv_b,
            "total": n_b,
        },
    ]

    # Normalise metrics_table fields for frontend
    normalised_metrics = []
    for m in metrics_table:
        normalised_metrics.append({
            "metric": m["metric"],
            "control": m.get("control_mean", m.get("control", 0)),
            "treatment": m.get("treatment_mean", m.get("treatment", 0)),
            "diff": m.get("lift_pct", 0) / 100 if "lift_pct" in m else 0,
            "p_value": m.get("p_value", 1.0),
        })

    return {
        "z_test": z_result,
        "chi_squared": chi2_result,
        "wilson_ci_control": [wilson_control[0], wilson_control[1]],
        "wilson_ci_treatment": [wilson_treatment[0], wilson_treatment[1]],
        "cohens_h": effect,
        "metrics_table": normalised_metrics,
        "contingency_table": contingency_table,
    }
