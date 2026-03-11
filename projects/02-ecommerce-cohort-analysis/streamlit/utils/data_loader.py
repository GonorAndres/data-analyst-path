"""Cached data loading functions for the Streamlit dashboard."""

import logging
import os
import pandas as pd
import streamlit as st

logger = logging.getLogger(__name__)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")


def _load(filename: str) -> pd.DataFrame | None:
    path = os.path.join(_DATA_DIR, filename)
    try:
        return pd.read_parquet(path)
    except Exception as e:
        logger.warning("Failed to load %s: %s", filename, e)
        return None


def validate_columns(df: pd.DataFrame, required: list[str], dataset_name: str) -> bool:
    """Check that *df* contains all *required* columns.

    Returns True if valid.  On failure, shows ``st.error`` with the missing
    columns and calls ``st.stop()``.
    """
    missing = [c for c in required if c not in df.columns]
    if missing:
        st.error(
            f"El dataset '{dataset_name}' no contiene las columnas esperadas: "
            f"{', '.join(missing)}. Verifica que los parquet estén actualizados."
        )
        st.stop()
        return False
    return True


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
