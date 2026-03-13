"""Load processed parquet files and expose DataFrames + filter utilities."""

import os
from typing import List, Optional

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

_PARQUETS = {
    "monthly_metrics": "monthly_metrics.parquet",
    "segment_metrics": "segment_metrics.parquet",
    "monthly_kpis": "monthly_kpis.parquet",
    "segment_kpis": "segment_kpis.parquet",
}

# ---------------------------------------------------------------------------
# Load data at module import
# ---------------------------------------------------------------------------


def _load(name: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, _PARQUETS[name])
    try:
        df = pd.read_parquet(path)
        if "month" in df.columns:
            df["month"] = pd.to_datetime(df["month"])
        print(f"  Loaded {name}: {len(df):,} rows")
        return df
    except FileNotFoundError:
        print(f"  WARNING: {path} not found -- using empty DataFrame")
        return pd.DataFrame()


monthly_metrics: pd.DataFrame = _load("monthly_metrics")
segment_metrics: pd.DataFrame = _load("segment_metrics")
monthly_kpis: pd.DataFrame = _load("monthly_kpis")
segment_kpis: pd.DataFrame = _load("segment_kpis")

# ---------------------------------------------------------------------------
# Precomputed filter options
# ---------------------------------------------------------------------------

SEGMENTS: List[str] = sorted(
    segment_metrics["segment"].dropna().unique().tolist()
) if "segment" in segment_metrics.columns else ["Starter", "Professional", "Enterprise"]

MONTHS: List[str] = sorted(
    monthly_metrics["month"].dt.strftime("%Y-%m").unique().tolist()
) if "month" in monthly_metrics.columns and not monthly_metrics.empty else []


# ---------------------------------------------------------------------------
# Filtering helper
# ---------------------------------------------------------------------------


def apply_filters(
    df: pd.DataFrame,
    segment: Optional[str] = None,
    start_month: Optional[str] = None,
    end_month: Optional[str] = None,
) -> pd.DataFrame:
    """Filter a DataFrame by segment and/or month range.

    Args:
        df: Source DataFrame.
        segment: Exact match on ``segment`` column (if present).
        start_month: Inclusive lower bound in ``YYYY-MM`` format.
        end_month: Inclusive upper bound in ``YYYY-MM`` format.

    Returns:
        Filtered copy of the DataFrame.
    """
    filtered = df.copy()

    if segment and "segment" in filtered.columns:
        filtered = filtered[filtered["segment"] == segment]

    if "month" in filtered.columns:
        if start_month:
            filtered = filtered[filtered["month"] >= pd.Timestamp(start_month)]
        if end_month:
            # Include the full end month
            filtered = filtered[filtered["month"] <= pd.Timestamp(end_month)]

    return filtered
