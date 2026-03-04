from typing import Optional

from fastapi import APIRouter, Query

from app import data_loader
from app.filters import apply_filters

router = APIRouter()


@router.get("/ltv-curves")
def ltv_curves(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty or "total_payment" not in df.columns:
        return {"cohorts": [], "curves": []}

    cohort_sizes = (
        df[df["months_since_cohort"] == 0]
        .groupby("cohort_month")["customer_unique_id"]
        .nunique()
    )

    top_cohorts = cohort_sizes.nlargest(6).index.tolist()
    df_top = df[df["cohort_month"].isin(top_cohorts)]

    revenue_by_cohort_month = (
        df_top.groupby(["cohort_month", "months_since_cohort"])["total_payment"]
        .sum()
        .reset_index()
    )

    curves = []
    for cohort in top_cohorts:
        cohort_df = revenue_by_cohort_month[
            revenue_by_cohort_month["cohort_month"] == cohort
        ].sort_values("months_since_cohort")
        size = int(cohort_sizes.get(cohort, 1))
        cumulative = cohort_df["total_payment"].cumsum() / size
        points = [
            {"month": int(row["months_since_cohort"]), "ltv": round(float(cum), 2)}
            for (_, row), cum in zip(cohort_df.iterrows(), cumulative)
        ]
        curves.append({"cohort": cohort, "size": size, "points": points})

    return {"cohorts": top_cohorts, "curves": curves}
