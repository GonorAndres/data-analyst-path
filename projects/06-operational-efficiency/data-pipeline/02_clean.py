"""
02_clean.py -- Clean raw NYC 311 data and output parquet.

Reads data/raw/nyc311_raw.csv, applies cleaning transformations, and saves
data/processed/nyc311_clean.parquet.

Usage:
    python data-pipeline/02_clean.py
"""

from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_DIR / "data" / "raw" / "nyc311_raw.csv"
OUTPUT_FILE = PROJECT_DIR / "data" / "processed" / "nyc311_clean.parquet"

DATETIME_COLS = ["created_date", "closed_date", "due_date"]


def load_raw(path: Path) -> pd.DataFrame:
    """Load the raw CSV."""
    print(f"Reading {path} ...")
    df = pd.read_csv(path, dtype=str)
    print(f"  Rows loaded: {len(df):,}")
    return df


def parse_dates(df: pd.DataFrame) -> pd.DataFrame:
    """Parse datetime columns, coercing errors to NaT."""
    for col in DATETIME_COLS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce", utc=True)
            # Strip timezone to naive UTC for downstream simplicity
            df[col] = df[col].dt.tz_localize(None)
    return df


def drop_null_created(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows where created_date is null."""
    before = len(df)
    df = df.dropna(subset=["created_date"])
    dropped = before - len(df)
    if dropped:
        print(f"  Dropped {dropped:,} rows with null created_date")
    return df


def standardize_borough(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace, title case, map 'Unspecified' to null."""
    df["borough"] = df["borough"].str.strip().str.title()
    df.loc[df["borough"] == "Unspecified", "borough"] = None
    return df


def standardize_agency(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace and uppercase agency codes."""
    df["agency"] = df["agency"].str.strip().str.upper()
    return df


def standardize_status(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace and title-case status values."""
    df["status"] = df["status"].str.strip().str.title()
    return df


def fix_closed_before_created(df: pd.DataFrame) -> pd.DataFrame:
    """Set closed_date to null where it precedes created_date."""
    mask = df["closed_date"] < df["created_date"]
    n = mask.sum()
    if n:
        print(f"  Fixed {n:,} rows where closed_date < created_date")
        df.loc[mask, "closed_date"] = pd.NaT
    return df


def deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicate unique_key values, keeping first occurrence."""
    before = len(df)
    df = df.drop_duplicates(subset=["unique_key"], keep="first")
    dropped = before - len(df)
    if dropped:
        print(f"  Removed {dropped:,} duplicate unique_key rows")
    return df


def report(df: pd.DataFrame) -> None:
    """Print summary statistics."""
    print("\n--- Null counts per column ---")
    nulls = df.isnull().sum()
    for col, n in nulls.items():
        pct = n / len(df) * 100
        print(f"  {col:30s}  {n:>10,}  ({pct:5.1f}%)")
    print(f"\nFinal row count: {len(df):,}")
    print(f"Columns: {list(df.columns)}")


def main() -> None:
    print("=" * 60)
    print("NYC 311 Data Cleaning")
    print("=" * 60)

    df = load_raw(INPUT_FILE)
    rows_before = len(df)

    print("\nCleaning steps:")
    df = parse_dates(df)
    df = drop_null_created(df)
    df = standardize_borough(df)
    df = standardize_agency(df)
    df = standardize_status(df)
    df = fix_closed_before_created(df)
    df = deduplicate(df)

    rows_after = len(df)
    print(f"\nRows before cleaning: {rows_before:,}")
    print(f"Rows after cleaning:  {rows_after:,}")
    print(f"Rows removed:         {rows_before - rows_after:,}")

    report(df)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUTPUT_FILE, engine="pyarrow", index=False)
    print(f"\nSaved to {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1e6:.1f} MB)")
    print("Done.")


if __name__ == "__main__":
    main()
