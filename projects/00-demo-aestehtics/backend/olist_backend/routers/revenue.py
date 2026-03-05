from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from olist_backend import data_loader
from olist_backend.filters import apply_filters

router = APIRouter()


@router.get("/revenue-trends")
def revenue_trends(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty or "total_payment" not in df.columns:
        return {"months": []}

    agg = (
        df.groupby("order_month")
        .agg(
            order_count=("order_id", "count"),
            revenue=("total_payment", "sum"),
            avg_value=("total_payment", "mean"),
        )
        .reset_index()
        .sort_values("order_month")
    )

    months = []
    for _, r in agg.iterrows():
        months.append({
            "month": str(r["order_month"]),
            "order_count": int(r["order_count"]),
            "revenue": round(float(r["revenue"]), 2) if pd.notna(r["revenue"]) else 0.0,
            "avg_value": round(float(r["avg_value"]), 2) if pd.notna(r["avg_value"]) else 0.0,
        })

    return {"months": months}
