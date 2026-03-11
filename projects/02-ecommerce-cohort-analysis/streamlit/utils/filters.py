"""Filter helper functions reading from st.session_state."""

import pandas as pd
import streamlit as st


def apply_date_filter(orders_df: pd.DataFrame) -> pd.DataFrame:
    """Filter orders_df by session_state date range."""
    start = st.session_state.get("date_start")
    end = st.session_state.get("date_end")
    if start is None or end is None:
        return orders_df
    mask = (
        (orders_df["order_purchase_timestamp"].dt.date >= start)
        & (orders_df["order_purchase_timestamp"].dt.date <= end)
    )
    return orders_df[mask].copy()


def apply_cohort_size_filter(retention_df: pd.DataFrame, raw_retention_df: pd.DataFrame) -> pd.DataFrame:
    """Filter retention_df to cohorts with min_cohort_size customers in month 0."""
    min_size = st.session_state.get("min_cohort_size", 50)
    valid = raw_retention_df.index[raw_retention_df.iloc[:, 0] >= min_size]
    return retention_df.loc[retention_df.index.isin(valid)]


def apply_segment_filter(rfm_df: pd.DataFrame) -> pd.DataFrame:
    """Filter rfm_df to selected segments. If empty/all, return full df."""
    selected = st.session_state.get("selected_segments", [])
    all_segs = rfm_df["segment"].unique().tolist()
    if not selected or set(selected) == set(all_segs):
        return rfm_df
    return rfm_df[rfm_df["segment"].isin(selected)].copy()
