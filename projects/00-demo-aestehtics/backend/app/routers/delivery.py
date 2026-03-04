from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from app import data_loader
from app.filters import apply_filters

router = APIRouter()


@router.get("/delivery-review")
def delivery_review(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty or "delivery_days" not in df.columns:
        return {"bins": []}

    valid = df.dropna(subset=["delivery_days", "review_score"]).copy()
    valid = valid[valid["delivery_days"] >= 0]

    bins = [0, 7, 14, 21, 30, 60, 999]
    labels = ["0-7", "8-14", "15-21", "22-30", "31-60", "60+"]
    valid["delivery_bin"] = pd.cut(valid["delivery_days"], bins=bins, labels=labels, right=True)

    agg = valid.groupby("delivery_bin", observed=True).agg(
        avg_review=("review_score", "mean"),
        order_count=("order_id", "count"),
        pct_late=("late_delivery", "mean"),
    ).reset_index()

    result_bins = []
    for _, r in agg.iterrows():
        result_bins.append({
            "bin": str(r["delivery_bin"]),
            "avg_review": round(float(r["avg_review"]), 2) if pd.notna(r["avg_review"]) else None,
            "order_count": int(r["order_count"]),
            "pct_late": round(float(r["pct_late"]) * 100, 1) if pd.notna(r["pct_late"]) else 0.0,
        })

    return {"bins": result_bins}
