"""Forecast endpoint -- exponential smoothing projections with CI bands."""

from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from kpi_backend import data_loader
from kpi_backend.analytics_engine import exponential_smoothing_forecast

router = APIRouter()


def _safe_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


# Metrics to forecast and their labels
_FORECAST_METRICS = [
    {"col": "mrr", "name": "MRR", "category": "revenue"},
    {"col": "logo_churn_rate", "name": "Logo Churn Rate", "category": "customers"},
    {"col": "nps", "name": "NPS", "category": "customers"},
    {"col": "arr", "name": "ARR", "category": "revenue"},
    {"col": "nrr", "name": "NRR", "category": "revenue"},
    {"col": "cac", "name": "CAC", "category": "efficiency"},
]


@router.get("/forecast")
def forecast(
    segment: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    periods: int = Query(6, ge=1, le=24),
    lang: Optional[str] = Query("en"),
):
    """Return exponential smoothing forecasts for key KPIs with 95% CI."""
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

    # Generate historical month labels
    if "month" in source.columns:
        historical_months = [
            m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)
            for m in source["month"]
        ]
    else:
        historical_months = []

    # Generate future month labels
    if historical_months:
        last_month = pd.Timestamp(historical_months[-1])
        future_months = [
            (last_month + pd.DateOffset(months=i + 1)).strftime("%Y-%m")
            for i in range(periods)
        ]
    else:
        future_months = [f"+{i+1}" for i in range(periods)]

    all_months = historical_months + future_months

    # Build forecasts as ForecastMetric[] array
    forecasts = []
    for metric in _FORECAST_METRICS:
        col = metric["col"]
        if col not in source.columns:
            continue

        series = source[col].astype(float)
        result = exponential_smoothing_forecast(series, periods=periods)

        hist_values = [round(_safe_float(v), 4) for v in series.tolist()]
        fc_values = result["forecast"]
        ci_lower = result["ci_lower"]
        ci_upper = result["ci_upper"]

        # Build ForecastPoint[] array
        data_points = []
        for i, month in enumerate(historical_months):
            data_points.append({
                "month": month,
                "actual": hist_values[i] if i < len(hist_values) else None,
                "forecast": None,
                "lower_ci": None,
                "upper_ci": None,
                "target": None,
            })
        for i, month in enumerate(future_months):
            data_points.append({
                "month": month,
                "actual": None,
                "forecast": fc_values[i] if i < len(fc_values) else None,
                "lower_ci": ci_lower[i] if i < len(ci_lower) else None,
                "upper_ci": ci_upper[i] if i < len(ci_upper) else None,
                "target": None,
            })

        forecasts.append({
            "metric": col,
            "metric_label": metric["name"],
            "data": data_points,
        })

    return {
        "forecasts": forecasts,
        "commentary": "",
    }
