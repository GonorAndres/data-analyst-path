from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from olist_backend import data_loader
from olist_backend.filters import apply_filters

router = APIRouter()


@router.get("/rfm")
def rfm(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    payment_type: Optional[str] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    df = apply_filters(data_loader.orders, category, state, payment_type, year_start, year_end)

    if df.empty or "total_payment" not in df.columns:
        return {"segments": []}

    ref_date = pd.to_datetime(df["order_purchase_timestamp"]).max()

    rfm_df = df.groupby("customer_unique_id").agg(
        recency=("order_purchase_timestamp", lambda x: (ref_date - pd.to_datetime(x).max()).days),
        frequency=("order_id", "count"),
        monetary=("total_payment", "sum"),
    ).reset_index()

    rfm_df["r_score"] = pd.qcut(rfm_df["recency"], 4, labels=[4, 3, 2, 1]).astype(int)
    rfm_df["f_score"] = pd.qcut(rfm_df["frequency"].rank(method="first"), 4, labels=[1, 2, 3, 4]).astype(int)
    rfm_df["m_score"] = pd.qcut(rfm_df["monetary"].rank(method="first"), 4, labels=[1, 2, 3, 4]).astype(int)
    rfm_df["rfm_score"] = rfm_df["r_score"] + rfm_df["f_score"] + rfm_df["m_score"]

    def segment(row):
        if row["rfm_score"] >= 11:
            return "Champions"
        elif row["rfm_score"] >= 9:
            return "Loyal"
        elif row["rfm_score"] >= 7:
            return "Potential"
        elif row["r_score"] >= 3:
            return "New"
        elif row["rfm_score"] >= 5:
            return "At Risk"
        return "Hibernating"

    rfm_df["segment"] = rfm_df.apply(segment, axis=1)

    seg_agg = rfm_df.groupby("segment").agg(
        count=("customer_unique_id", "count"),
        avg_recency=("recency", "mean"),
        avg_frequency=("frequency", "mean"),
        avg_monetary=("monetary", "mean"),
    ).reset_index()

    segments = []
    for _, r in seg_agg.iterrows():
        segments.append({
            "segment": r["segment"],
            "count": int(r["count"]),
            "avg_recency": round(float(r["avg_recency"]), 1),
            "avg_frequency": round(float(r["avg_frequency"]), 2),
            "avg_monetary": round(float(r["avg_monetary"]), 2),
        })

    return {"segments": segments}
