from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from olist_backend import data_loader
from olist_backend.filters import apply_filters

router = APIRouter()


@router.get("/category-breakdown")
def category_breakdown(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty or "product_category_name" not in df.columns:
        return {"categories": []}

    valid = df[df["product_category_name"].notna()]

    agg = (
        valid.groupby("product_category_name")
        .agg(
            revenue=("total_payment", "sum"),
            order_count=("order_id", "count"),
            avg_price=("total_payment", "mean"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
        .head(15)
    )

    categories = []
    for _, r in agg.iterrows():
        categories.append({
            "name": str(r["product_category_name"]),
            "revenue": round(float(r["revenue"]), 2) if pd.notna(r["revenue"]) else 0.0,
            "order_count": int(r["order_count"]),
            "avg_price": round(float(r["avg_price"]), 2) if pd.notna(r["avg_price"]) else 0.0,
        })

    return {"categories": categories}
