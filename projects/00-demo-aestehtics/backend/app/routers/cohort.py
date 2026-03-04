from typing import Optional

from fastapi import APIRouter, Query

from app import data_loader
from app.filters import apply_filters

router = APIRouter()


@router.get("/cohort-retention")
def cohort_retention(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty:
        return {"cohorts": [], "months": [], "matrix": [], "cohort_sizes": []}

    cohort_data = (
        df.groupby(["cohort_month", "months_since_cohort"])["customer_unique_id"]
        .nunique()
        .reset_index()
        .rename(columns={"customer_unique_id": "customers"})
    )

    pivot = cohort_data.pivot(
        index="cohort_month", columns="months_since_cohort", values="customers"
    ).fillna(0)
    pivot = pivot.sort_index()

    cohorts = pivot.index.tolist()
    months = sorted([c for c in pivot.columns if isinstance(c, (int, float)) and c <= 12])
    pivot = pivot[[m for m in months if m in pivot.columns]]

    cohort_sizes = []
    matrix = []
    for cohort in cohorts:
        row = pivot.loc[cohort]
        size = int(row.get(0, row.iloc[0]))
        cohort_sizes.append(size)
        if size > 0:
            retention_row = [round(float(row.get(m, 0)) / size * 100, 1) for m in months]
        else:
            retention_row = [0.0] * len(months)
        matrix.append(retention_row)

    return {
        "cohorts": cohorts,
        "months": [int(m) for m in months],
        "matrix": matrix,
        "cohort_sizes": cohort_sizes,
    }
