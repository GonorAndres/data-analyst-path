from typing import Optional

from fastapi import APIRouter, Query

from insurance_backend import data_loader
from insurance_backend.filters import apply_filters

router = APIRouter()


@router.get("/loss-ratios")
def loss_ratios(
    lob: Optional[str] = Query(None),
    company: Optional[int] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    """Return loss ratios by LOB and accident year from IBNR results."""
    df = apply_filters(data_loader.ibnr_results, lob, None, year_start, year_end)

    if df.empty:
        return {"by_year": [], "by_lob": []}

    # --- By accident year (across all LOBs in scope) ---
    by_year = (
        df.groupby("accident_year")
        .agg(
            total_reported_incurred=("reported_incurred", "sum"),
            total_reported_paid=("reported_paid", "sum"),
            total_ultimate_cl_paid=("ultimate_cl_paid", "sum"),
            total_ultimate_bf=("ultimate_bf", "sum"),
            total_earned_premium=("earned_premium", "sum"),
        )
        .reset_index()
        .sort_values("accident_year")
    )

    by_year_list = []
    for _, row in by_year.iterrows():
        prem = row["total_earned_premium"]
        by_year_list.append({
            "accident_year": int(row["accident_year"]),
            "loss_ratio_reported": round(float(row["total_reported_incurred"] / prem), 4) if prem > 0 else None,
            "loss_ratio_paid": round(float(row["total_reported_paid"] / prem), 4) if prem > 0 else None,
            "loss_ratio_ultimate_cl": round(float(row["total_ultimate_cl_paid"] / prem), 4) if prem > 0 else None,
            "loss_ratio_ultimate_bf": round(float(row["total_ultimate_bf"] / prem), 4) if prem > 0 else None,
            "earned_premium": int(row["total_earned_premium"]),
        })

    # --- By LOB (aggregated across years in scope) ---
    by_lob = (
        df.groupby("line_of_business")
        .agg(
            total_reported_incurred=("reported_incurred", "sum"),
            total_reported_paid=("reported_paid", "sum"),
            total_ultimate_cl_paid=("ultimate_cl_paid", "sum"),
            total_ultimate_bf=("ultimate_bf", "sum"),
            total_ibnr_cl_paid=("ibnr_cl_paid", "sum"),
            total_ibnr_bf=("ibnr_bf", "sum"),
            total_earned_premium=("earned_premium", "sum"),
        )
        .reset_index()
        .sort_values("line_of_business")
    )

    by_lob_list = []
    for _, row in by_lob.iterrows():
        prem = row["total_earned_premium"]
        by_lob_list.append({
            "line_of_business": row["line_of_business"],
            "loss_ratio_reported": round(float(row["total_reported_incurred"] / prem), 4) if prem > 0 else None,
            "loss_ratio_paid": round(float(row["total_reported_paid"] / prem), 4) if prem > 0 else None,
            "loss_ratio_ultimate_cl": round(float(row["total_ultimate_cl_paid"] / prem), 4) if prem > 0 else None,
            "loss_ratio_ultimate_bf": round(float(row["total_ultimate_bf"] / prem), 4) if prem > 0 else None,
            "total_ibnr_cl_paid": int(row["total_ibnr_cl_paid"]),
            "total_ibnr_bf": int(row["total_ibnr_bf"]),
            "earned_premium": int(row["total_earned_premium"]),
        })

    return {
        "by_year": by_year_list,
        "by_lob": by_lob_list,
    }
