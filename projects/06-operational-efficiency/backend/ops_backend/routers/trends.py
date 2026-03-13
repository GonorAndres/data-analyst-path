"""Trends endpoint -- monthly time series and day-of-week/hour heatmap."""

from typing import Optional

from fastapi import APIRouter, Query

from ops_backend import data_loader
from ops_backend.ops_engine import dow_hour_heatmap, monthly_time_series

router = APIRouter()


@router.get("/trends")
def trends(
    agency: Optional[str] = Query(None),
    complaint_type: Optional[str] = Query(None),
    borough: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    year_month: Optional[str] = Query(None),
):
    """Return monthly time-series and day/hour heatmap."""
    df = data_loader.apply_filters(
        data_loader.df,
        agency=agency,
        complaint_type=complaint_type,
        borough=borough,
        channel=channel,
        year_month=year_month,
    )

    if df.empty:
        return {"error": "No data matches the selected filters."}

    return {
        "monthly": monthly_time_series(df),
        "dow_hour": dow_hour_heatmap(df),
    }
