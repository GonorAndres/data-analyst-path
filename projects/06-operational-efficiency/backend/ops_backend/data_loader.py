"""Load enriched NYC 311 parquet and precompute filter options."""

import os
from typing import Optional

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")
PARQUET_PATH = os.path.join(DATA_DIR, "nyc311_enriched.parquet")

# ---------------------------------------------------------------------------
# Load data at module import
# ---------------------------------------------------------------------------
REQUIRED_COLUMNS = [
    "agency_name", "borough", "complaint_category", "created_month",
    "open_data_channel_type", "resolution_days", "status", "sla_status",
]

try:
    df: pd.DataFrame = pd.read_parquet(PARQUET_PATH, columns=REQUIRED_COLUMNS)
    print(f"  Loaded nyc311_enriched: {len(df):,} rows")
except FileNotFoundError:
    print(f"  WARNING: {PARQUET_PATH} not found -- using empty DataFrame")
    df = pd.DataFrame()

# ---------------------------------------------------------------------------
# Precomputed filter options
# ---------------------------------------------------------------------------
AGENCIES = sorted(
    df["agency_name"].dropna().unique().tolist()
) if "agency_name" in df.columns else []

COMPLAINT_TYPES = sorted(
    df["complaint_category"].dropna().unique().tolist()
) if "complaint_category" in df.columns else []

BOROUGHS = sorted(
    df["borough"].dropna().unique().tolist()
) if "borough" in df.columns else []

CHANNELS = sorted(
    df["open_data_channel_type"].dropna().unique().tolist()
) if "open_data_channel_type" in df.columns else []

YEAR_MONTHS = sorted(
    df["created_month"].dropna().unique().tolist()
) if "created_month" in df.columns else []


def apply_filters(
    source: pd.DataFrame,
    agency: Optional[str] = None,
    complaint_type: Optional[str] = None,
    borough: Optional[str] = None,
    channel: Optional[str] = None,
    year_month: Optional[str] = None,
) -> pd.DataFrame:
    """Filter the dataframe by the provided dimensions.

    Args:
        source: Source DataFrame.
        agency: Exact match on agency_name column.
        complaint_type: Exact match on complaint_category column.
        borough: Exact match on borough column.
        channel: Exact match on open_data_channel_type column.
        year_month: Exact match on created_month column.

    Returns:
        Filtered copy of the DataFrame.
    """
    filtered = source

    if agency and "agency_name" in filtered.columns:
        filtered = filtered[filtered["agency_name"] == agency]

    if complaint_type and "complaint_category" in filtered.columns:
        filtered = filtered[filtered["complaint_category"] == complaint_type]

    if borough and "borough" in filtered.columns:
        filtered = filtered[filtered["borough"] == borough]

    if channel and "open_data_channel_type" in filtered.columns:
        filtered = filtered[filtered["open_data_channel_type"] == channel]

    if year_month and "created_month" in filtered.columns:
        filtered = filtered[filtered["created_month"] == year_month]

    return filtered
