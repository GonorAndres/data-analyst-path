from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from olist_backend import data_loader
from olist_backend.filters import apply_filters

router = APIRouter()


@router.get("/geo-states")
def geo_states(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty:
        return {"states": []}

    agg = (
        df.groupby("customer_state")
        .agg(
            order_count=("order_id", "count"),
            avg_order_value=("total_payment", "mean"),
            avg_review_score=("review_score", "mean"),
        )
        .reset_index()
    )

    states = []
    for _, r in agg.iterrows():
        states.append({
            "state": r["customer_state"],
            "order_count": int(r["order_count"]),
            "avg_order_value": round(float(r["avg_order_value"]), 2) if pd.notna(r["avg_order_value"]) else 0.0,
            "avg_review_score": round(float(r["avg_review_score"]), 2) if pd.notna(r["avg_review_score"]) else None,
        })

    return {"states": states}
