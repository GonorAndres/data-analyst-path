"""Cached data loading functions for the Streamlit dashboard."""

import os
import pandas as pd
import streamlit as st

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")


def _load(filename: str) -> pd.DataFrame | None:
    path = os.path.join(_DATA_DIR, filename)
    try:
        return pd.read_parquet(path)
    except Exception:
        return None


@st.cache_data
def load_orders() -> pd.DataFrame | None:
    return _load("orders_enriched.parquet")


@st.cache_data
def load_customers() -> pd.DataFrame | None:
    return _load("customers_summary.parquet")


@st.cache_data
def load_cohort_retention() -> pd.DataFrame | None:
    return _load("cohort_retention_matrix.parquet")


@st.cache_data
def load_cohort_revenue() -> pd.DataFrame | None:
    return _load("cohort_revenue_retention.parquet")


@st.cache_data
def load_survival() -> pd.DataFrame | None:
    return _load("survival_data.parquet")


@st.cache_data
def load_rfm() -> pd.DataFrame | None:
    return _load("rfm_segments.parquet")


@st.cache_data
def load_ltv_curves() -> pd.DataFrame | None:
    return _load("ltv_curves.parquet")


@st.cache_data
def load_activation() -> pd.DataFrame | None:
    return _load("activation_coefficients.parquet")
