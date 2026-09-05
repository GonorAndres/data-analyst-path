"""Anomalies endpoint -- z-score and IQR anomaly detection across KPIs."""

from typing import Optional

from fastapi import APIRouter, Query

from kpi_backend import data_loader
from kpi_backend.analytics_engine import scan_anomalies
from kpi_backend.commentary import generate_anomaly_narrative

router = APIRouter()


def _safe_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


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

    unique_anomalies = scan_anomalies(source, method=method or "both", threshold=threshold)

    # Convert to AnomalyItem[] format expected by frontend
    anomaly_items = []
    for i, a in enumerate(unique_anomalies):
        anomaly_items.append({
            "id": f"anom-{i}",
            "metric": a.get("metric", ""),
            "month": a.get("month", ""),
            "value": round(_safe_float(a.get("value", 0)), 4),
            "expected": a["expected"],
            "method": a["method"],
            "baseline_kind": a["baseline_kind"],
            "lower_bound": a["lower_bound"],
            "upper_bound": a["upper_bound"],
            "evidence": a["evidence"],
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
        "population": "All segments; selected month range",
        "evidence_type": "synthetic",
    }
