from typing import Optional

from fastapi import APIRouter, Query

from insurance_backend import data_loader
from insurance_backend.filters import apply_filters

router = APIRouter()

# Assumed expense ratio (industry convention for Schedule P data without expense detail)
ASSUMED_EXPENSE_RATIO = 0.30


@router.get("/combined-ratio")
def combined_ratio(
    lob: Optional[str] = Query(None),
    company: Optional[int] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    """Return combined ratio trend by accident year.

    Combined ratio = loss ratio + expense ratio.
    The expense ratio is assumed at 30% since Schedule P data does not include
    expense breakdowns.
    """
    df = apply_filters(data_loader.ibnr_results, lob, None, year_start, year_end)

    if df.empty:
        return {"by_year": [], "summary": {}}

    # Aggregate by accident year
    by_year = (
        df.groupby("accident_year")
        .agg(
            total_reported_incurred=("reported_incurred", "sum"),
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
        if prem > 0:
            lr_reported = float(row["total_reported_incurred"] / prem)
            lr_ultimate_cl = float(row["total_ultimate_cl_paid"] / prem)
            lr_ultimate_bf = float(row["total_ultimate_bf"] / prem)
        else:
            lr_reported = 0.0
            lr_ultimate_cl = 0.0
            lr_ultimate_bf = 0.0

        by_year_list.append({
            "accident_year": int(row["accident_year"]),
            "loss_ratio_reported": round(lr_reported, 4),
            "loss_ratio_ultimate_cl": round(lr_ultimate_cl, 4),
            "loss_ratio_ultimate_bf": round(lr_ultimate_bf, 4),
            "expense_ratio": ASSUMED_EXPENSE_RATIO,
            "combined_ratio_reported": round(lr_reported + ASSUMED_EXPENSE_RATIO, 4),
            "combined_ratio_ultimate_cl": round(lr_ultimate_cl + ASSUMED_EXPENSE_RATIO, 4),
            "combined_ratio_ultimate_bf": round(lr_ultimate_bf + ASSUMED_EXPENSE_RATIO, 4),
            "earned_premium": int(row["total_earned_premium"]),
        })

    # Overall summary
    total_prem = by_year["total_earned_premium"].sum()
    if total_prem > 0:
        overall_lr = float(by_year["total_reported_incurred"].sum() / total_prem)
    else:
        overall_lr = 0.0

    summary = {
        "overall_loss_ratio": round(overall_lr, 4),
        "expense_ratio": ASSUMED_EXPENSE_RATIO,
        "overall_combined_ratio": round(overall_lr + ASSUMED_EXPENSE_RATIO, 4),
        "total_earned_premium": int(total_prem),
    }

    return {
        "by_year": by_year_list,
        "summary": summary,
    }
