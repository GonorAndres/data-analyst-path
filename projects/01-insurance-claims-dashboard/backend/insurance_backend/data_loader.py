import os

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed")

# --- Triangles (Schedule P loss development data) ---
try:
    triangles: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "triangles.parquet"))
    print(f"  Loaded triangles: {len(triangles):,} rows")
except FileNotFoundError:
    print("  WARNING: triangles.parquet not found -- using empty DataFrame")
    triangles = pd.DataFrame()

# --- Synthetic individual claims ---
try:
    claims: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "claims_synthetic.parquet"))
    # Ensure accident_year column exists for filtering
    if "accident_date" in claims.columns:
        claims["accident_year"] = pd.to_datetime(claims["accident_date"]).dt.year
    print(f"  Loaded claims: {len(claims):,} rows")
except FileNotFoundError:
    print("  WARNING: claims_synthetic.parquet not found -- using empty DataFrame")
    claims = pd.DataFrame()

# --- IBNR results (Chain-Ladder / BF estimates by LOB and accident year) ---
try:
    ibnr_results: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "ibnr_results.parquet"))
    print(f"  Loaded ibnr_results: {len(ibnr_results):,} rows")
except FileNotFoundError:
    print("  WARNING: ibnr_results.parquet not found -- using empty DataFrame")
    ibnr_results = pd.DataFrame()

# --- LOB summary (aggregate metrics per line of business) ---
try:
    lob_summary: pd.DataFrame = pd.read_parquet(os.path.join(DATA_DIR, "lob_summary.parquet"))
    print(f"  Loaded lob_summary: {len(lob_summary):,} rows")
except FileNotFoundError:
    print("  WARNING: lob_summary.parquet not found -- using empty DataFrame")
    lob_summary = pd.DataFrame()

# --- Precomputed filter option lists ---
LINES_OF_BUSINESS = sorted(
    triangles["line_of_business"].dropna().unique().tolist()
) if "line_of_business" in triangles.columns else []

COMPANIES = sorted(
    triangles[["GRCODE", "GRNAME"]]
    .drop_duplicates()
    .apply(lambda r: {"grcode": int(r["GRCODE"]), "grname": r["GRNAME"]}, axis=1)
    .tolist(),
    key=lambda x: x["grname"],
) if {"GRCODE", "GRNAME"}.issubset(triangles.columns) else []

ACCIDENT_YEARS = sorted(
    triangles["AccidentYear"].dropna().unique().astype(int).tolist()
) if "AccidentYear" in triangles.columns else []
