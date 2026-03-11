"""Cached data loading functions for the Streamlit dashboard."""

import logging
import os
import pandas as pd
import streamlit as st

logger = logging.getLogger(__name__)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

# English -> natural Spanish mapping for RFM segments
SEGMENT_ES: dict[str, str] = {
    "Champions": "Alto Valor",
    "Loyal": "Leales",
    "Potential Loyalist": "Potencial Leal",
    "New": "Nuevos",
    "Promising": "Prometedores",
    "Need Attention": "Requieren Atencion",
    "At Risk": "En Riesgo",
    "Hibernating": "Inactivos",
    "Lost": "Perdidos",
    "Other": "Otros",
}


def _translate_segments(df: pd.DataFrame) -> pd.DataFrame:
    """Replace English segment names with Spanish equivalents."""
    if "segment" in df.columns:
        df["segment"] = df["segment"].map(SEGMENT_ES).fillna(df["segment"])
    return df


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
    df = _load("rfm_segments.parquet")
    return _translate_segments(df) if df is not None else None


@st.cache_data
def load_ltv_curves() -> pd.DataFrame | None:
    df = _load("ltv_curves.parquet")
    return _translate_segments(df) if df is not None else None


@st.cache_data
def load_activation() -> pd.DataFrame | None:
    return _load("activation_coefficients.parquet")
