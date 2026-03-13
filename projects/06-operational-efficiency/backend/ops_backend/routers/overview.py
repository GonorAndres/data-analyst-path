"""Overview endpoint -- high-level KPIs, SLA verdict, and distribution summaries."""

from typing import Optional

from fastapi import APIRouter, Query

from ops_backend import data_loader
from ops_backend.ops_engine import compute_overview, sla_verdict

router = APIRouter()


@router.get("/overview")
def overview(
    agency: Optional[str] = Query(None),
    complaint_type: Optional[str] = Query(None),
    borough: Optional[str] = Query(None),
    channel: Optional[str] = Query(None),
    year_month: Optional[str] = Query(None),
):
    """Return top-level operational KPIs and SLA verdict."""
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

    result = compute_overview(df)

    # Attach SLA verdict string (CUMPLE / EN RIESGO / INCUMPLE)
    if result["sla_compliance_rate"] is not None:
        result["sla_verdict"] = sla_verdict(result["sla_compliance_rate"])
    else:
        result["sla_verdict"] = "N/A"

    return result
