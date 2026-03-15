"""
03_enrich.py - Add synthetic columns to the cleaned A/B test data.

Adds realistic dimensions (device, browser, country, revenue, etc.) with
heterogeneous treatment effects that create interesting analytical findings:
    - Treatment works better on mobile than desktop
    - Treatment hurts returning users slightly (Simpson's paradox opportunity)
    - Revenue uplift exists even when conversion uplift is marginal

All randomness is seeded with np.random.seed(42) for full reproducibility.

Usage:
    python data-pipeline/03_enrich.py
"""

from pathlib import Path
import sys

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CLEAN_PARQUET = PROJECT_ROOT / "data" / "processed" / "ab_data_clean.parquet"
ENRICHED_PARQUET = PROJECT_ROOT / "data" / "processed" / "ab_data_enriched.parquet"

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
SEED = 42


def _weighted_choice(
    rng: np.random.RandomState,
    n: int,
    categories: list[str],
    weights: list[float],
) -> np.ndarray:
    """Draw n samples from categories with given weights."""
    return rng.choice(categories, size=n, p=weights)


def enrich(df: pd.DataFrame) -> pd.DataFrame:
    """Add all synthetic columns to the dataframe."""
    rng = np.random.RandomState(SEED)
    n = len(df)

    # ------------------------------------------------------------------
    # 1. Device type  (mobile 55%, desktop 35%, tablet 10%)
    # ------------------------------------------------------------------
    df["device_type"] = _weighted_choice(
        rng, n,
        ["mobile", "desktop", "tablet"],
        [0.55, 0.35, 0.10],
    )

    # ------------------------------------------------------------------
    # 2. Browser
    # ------------------------------------------------------------------
    df["browser"] = _weighted_choice(
        rng, n,
        ["Chrome", "Safari", "Firefox", "Edge"],
        [0.60, 0.20, 0.12, 0.08],
    )

    # ------------------------------------------------------------------
    # 3. Country
    # ------------------------------------------------------------------
    df["country"] = _weighted_choice(
        rng, n,
        ["US", "UK", "Canada", "Germany", "France",
         "Australia", "India", "Brazil", "Japan", "Spain"],
        [0.40, 0.15, 0.10, 0.08, 0.07,
         0.05, 0.05, 0.04, 0.03, 0.03],
    )

    # ------------------------------------------------------------------
    # 4. User segment  (new 70%, returning 30%)
    # ------------------------------------------------------------------
    df["user_segment"] = _weighted_choice(
        rng, n,
        ["new", "returning"],
        [0.70, 0.30],
    )

    # ------------------------------------------------------------------
    # 5. Traffic source
    # ------------------------------------------------------------------
    df["traffic_source"] = _weighted_choice(
        rng, n,
        ["organic", "paid", "social", "referral"],
        [0.40, 0.30, 0.20, 0.10],
    )

    # ------------------------------------------------------------------
    # 6. Heterogeneous treatment effects on conversion
    #    - Mobile + treatment: boost conversion slightly (+1.5 pp)
    #    - Desktop + treatment: no meaningful change
    #    - Returning + treatment: hurt slightly (-1 pp)  -> Simpson's paradox
    # ------------------------------------------------------------------
    converted = df["converted"].values.copy()

    # Mobile + treatment boost
    mask_mobile_treat = (
        (df["device_type"] == "mobile") & (df["group"] == "treatment")
    ).values
    flip_to_1 = mask_mobile_treat & (converted == 0)
    flip_proba = rng.random(n)
    converted[flip_to_1 & (flip_proba < 0.015)] = 1  # ~1.5% of non-converted flip

    # Returning + treatment penalty (Simpson's paradox ingredient)
    mask_return_treat = (
        (df["user_segment"] == "returning") & (df["group"] == "treatment")
    ).values
    flip_to_0 = mask_return_treat & (converted == 1)
    flip_proba2 = rng.random(n)
    converted[flip_to_0 & (flip_proba2 < 0.08)] = 0  # 8% of converted flip back

    df["converted"] = converted

    # ------------------------------------------------------------------
    # 7. Revenue  (lognormal for converted, 0 for non-converted)
    #    Revenue uplift: treatment group converters have slightly higher AOV
    # ------------------------------------------------------------------
    revenue = np.zeros(n, dtype=np.float64)
    converted_mask = df["converted"] == 1

    n_conv = converted_mask.sum()
    base_log_mean = np.log(45)
    sigma = 0.8
    raw_revenue = rng.lognormal(mean=base_log_mean, sigma=sigma, size=n_conv)

    # Treatment converters get a ~8% revenue bump
    treat_conv_mask = (df["group"] == "treatment").values[converted_mask.values]
    raw_revenue[treat_conv_mask] *= 1.08

    revenue[converted_mask.values] = np.round(raw_revenue, 2)
    df["revenue"] = revenue

    # ------------------------------------------------------------------
    # 8. Session duration (seconds) - Gamma distribution
    #    Converted users: shape=3, scale=60  (~180s mean)
    #    Non-converted:   shape=2, scale=45  (~90s mean)
    # ------------------------------------------------------------------
    session = np.zeros(n, dtype=np.float64)
    session[converted_mask.values] = rng.gamma(
        shape=3.0, scale=60.0, size=n_conv
    )
    session[~converted_mask.values] = rng.gamma(
        shape=2.0, scale=45.0, size=(~converted_mask).sum()
    )
    df["session_duration_sec"] = np.round(session, 1)

    # ------------------------------------------------------------------
    # 9. Pages viewed - Poisson
    #    Base lambda=3.5; treatment group gets +0.3
    # ------------------------------------------------------------------
    lam = np.where(df["group"] == "treatment", 3.8, 3.5)
    df["pages_viewed"] = rng.poisson(lam=lam)
    # Ensure at least 1 page viewed
    df["pages_viewed"] = df["pages_viewed"].clip(lower=1)

    return df


def print_enrichment_summary(df: pd.DataFrame) -> None:
    """Print a summary of the enriched dataset."""
    print(f"\n{'=' * 60}")
    print("  ENRICHED DATA SUMMARY")
    print(f"{'=' * 60}")
    print(f"  Rows:          {len(df):,}")
    print(f"  Columns:       {list(df.columns)}")
    print(f"  Dtypes:\n{df.dtypes.to_string()}\n")

    # Conversion rates by group
    cr = df.groupby("group")["converted"].mean()
    print("  Conversion rates by group:")
    for g, r in cr.items():
        print(f"    {g}: {r:.4f}  ({r*100:.2f}%)")

    # HTE: device x group
    print("\n  Conversion by device x group:")
    pivot_dev = df.pivot_table(
        values="converted", index="device_type", columns="group", aggfunc="mean"
    )
    print(pivot_dev.round(4).to_string())

    # HTE: segment x group (Simpson's paradox)
    print("\n  Conversion by user_segment x group:")
    pivot_seg = df.pivot_table(
        values="converted", index="user_segment", columns="group", aggfunc="mean"
    )
    print(pivot_seg.round(4).to_string())

    # Revenue summary
    conv = df[df["converted"] == 1]
    print("\n  Revenue (converted users only):")
    rev_grp = conv.groupby("group")["revenue"].agg(["mean", "median", "std", "count"])
    print(rev_grp.round(2).to_string())

    # Pages viewed
    print("\n  Pages viewed by group:")
    pv = df.groupby("group")["pages_viewed"].mean()
    for g, v in pv.items():
        print(f"    {g}: {v:.2f}")

    # Session duration
    print("\n  Session duration (sec) by group:")
    sd = df.groupby("group")["session_duration_sec"].mean()
    for g, v in sd.items():
        print(f"    {g}: {v:.1f}")


def main() -> None:
    if not CLEAN_PARQUET.exists():
        print(f"ERROR: Cleaned data not found at {CLEAN_PARQUET}")
        print("  Run 02_clean.py first.")
        sys.exit(1)

    print(f"Reading cleaned data from {CLEAN_PARQUET} ...")
    df = pd.read_parquet(CLEAN_PARQUET)
    print(f"  {len(df):,} rows loaded.")

    df = enrich(df)
    print_enrichment_summary(df)

    # Save
    ENRICHED_PARQUET.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(ENRICHED_PARQUET, index=False)
    print(f"\nSaved enriched data to {ENRICHED_PARQUET}")
    print(f"  Size: {ENRICHED_PARQUET.stat().st_size / 1_048_576:.1f} MB")
    print("Done.")


if __name__ == "__main__":
    main()
