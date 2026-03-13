"""Anomalies endpoint -- z-score and IQR anomaly detection across KPIs."""

from typing import Optional

from fastapi import APIRouter, Query

from kpi_backend import data_loader
from kpi_backend.analytics_engine import detect_anomalies_iqr, detect_anomalies_zscore
from kpi_backend.commentary import generate_anomaly_narrative

router = APIRouter()


def _safe_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


# Metrics to scan for anomalies
_ANOMALY_METRICS = [
    "mrr", "arr", "nrr", "logo_churn_rate", "revenue_churn_rate",
    "nps", "ltv_cac_ratio", "rule_of_40", "gross_margin",
    "dau_mau_ratio", "cac", "payback_months",
]


@router.get("/anomalies")
def anomalies(
    segment: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    method: Optional[str] = Query("both", regex="^(zscore|iqr|both)$"),
    threshold: float = Query(2.0, ge=1.0, le=5.0),
    lang: Optional[str] = Query("en"),
):
    """Detect anomalies across KPI time series using z-score and/or IQR methods."""
    kpis_df = data_loader.apply_filters(
        data_loader.monthly_kpis,
        start_month=start_month,
        end_month=end_month,
    )
    metrics_df = data_loader.apply_filters(
        data_loader.monthly_metrics,
        start_month=start_month,
        end_month=end_month,
    )

    source = kpis_df if not kpis_df.empty else metrics_df
    if source.empty:
        return {"error": "No data matches the selected filters."}

    source = source.sort_values("month") if "month" in source.columns else source

    # Month labels for index
    if "month" in source.columns:
        month_labels = source["month"].apply(
            lambda m: m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)
        )
    else:
        month_labels = None

    all_anomalies = []
    sparklines = {}
    counter = 0

    for metric in _ANOMALY_METRICS:
        if metric not in source.columns:
            continue

        series = source[metric].astype(float)
        sparklines[metric] = [round(_safe_float(v), 4) for v in series.tolist()]
        mean_val = series.mean()

        # Z-score method
        if method in ("zscore", "both"):
            zscore_anoms = detect_anomalies_zscore(
                series, index_labels=month_labels, threshold=threshold,
            )
            for a in zscore_anoms:
                a["metric"] = metric
                a["method"] = "zscore"
            all_anomalies.extend(zscore_anoms)

        # IQR method
        if method in ("iqr", "both"):
            iqr_anoms = detect_anomalies_iqr(
                series, index_labels=month_labels, multiplier=1.5,
            )
            for a in iqr_anoms:
                a["metric"] = metric
                a["method"] = "iqr"
            all_anomalies.extend(iqr_anoms)

    # Deduplicate (same metric + month flagged by both methods)
    seen = set()
    unique_anomalies = []
    for a in all_anomalies:
        key = (a["metric"], a["month"])
        if key not in seen:
            seen.add(key)
            unique_anomalies.append(a)
        else:
            for existing in unique_anomalies:
                if existing["metric"] == a["metric"] and existing["month"] == a["month"]:
                    sev_order = {"critical": 3, "warning": 2, "info": 1}
                    if sev_order.get(a["severity"], 0) > sev_order.get(existing["severity"], 0):
                        existing.update(a)
                    elif a.get("method") != existing.get("method"):
                        existing["method"] = "both"
                    break

    # Sort by severity then by absolute z-score
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    unique_anomalies.sort(
        key=lambda x: (severity_order.get(x.get("severity", "info"), 3), -abs(x.get("zscore", 0))),
    )

    # Convert to AnomalyItem[] format expected by frontend
    anomaly_items = []
    for i, a in enumerate(unique_anomalies):
        anomaly_items.append({
            "id": f"anom-{i}",
            "metric": a.get("metric", ""),
            "month": a.get("month", ""),
            "value": round(_safe_float(a.get("value", 0)), 4),
            "expected": round(_safe_float(a.get("value", 0)) / (1 + _safe_float(a.get("zscore", 1)) * 0.1), 4) if a.get("zscore") else 0,
            "z_score": round(_safe_float(a.get("zscore", 0)), 4),
            "severity": a.get("severity", "info"),
            "description": f"{a.get('metric', '')} anomaly detected in {a.get('month', '')} (z-score: {round(_safe_float(a.get('zscore', 0)), 2)})",
        })

    # Summary counts
    critical_count = sum(1 for a in anomaly_items if a["severity"] == "critical")
    warning_count = sum(1 for a in anomaly_items if a["severity"] == "warning")
    info_count = sum(1 for a in anomaly_items if a["severity"] == "info")

    # Commentary
    commentary = generate_anomaly_narrative(unique_anomalies, lang=lang or "en")

    return {
        "summary": {
            "critical_count": critical_count,
            "warning_count": warning_count,
            "info_count": info_count,
            "total": len(anomaly_items),
        },
        "anomalies": anomaly_items,
        "commentary": commentary,
    }
