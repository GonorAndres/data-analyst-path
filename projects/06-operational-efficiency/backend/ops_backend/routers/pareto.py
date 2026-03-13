"""Pareto endpoint -- complaint-type Pareto analysis and priority matrix."""

from typing import Optional

from fastapi import APIRouter, Query

from ops_backend import data_loader
from ops_backend.ops_engine import pareto_analysis, priority_matrix

router = APIRouter()


@router.get("/pareto")
def pareto(
    agency: Optional[str] = Query(None),
    complaint_type: Optional[str] = Query(None),
    borough: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    year_month: Optional[str] = Query(None),
):
    """Return Pareto chart data and priority scatter matrix."""
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
        "pareto": pareto_analysis(df),
        "priority_matrix": priority_matrix(df),
    }
