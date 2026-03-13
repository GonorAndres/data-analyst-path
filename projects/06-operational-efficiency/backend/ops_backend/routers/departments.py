"""Departments endpoint -- agency ranking and complaint-type heatmap."""

from typing import Optional

from fastapi import APIRouter, Query

from ops_backend import data_loader
from ops_backend.ops_engine import agency_complaint_heatmap, agency_ranking

router = APIRouter()


@router.get("/departments")
def departments(
    agency: Optional[str] = Query(None),
    complaint_type: Optional[str] = Query(None),
    borough: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    year_month: Optional[str] = Query(None),
):
    """Return agency ranking table and agency-complaint heatmap matrix."""
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
        "ranking": agency_ranking(df),
        "heatmap": agency_complaint_heatmap(df),
    }
