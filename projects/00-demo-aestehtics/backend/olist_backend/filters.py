from typing import Optional

import pandas as pd


def apply_filters(
    df: pd.DataFrame,
    category: Optional[str] = None,
    state: Optional[str] = None,
    payment_type: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
) -> pd.DataFrame:
    filtered = df.copy()
    if category:
        filtered = filtered[filtered["product_category_name"] == category]
    if state:
        filtered = filtered[filtered["customer_state"] == state]
    if payment_type:
        filtered = filtered[filtered["payment_type"] == payment_type]
    if year_start:
        filtered = filtered[filtered["order_month"] >= f"{year_start}-01"]
    if year_end:
        filtered = filtered[filtered["order_month"] <= f"{year_end}-12"]
    return filtered
