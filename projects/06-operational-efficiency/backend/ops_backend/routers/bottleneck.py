"""Bottleneck endpoint -- Sankey flow and resolution bottleneck detection."""

from typing import Optional

from fastapi import APIRouter, Query

from ops_backend import data_loader
from ops_backend.ops_engine import build_sankey_data, detect_bottlenecks

router = APIRouter()


@router.get("/bottleneck")
def bottleneck(
    agency: Optional[str] = Query(None),
    complaint_type: Optional[str] = Query(None),
    borough: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    year_month: Optional[str] = Query(None),
):
    """Return Sankey flow data and top resolution bottlenecks."""
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
        "sankey": build_sankey_data(df),
        "bottlenecks": detect_bottlenecks(df),
    }
