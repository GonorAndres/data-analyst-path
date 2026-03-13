"""Load enriched A/B test parquet and precompute filter options."""

import os
from typing import Optional

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")
PARQUET_PATH = os.path.join(DATA_DIR, "ab_data_enriched.parquet")

# ---------------------------------------------------------------------------
# Load data at module import
# ---------------------------------------------------------------------------
try:
    df: pd.DataFrame = pd.read_parquet(PARQUET_PATH)
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    if "date" not in df.columns and "timestamp" in df.columns:
        df["date"] = df["timestamp"].dt.date
    print(f"  Loaded ab_data_enriched: {len(df):,} rows")
except FileNotFoundError:
    print(f"  WARNING: {PARQUET_PATH} not found -- using empty DataFrame")
    df = pd.DataFrame()

# ---------------------------------------------------------------------------
# Precomputed filter options
# ---------------------------------------------------------------------------
DEVICE_TYPES = sorted(
    df["device_type"].dropna().unique().tolist()
) if "device_type" in df.columns else []

BROWSERS = sorted(
    df["browser"].dropna().unique().tolist()
) if "browser" in df.columns else []

COUNTRIES = sorted(
    df["country"].dropna().unique().tolist()
) if "country" in df.columns else []

USER_SEGMENTS = sorted(
    df["user_segment"].dropna().unique().tolist()
) if "user_segment" in df.columns else []

TRAFFIC_SOURCES = sorted(
    df["traffic_source"].dropna().unique().tolist()
) if "traffic_source" in df.columns else []


def apply_filters(
    source: pd.DataFrame,
    device_type: Optional[str] = None,
    browser: Optional[str] = None,
    country: Optional[str] = None,
    user_segment: Optional[str] = None,
    traffic_source: Optional[str] = None,
) -> pd.DataFrame:
    """Filter the dataframe by the provided segment dimensions.

    Args:
        source: Source DataFrame.
        device_type: Exact match on device_type column.
        browser: Exact match on browser column.
        country: Exact match on country column.
        user_segment: Exact match on user_segment column.
        traffic_source: Exact match on traffic_source column.

    Returns:
        Filtered copy of the DataFrame.
    """
    filtered = source

    if device_type and "device_type" in filtered.columns:
        filtered = filtered[filtered["device_type"] == device_type]

    if browser and "browser" in filtered.columns:
        filtered = filtered[filtered["browser"] == browser]

    if country and "country" in filtered.columns:
        filtered = filtered[filtered["country"] == country]

    if user_segment and "user_segment" in filtered.columns:
        filtered = filtered[filtered["user_segment"] == user_segment]

    if traffic_source and "traffic_source" in filtered.columns:
        filtered = filtered[filtered["traffic_source"] == traffic_source]

    return filtered
