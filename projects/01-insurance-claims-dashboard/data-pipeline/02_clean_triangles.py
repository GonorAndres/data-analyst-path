"""
Clean and unify CAS Schedule P data into a single triangles dataset.

Reads 6 raw CSVs (one per line of business), adds a human-readable LOB column,
filters to ~5 representative companies per LOB, and computes derived columns.

Output: data/processed/triangles.parquet
"""

import os

import pandas as pd

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

LOB_MAP = {
    "ppauto_pos.csv": "Private Passenger Auto",
    "comauto_pos.csv": "Commercial Auto",
    "wkcomp_pos.csv": "Workers Compensation",
    "medmal_pos.csv": "Medical Malpractice",
    "othliab_pos.csv": "Other Liability",
    "prodliab_pos.csv": "Product Liability",
}

COMPANIES_PER_LOB = 5


def load_and_tag(filename: str, lob: str) -> pd.DataFrame:
    """Load a single CAS CSV, strip its column suffix, and add LOB column."""
    path = os.path.join(RAW_DIR, filename)
    df = pd.read_csv(path)

    # Each file uses a unique suffix (e.g. _B, _C, _D, _F2, _h1, _R1)
    # Detect the suffix from the IncurLoss column and strip it
    incur_cols = [c for c in df.columns if c.startswith("IncurLoss")]
    if incur_cols:
        suffix = incur_cols[0].replace("IncurLoss", "")
        if suffix:
            renames = {}
            for col in df.columns:
                if col.endswith(suffix):
                    renames[col] = col[: -len(suffix)]
            df.rename(columns=renames, inplace=True)

    df["line_of_business"] = lob
    return df


def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    frames = []
    for filename, lob in LOB_MAP.items():
        path = os.path.join(RAW_DIR, filename)
        if not os.path.exists(path):
            print(f"  WARNING: {filename} not found, skipping")
            continue
        df = load_and_tag(filename, lob)
        print(f"  {lob}: {len(df):,} rows")
        frames.append(df)

    if not frames:
        print("ERROR: No raw CSVs found. Run 01_download_cas.py first.")
        return

    combined = pd.concat(frames, ignore_index=True)
    print(f"\n  Combined: {len(combined):,} rows")

    # Strip whitespace from column names
    combined.columns = [c.strip() for c in combined.columns]

    # Select top N companies per LOB by earned premium volume
    selected_frames = []
    for lob in combined["line_of_business"].unique():
        lob_df = combined[combined["line_of_business"] == lob]
        top_codes = (
            lob_df.groupby("GRCODE")["EarnedPremDIR"]
            .sum()
            .nlargest(COMPANIES_PER_LOB)
            .index.tolist()
        )
        selected_frames.append(lob_df[lob_df["GRCODE"].isin(top_codes)])
        print(f"    {lob}: selected {len(top_codes)} companies")

    combined = pd.concat(selected_frames, ignore_index=True)
    print(f"  After company filter: {len(combined):,} rows")

    # Compute derived columns
    combined["loss_ratio"] = (
        combined["IncurLoss"] / combined["EarnedPremDIR"]
    ).where(combined["EarnedPremDIR"] > 0, 0)

    combined["paid_to_incurred"] = (
        combined["CumPaidLoss"] / combined["IncurLoss"]
    ).where(combined["IncurLoss"] > 0, 0)

    # Clean up types
    for col in ["AccidentYear", "DevelopmentYear", "DevelopmentLag", "GRCODE"]:
        if col in combined.columns:
            combined[col] = combined[col].astype(int)

    # Save
    out_path = os.path.join(PROCESSED_DIR, "triangles.parquet")
    combined.to_parquet(out_path, index=False)
    print(f"\n  Saved: {out_path}")
    print(f"  Shape: {combined.shape}")
    print(f"  LOBs: {combined['line_of_business'].unique().tolist()}")
    print(f"  Companies: {sorted(combined['GRCODE'].unique().tolist())}")
    print(f"  Accident years: {combined['AccidentYear'].min()}-{combined['AccidentYear'].max()}")


if __name__ == "__main__":
    main()
