"""
Compute IBNR reserves using chain-ladder and Bornhuetter-Ferguson methods.

The CAS Schedule P data includes full development history (beyond 1997).
We simulate a valuation as-of 12/31/1997 by truncating to DevelopmentYear <= 1997,
then project ultimates using chain-ladder. We can then compare projections
to known actuals using the full development data.

Output:
- data/processed/ibnr_results.parquet  (per accident year per LOB)
- data/processed/lob_summary.parquet   (aggregated by LOB)
"""

import os
import warnings

import numpy as np
import pandas as pd

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
VALUATION_YEAR = 1997

warnings.filterwarnings("ignore", category=FutureWarning)


def build_triangle(df: pd.DataFrame, lob: str, value_col: str = "IncurLoss") -> pd.DataFrame:
    """
    Build a cumulative loss triangle as-of the valuation date.

    Filters to DevelopmentYear <= VALUATION_YEAR to create the proper
    upper-left triangle shape with NaN in the lower-right.
    """
    lob_data = df[
        (df["line_of_business"] == lob)
        & (df["DevelopmentYear"] <= VALUATION_YEAR)
    ].copy()

    pivot = lob_data.pivot_table(
        index="AccidentYear",
        columns="DevelopmentLag",
        values=value_col,
        aggfunc="sum",
    )
    return pivot


def build_full_triangle(df: pd.DataFrame, lob: str, value_col: str = "IncurLoss") -> pd.DataFrame:
    """Build the full (known ultimate) triangle using all available development data."""
    lob_data = df[df["line_of_business"] == lob].copy()
    pivot = lob_data.pivot_table(
        index="AccidentYear",
        columns="DevelopmentLag",
        values=value_col,
        aggfunc="sum",
    )
    return pivot


def chain_ladder(triangle: pd.DataFrame) -> dict:
    """
    Chain-ladder development method.

    Computes volume-weighted age-to-age factors from the triangle,
    then projects each accident year to ultimate.
    """
    years = sorted(triangle.index)
    dev_lags = sorted(triangle.columns)
    n_lags = len(dev_lags)

    # Age-to-age development factors (volume-weighted)
    factors = {}
    for j in range(n_lags - 1):
        col_curr = dev_lags[j]
        col_next = dev_lags[j + 1]

        numerator = 0.0
        denominator = 0.0
        for year in years:
            val_curr = triangle.loc[year, col_curr] if col_curr in triangle.columns else np.nan
            val_next = triangle.loc[year, col_next] if col_next in triangle.columns else np.nan
            if pd.notna(val_curr) and pd.notna(val_next) and val_curr > 0:
                numerator += val_next
                denominator += val_curr

        if denominator > 0:
            factors[f"{col_curr}-{col_next}"] = numerator / denominator
        else:
            factors[f"{col_curr}-{col_next}"] = 1.0

    # Cumulative development factors (CDF) to ultimate
    factor_values = list(factors.values())
    cdfs = {}
    for j in range(n_lags):
        cdf = 1.0
        for k in range(j, n_lags - 1):
            cdf *= factor_values[k]
        cdfs[dev_lags[j]] = cdf

    # Project ultimates
    results = []
    for year in years:
        # Find latest available lag for this year
        row = triangle.loc[year]
        available = row.dropna()
        if available.empty:
            results.append({
                "accident_year": int(year),
                "latest_lag": 0,
                "reported": 0,
                "cdf_to_ultimate": 1.0,
                "ultimate_cl": 0,
                "ibnr_cl": 0,
            })
            continue

        latest_lag = available.index.max()
        reported = float(available[latest_lag])
        cdf = cdfs.get(latest_lag, 1.0)
        ultimate = reported * cdf
        ibnr = max(0, ultimate - reported)

        results.append({
            "accident_year": int(year),
            "latest_lag": int(latest_lag),
            "reported": round(reported),
            "cdf_to_ultimate": round(cdf, 4),
            "ultimate_cl": round(ultimate),
            "ibnr_cl": round(ibnr),
        })

    return {
        "factors": factors,
        "cdfs": cdfs,
        "results": results,
    }


def bornhuetter_ferguson(
    triangle: pd.DataFrame,
    earned_premium: dict,
    cl_cdfs: dict,
    apriori_lr: float = 0.65,
) -> list[dict]:
    """
    Bornhuetter-Ferguson method.

    BF IBNR = Expected Loss * (1 - 1/CDF)
    """
    years = sorted(triangle.index)
    results = []

    for year in years:
        row = triangle.loc[year]
        available = row.dropna()
        if available.empty:
            results.append({"accident_year": int(year), "ultimate_bf": 0, "ibnr_bf": 0})
            continue

        latest_lag = available.index.max()
        reported = float(available[latest_lag])
        cdf = cl_cdfs.get(latest_lag, 1.0)
        prem = earned_premium.get(year, 0)
        expected_loss = prem * apriori_lr

        pct_unreported = max(0, 1 - 1 / cdf) if cdf > 1 else 0
        ibnr_bf = expected_loss * pct_unreported
        ultimate_bf = reported + ibnr_bf

        # Guard against NaN
        if np.isnan(ultimate_bf) or np.isnan(ibnr_bf):
            ultimate_bf = reported
            ibnr_bf = 0

        results.append({
            "accident_year": int(year),
            "ultimate_bf": round(ultimate_bf),
            "ibnr_bf": round(max(0, ibnr_bf)),
        })

    return results


def main():
    triangles_path = os.path.join(PROCESSED_DIR, "triangles.parquet")
    if not os.path.exists(triangles_path):
        print("ERROR: triangles.parquet not found. Run 02_clean_triangles.py first.")
        return

    df = pd.read_parquet(triangles_path)
    print(f"  Loaded triangles: {len(df):,} rows")
    print(f"  Valuation date: 12/31/{VALUATION_YEAR}")
    print(f"  Data includes development through {df['DevelopmentYear'].max()}")

    lobs = sorted(df["line_of_business"].unique().tolist())
    all_results = []

    for lob in lobs:
        print(f"\n  Processing: {lob}")

        # Build triangles for both incurred and paid losses
        tri_incurred = build_triangle(df, lob, "IncurLoss")
        tri_paid = build_triangle(df, lob, "CumPaidLoss")

        if tri_incurred.empty and tri_paid.empty:
            print(f"    WARNING: No data for {lob}")
            continue

        n_filled = tri_paid.notna().sum().sum()
        n_total = tri_paid.shape[0] * tri_paid.shape[1]
        print(f"    Triangle: {tri_paid.shape[0]}x{tri_paid.shape[1]}, {n_filled}/{n_total} filled")

        # Chain-Ladder on both
        cl_inc = chain_ladder(tri_incurred)
        cl_paid = chain_ladder(tri_paid)

        # Full triangles for known ultimate
        full_inc = build_full_triangle(df, lob, "IncurLoss")
        full_paid = build_full_triangle(df, lob, "CumPaidLoss")

        # Earned premium
        lob_data = df[df["line_of_business"] == lob]
        earned_prem = lob_data.groupby("AccidentYear")["EarnedPremDIR"].max().fillna(0).to_dict()

        # BF on paid
        bf_paid = bornhuetter_ferguson(tri_paid, earned_prem, cl_paid["cdfs"], apriori_lr=0.65)

        for cl_i, cl_p, bf_r in zip(cl_inc["results"], cl_paid["results"], bf_paid):
            year = cl_i["accident_year"]
            known_inc = 0
            if year in full_inc.index:
                r = full_inc.loc[year].dropna()
                if not r.empty:
                    known_inc = round(float(r.iloc[-1]))
            known_paid = 0
            if year in full_paid.index:
                r = full_paid.loc[year].dropna()
                if not r.empty:
                    known_paid = round(float(r.iloc[-1]))

            all_results.append({
                "line_of_business": lob,
                "accident_year": year,
                "reported_incurred": cl_i["reported"],
                "ultimate_cl_incurred": cl_i["ultimate_cl"],
                "ibnr_cl_incurred": cl_i["ibnr_cl"],
                "cdf_incurred": cl_i["cdf_to_ultimate"],
                "reported_paid": cl_p["reported"],
                "ultimate_cl_paid": cl_p["ultimate_cl"],
                "ibnr_cl_paid": cl_p["ibnr_cl"],
                "cdf_paid": cl_p["cdf_to_ultimate"],
                "ultimate_bf": bf_r["ultimate_bf"],
                "ibnr_bf": bf_r["ibnr_bf"],
                "known_ultimate_incurred": known_inc,
                "known_ultimate_paid": known_paid,
                "earned_premium": earned_prem.get(year, 0),
                "latest_lag": cl_p["latest_lag"],
            })

        paid_f = [round(f, 4) for f in cl_paid["factors"].values()]
        inc_f = [round(f, 4) for f in cl_inc["factors"].values()]
        print(f"    Paid factors: {paid_f}")
        print(f"    Incurred factors: {inc_f}")
        ibnr_p = sum(r["ibnr_cl"] for r in cl_paid["results"])
        ibnr_bf = sum(r["ibnr_bf"] for r in bf_paid)
        print(f"    Total IBNR (Paid CL): {ibnr_p:,.0f}  (BF): {ibnr_bf:,.0f}")

    # Save detailed results
    results_df = pd.DataFrame(all_results)
    ibnr_path = os.path.join(PROCESSED_DIR, "ibnr_results.parquet")
    results_df.to_parquet(ibnr_path, index=False)
    print(f"\n  Saved: {ibnr_path} ({len(results_df)} rows)")

    # LOB summary
    lob_summary = (
        results_df.groupby("line_of_business")
        .agg(
            total_reported_incurred=("reported_incurred", "sum"),
            total_reported_paid=("reported_paid", "sum"),
            total_ultimate_cl_paid=("ultimate_cl_paid", "sum"),
            total_ibnr_cl_paid=("ibnr_cl_paid", "sum"),
            total_ultimate_bf=("ultimate_bf", "sum"),
            total_ibnr_bf=("ibnr_bf", "sum"),
            total_known_ultimate_paid=("known_ultimate_paid", "sum"),
            total_earned_premium=("earned_premium", "sum"),
            n_accident_years=("accident_year", "nunique"),
        )
        .reset_index()
    )
    lob_summary["loss_ratio_reported"] = (
        lob_summary["total_reported_incurred"] / lob_summary["total_earned_premium"]
    ).where(lob_summary["total_earned_premium"] > 0, 0)
    lob_summary["loss_ratio_ultimate"] = (
        lob_summary["total_ultimate_cl_paid"] / lob_summary["total_earned_premium"]
    ).where(lob_summary["total_earned_premium"] > 0, 0)

    summary_path = os.path.join(PROCESSED_DIR, "lob_summary.parquet")
    lob_summary.to_parquet(summary_path, index=False)
    print(f"  Saved: {summary_path} ({len(lob_summary)} rows)")

    print("\n  LOB Summary:")
    for _, row in lob_summary.iterrows():
        print(
            f"    {row['line_of_business']}: "
            f"LR(reported)={row['loss_ratio_reported']:.1%}, "
            f"IBNR(Paid CL)={row['total_ibnr_cl_paid']:,.0f}"
        )


if __name__ == "__main__":
    main()
