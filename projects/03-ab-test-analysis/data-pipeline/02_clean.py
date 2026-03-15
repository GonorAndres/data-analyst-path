"""
02_clean.py - Clean the raw Udacity A/B test dataset.

Steps:
    1. Read ab_data.csv from data/raw/
    2. Drop ~3,893 mismatched rows (group/landing_page inconsistency)
    3. Remove duplicate user_ids (keep first occurrence)
    4. Parse timestamp to datetime
    5. Print summary stats before & after cleaning
    6. Save to data/processed/ab_data_clean.parquet

Usage:
    python data-pipeline/02_clean.py
"""

from pathlib import Path
import sys

import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_CSV = PROJECT_ROOT / "data" / "raw" / "ab_data.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
CLEAN_PARQUET = PROCESSED_DIR / "ab_data_clean.parquet"


def print_summary(df: pd.DataFrame, label: str) -> None:
    """Print key summary statistics for the dataframe."""
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}")
    print(f"  Rows:            {len(df):,}")
    print(f"  Unique users:    {df['user_id'].nunique():,}")
    print(f"  Groups:          {df['group'].value_counts().to_dict()}")
    print(f"  Landing pages:   {df['landing_page'].value_counts().to_dict()}")
    print(f"  Converted (mean):{df['converted'].mean():.4f}")
    print(f"  Null counts:\n{df.isnull().sum().to_string()}")

    # Mismatch check
    mismatch_mask = (
        ((df["group"] == "treatment") & (df["landing_page"] == "old_page"))
        | ((df["group"] == "control") & (df["landing_page"] == "new_page"))
    )
    print(f"  Mismatched rows: {mismatch_mask.sum():,}")

    dup_users = df["user_id"].duplicated().sum()
    print(f"  Duplicate users: {dup_users:,}")


def main() -> None:
    if not RAW_CSV.exists():
        print(f"ERROR: Raw data not found at {RAW_CSV}")
        print("  Run 01_download.py first.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # 1. Read raw data
    # ------------------------------------------------------------------
    df = pd.read_csv(RAW_CSV)
    print_summary(df, "BEFORE CLEANING")

    initial_rows = len(df)

    # ------------------------------------------------------------------
    # 2. Drop mismatched group/landing_page rows
    # ------------------------------------------------------------------
    mismatch_mask = (
        ((df["group"] == "treatment") & (df["landing_page"] == "old_page"))
        | ((df["group"] == "control") & (df["landing_page"] == "new_page"))
    )
    n_mismatch = mismatch_mask.sum()
    df = df[~mismatch_mask].copy()
    print(f"\nDropped {n_mismatch:,} mismatched rows.")

    # ------------------------------------------------------------------
    # 3. Remove duplicate user_ids (keep first)
    # ------------------------------------------------------------------
    n_before = len(df)
    df = df.drop_duplicates(subset="user_id", keep="first")
    n_dup = n_before - len(df)
    print(f"Dropped {n_dup:,} duplicate user_id rows.")

    # ------------------------------------------------------------------
    # 4. Parse timestamp to datetime
    # ------------------------------------------------------------------
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # ------------------------------------------------------------------
    # 5. Summary after cleaning
    # ------------------------------------------------------------------
    print_summary(df, "AFTER CLEANING")
    print(f"\nTotal rows removed: {initial_rows - len(df):,}")

    # ------------------------------------------------------------------
    # 6. Save cleaned data
    # ------------------------------------------------------------------
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_parquet(CLEAN_PARQUET, index=False)
    print(f"\nSaved cleaned data to {CLEAN_PARQUET}")
    print(f"  Size: {CLEAN_PARQUET.stat().st_size / 1_048_576:.1f} MB")
    print("Done.")


if __name__ == "__main__":
    main()
