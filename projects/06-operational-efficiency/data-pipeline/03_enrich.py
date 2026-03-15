"""
03_enrich.py -- Feature engineering on cleaned NYC 311 data.

Reads data/processed/nyc311_clean.parquet, adds derived columns for analysis,
and saves data/processed/nyc311_enriched.parquet.

Usage:
    python data-pipeline/03_enrich.py
"""

from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
INPUT_FILE = PROJECT_DIR / "data" / "processed" / "nyc311_clean.parquet"
OUTPUT_FILE = PROJECT_DIR / "data" / "processed" / "nyc311_enriched.parquet"

# ---------------------------------------------------------------------------
# Mappings
# ---------------------------------------------------------------------------
DOW_SPANISH = {
    "Monday": "Lunes",
    "Tuesday": "Martes",
    "Wednesday": "Miercoles",
    "Thursday": "Jueves",
    "Friday": "Viernes",
    "Saturday": "Sabado",
    "Sunday": "Domingo",
}

STATUS_TO_STAGE = {
    "Open": "Abierto",
    "In Progress": "En Progreso",
    "Assigned": "En Progreso",
    "Started": "En Progreso",
    "Closed": "Cerrado",
    "Pending": "Pendiente",
}

TOP_N_COMPLAINTS = 20


# ---------------------------------------------------------------------------
# Feature functions
# ---------------------------------------------------------------------------


def add_resolution_time(df: pd.DataFrame) -> pd.DataFrame:
    """Add resolution_hours and resolution_days."""
    delta = df["closed_date"] - df["created_date"]
    df["resolution_hours"] = delta.dt.total_seconds() / 3600
    df["resolution_days"] = df["resolution_hours"] / 24
    return df


def add_is_overdue(df: pd.DataFrame) -> pd.DataFrame:
    """True if closed_date > due_date; null if either is missing."""
    has_both = df["closed_date"].notna() & df["due_date"].notna()
    df["is_overdue"] = np.where(
        has_both,
        df["closed_date"] > df["due_date"],
        None,
    )
    # Convert to nullable boolean
    df["is_overdue"] = df["is_overdue"].astype("object")
    df.loc[~has_both, "is_overdue"] = None
    return df


def add_response_category(df: pd.DataFrame) -> pd.DataFrame:
    """Bucket resolution_days into human-readable categories."""
    conditions = [
        df["resolution_days"].isna(),
        df["resolution_days"] < 1,
        df["resolution_days"] < 3,
        df["resolution_days"] < 7,
        df["resolution_days"] < 30,
        df["resolution_days"] >= 30,
    ]
    choices = [
        None,
        "< 1 dia",
        "1-3 dias",
        "3-7 dias",
        "7-30 dias",
        "> 30 dias",
    ]
    df["response_category"] = np.select(
        conditions, choices, default=None
    )
    df.loc[df["response_category"] == "0", "response_category"] = None
    return df


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add created_month, created_dow (Spanish), created_hour."""
    df["created_month"] = df["created_date"].dt.strftime("%Y-%m")
    df["created_dow"] = df["created_date"].dt.day_name().map(DOW_SPANISH)
    df["created_hour"] = df["created_date"].dt.hour
    return df


def add_complaint_category(df: pd.DataFrame) -> pd.DataFrame:
    """Keep top N complaint types by frequency; rest become 'Otros'."""
    top = df["complaint_type"].value_counts().nlargest(TOP_N_COMPLAINTS).index
    df["complaint_category"] = df["complaint_type"].where(
        df["complaint_type"].isin(top), other="Otros"
    )
    return df


def add_process_stage(df: pd.DataFrame) -> pd.DataFrame:
    """Map status to Sankey-friendly process stages."""
    df["process_stage"] = df["status"].map(STATUS_TO_STAGE).fillna("Otro")
    return df


def add_sla_status(df: pd.DataFrame) -> pd.DataFrame:
    """Classify SLA compliance: Cumple / Incumple / Sin SLA."""
    has_due = df["due_date"].notna()
    overdue = df["closed_date"] > df["due_date"]
    # Default: Sin SLA
    df["sla_status"] = "Sin SLA"
    # Has due date and met it (or still open but not yet overdue with closed before due)
    df.loc[has_due & ~overdue, "sla_status"] = "Cumple"
    df.loc[has_due & overdue, "sla_status"] = "Incumple"
    # If due_date exists but closed_date is null, check if still within SLA
    # (open tickets with a due date -- mark as Cumple if due hasn't passed,
    #  but since overdue comparison returns False when closed_date is NaT,
    #  they already fall into "Cumple". Adjust: truly open + past due = Incumple)
    open_past_due = has_due & df["closed_date"].isna() & (pd.Timestamp.now() > df["due_date"])
    df.loc[open_past_due, "sla_status"] = "Incumple"
    return df


def report(df: pd.DataFrame) -> None:
    """Print summary statistics for enriched data."""
    print("\n--- Enriched Data Summary ---")
    print(f"Total rows: {len(df):,}")
    print(f"Columns:    {len(df.columns)}")

    if "resolution_days" in df.columns:
        resolved = df["resolution_days"].dropna()
        print(f"\nResolution time (days) -- resolved tickets only:")
        print(f"  Count:  {len(resolved):,}")
        print(f"  Mean:   {resolved.mean():.2f}")
        print(f"  Median: {resolved.median():.2f}")
        print(f"  P95:    {resolved.quantile(0.95):.2f}")

    if "is_overdue" in df.columns:
        overdue_counts = df["is_overdue"].value_counts(dropna=False)
        print(f"\nOverdue distribution:")
        for val, cnt in overdue_counts.items():
            print(f"  {str(val):10s}  {cnt:>10,}")

    if "response_category" in df.columns:
        print(f"\nResponse category distribution:")
        cat_counts = df["response_category"].value_counts(dropna=False)
        for val, cnt in cat_counts.items():
            print(f"  {str(val):15s}  {cnt:>10,}")

    if "sla_status" in df.columns:
        print(f"\nSLA status distribution:")
        sla_counts = df["sla_status"].value_counts()
        for val, cnt in sla_counts.items():
            print(f"  {val:15s}  {cnt:>10,}")

    if "process_stage" in df.columns:
        print(f"\nProcess stage distribution:")
        stage_counts = df["process_stage"].value_counts()
        for val, cnt in stage_counts.items():
            print(f"  {val:15s}  {cnt:>10,}")

    if "complaint_category" in df.columns:
        n_otros = (df["complaint_category"] == "Otros").sum()
        n_top = len(df) - n_otros
        print(f"\nComplaint categories: top {TOP_N_COMPLAINTS} cover {n_top:,} rows "
              f"({n_top / len(df) * 100:.1f}%), 'Otros' covers {n_otros:,} rows")

    print(f"\nNew columns added:")
    new_cols = [
        "resolution_hours", "resolution_days", "is_overdue",
        "response_category", "created_month", "created_dow",
        "created_hour", "complaint_category", "process_stage", "sla_status",
    ]
    for col in new_cols:
        if col in df.columns:
            nulls = df[col].isna().sum()
            print(f"  {col:25s}  nulls: {nulls:>10,}")


def main() -> None:
    print("=" * 60)
    print("NYC 311 Feature Engineering")
    print("=" * 60)

    print(f"\nReading {INPUT_FILE} ...")
    df = pd.read_parquet(INPUT_FILE, engine="pyarrow")
    print(f"  Rows: {len(df):,}  Columns: {len(df.columns)}")

    print("\nAdding features:")
    print("  - resolution_hours, resolution_days")
    df = add_resolution_time(df)

    print("  - is_overdue")
    df = add_is_overdue(df)

    print("  - response_category")
    df = add_response_category(df)

    print("  - created_month, created_dow, created_hour")
    df = add_time_features(df)

    print("  - complaint_category")
    df = add_complaint_category(df)

    print("  - process_stage")
    df = add_process_stage(df)

    print("  - sla_status")
    df = add_sla_status(df)

    report(df)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUTPUT_FILE, engine="pyarrow", index=False)
    print(f"\nSaved to {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1e6:.1f} MB)")
    print("Done.")


if __name__ == "__main__":
    main()
