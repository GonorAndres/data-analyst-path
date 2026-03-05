from typing import Optional

from fastapi import APIRouter, Query

from insurance_backend import data_loader
from insurance_backend.filters import apply_filters

router = APIRouter()


@router.get("/frequency-severity")
def frequency_severity(
    lob: Optional[str] = Query(None),
    company: Optional[int] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    """Return claim frequency and severity trends by accident year and LOB."""
    df = apply_filters(data_loader.claims, lob, None, year_start, year_end)

    if df.empty:
        return {"by_year": [], "by_lob": []}

    # --- By accident year ---
    by_year = (
        df.groupby("accident_year")
        .agg(
            claim_count=("claim_id", "count"),
            avg_paid=("paid_amount", "mean"),
            avg_incurred=("incurred_amount", "mean"),
            median_paid=("paid_amount", "median"),
            total_paid=("paid_amount", "sum"),
            total_incurred=("incurred_amount", "sum"),
        )
        .reset_index()
        .sort_values("accident_year")
    )

    by_year_list = []
    for _, row in by_year.iterrows():
        by_year_list.append({
            "accident_year": int(row["accident_year"]),
            "claim_count": int(row["claim_count"]),
            "avg_paid": round(float(row["avg_paid"]), 2),
            "avg_incurred": round(float(row["avg_incurred"]), 2),
            "median_paid": round(float(row["median_paid"]), 2),
            "total_paid": round(float(row["total_paid"]), 2),
            "total_incurred": round(float(row["total_incurred"]), 2),
        })

    # --- By line of business ---
    by_lob = (
        df.groupby("line_of_business")
        .agg(
            claim_count=("claim_id", "count"),
            avg_paid=("paid_amount", "mean"),
            avg_incurred=("incurred_amount", "mean"),
            median_paid=("paid_amount", "median"),
            total_paid=("paid_amount", "sum"),
            total_incurred=("incurred_amount", "sum"),
            avg_report_lag=("report_lag_days", "mean"),
        )
        .reset_index()
        .sort_values("claim_count", ascending=False)
    )

    by_lob_list = []
    for _, row in by_lob.iterrows():
        by_lob_list.append({
            "line_of_business": row["line_of_business"],
            "claim_count": int(row["claim_count"]),
            "avg_paid": round(float(row["avg_paid"]), 2),
            "avg_incurred": round(float(row["avg_incurred"]), 2),
            "median_paid": round(float(row["median_paid"]), 2),
            "total_paid": round(float(row["total_paid"]), 2),
            "total_incurred": round(float(row["total_incurred"]), 2),
            "avg_report_lag": round(float(row["avg_report_lag"]), 1),
        })

    return {
        "by_year": by_year_list,
        "by_lob": by_lob_list,
    }
