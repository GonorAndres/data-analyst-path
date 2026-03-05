from typing import Optional

import numpy as np
from fastapi import APIRouter, Query

from insurance_backend import data_loader
from insurance_backend.filters import apply_filters

router = APIRouter()


@router.get("/loss-triangle")
def loss_triangle(
    lob: Optional[str] = Query(None),
    company: Optional[int] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
    type: Optional[str] = Query("incurred", description="incurred or paid"),
    method: Optional[str] = Query("cl", description="cl or bf"),
):
    """Return loss development triangle matrix, development factors, and IBNR by year.

    The triangle is built as-of 1997 (only DevelopmentYear <= 1997).
    Aggregates across companies unless a specific company GRCODE is given.
    """
    df = apply_filters(data_loader.triangles, lob, company, year_start, year_end)

    if df.empty:
        return {
            "accident_years": [],
            "development_lags": [],
            "triangle": [],
            "development_factors": [],
            "ibnr_by_year": [],
        }

    # Filter to as-of 1997 evaluation
    df = df[df["DevelopmentYear"] <= 1997]

    # Choose value column based on type
    value_col = "IncurLoss" if type == "incurred" else "CumPaidLoss"

    # Aggregate across companies (sum losses by accident year and development lag)
    agg = (
        df.groupby(["AccidentYear", "DevelopmentLag"])[value_col]
        .sum()
        .reset_index()
    )

    # Pivot into triangle matrix
    pivot = agg.pivot(
        index="AccidentYear", columns="DevelopmentLag", values=value_col
    ).sort_index()

    accident_years = pivot.index.tolist()
    dev_lags = sorted(pivot.columns.tolist())

    # Build triangle as list of lists (None for missing cells)
    triangle = []
    for ay in accident_years:
        row = []
        for lag in dev_lags:
            val = pivot.loc[ay].get(lag, np.nan)
            row.append(int(val) if not np.isnan(val) else None)
        triangle.append(row)

    # Compute age-to-age development factors (link ratios)
    development_factors = []
    for i in range(len(dev_lags) - 1):
        lag_curr = dev_lags[i]
        lag_next = dev_lags[i + 1]
        numerator = 0.0
        denominator = 0.0
        for ay in accident_years:
            val_curr = pivot.loc[ay].get(lag_curr, np.nan)
            val_next = pivot.loc[ay].get(lag_next, np.nan)
            if not np.isnan(val_curr) and not np.isnan(val_next) and val_curr > 0:
                numerator += val_next
                denominator += val_curr
        factor = round(numerator / denominator, 4) if denominator > 0 else None
        development_factors.append({
            "from_lag": int(lag_curr),
            "to_lag": int(lag_next),
            "factor": factor,
        })

    # Compute cumulative development factors (tail to ultimate)
    cum_factors = {}
    cum = 1.0
    for df_entry in reversed(development_factors):
        if df_entry["factor"] is not None:
            cum *= df_entry["factor"]
        cum_factors[df_entry["from_lag"]] = round(cum, 4)

    # Estimate IBNR by accident year
    ibnr_by_year = []
    for idx, ay in enumerate(accident_years):
        # Find the latest available lag for this accident year
        row_values = pivot.loc[ay].dropna()
        if row_values.empty:
            ibnr_by_year.append({
                "accident_year": int(ay),
                "latest_lag": None,
                "latest_value": None,
                "ultimate": None,
                "ibnr": None,
            })
            continue
        latest_lag = int(row_values.index.max())
        latest_value = int(row_values.iloc[-1])
        cdf = cum_factors.get(latest_lag, 1.0)
        ultimate = int(round(latest_value * cdf))
        ibnr = ultimate - latest_value
        ibnr_by_year.append({
            "accident_year": int(ay),
            "latest_lag": latest_lag,
            "latest_value": latest_value,
            "cdf": cdf,
            "ultimate": ultimate,
            "ibnr": ibnr,
        })

    # If BF method requested, override ibnr and ultimate from pre-computed results
    if method == "bf" and not data_loader.ibnr_results.empty:
        bf_df = data_loader.ibnr_results.copy()
        if lob:
            bf_df = bf_df[bf_df["line_of_business"] == lob]
        if year_start is not None:
            bf_df = bf_df[bf_df["accident_year"] >= year_start]
        if year_end is not None:
            bf_df = bf_df[bf_df["accident_year"] <= year_end]
        bf_agg = (
            bf_df.groupby("accident_year")[["ibnr_bf", "ultimate_bf"]]
            .sum()
            .reset_index()
        )
        bf_map = {
            int(r["accident_year"]): (int(r["ibnr_bf"]), int(r["ultimate_bf"]))
            for _, r in bf_agg.iterrows()
        }
        for entry in ibnr_by_year:
            ay = entry["accident_year"]
            if ay in bf_map:
                entry["ibnr"] = bf_map[ay][0]
                entry["ultimate"] = bf_map[ay][1]

    return {
        "accident_years": [int(y) for y in accident_years],
        "development_lags": [int(l) for l in dev_lags],
        "triangle": triangle,
        "development_factors": development_factors,
        "cumulative_factors": [
            {"lag": int(k), "cum_factor": v} for k, v in sorted(cum_factors.items())
        ],
        "ibnr_by_year": ibnr_by_year,
        "method": method,
    }


@router.get("/cl-vs-bf")
def cl_vs_bf(
    lob: Optional[str] = Query(None),
    company: Optional[int] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
    type: Optional[str] = Query("paid", description="incurred or paid"),
):
    """Return per-year comparison of Chain-Ladder vs Bornhuetter-Ferguson estimates."""
    if data_loader.ibnr_results.empty:
        return {"comparison": []}

    # Filter ibnr_results for BF and CL pre-computed values
    ibnr_df = data_loader.ibnr_results.copy()
    if lob:
        ibnr_df = ibnr_df[ibnr_df["line_of_business"] == lob]
    if year_start is not None:
        ibnr_df = ibnr_df[ibnr_df["accident_year"] >= year_start]
    if year_end is not None:
        ibnr_df = ibnr_df[ibnr_df["accident_year"] <= year_end]

    if ibnr_df.empty:
        return {"comparison": []}

    # Select CL columns based on type (incurred vs paid)
    if type == "incurred":
        cl_ibnr_col = "ibnr_cl_incurred"
        cl_ult_col = "ultimate_cl_incurred"
    else:
        cl_ibnr_col = "ibnr_cl_paid"
        cl_ult_col = "ultimate_cl_paid"

    agg = (
        ibnr_df.groupby("accident_year")
        .agg({
            cl_ibnr_col: "sum",
            cl_ult_col: "sum",
            "ibnr_bf": "sum",
            "ultimate_bf": "sum",
        })
        .reset_index()
        .sort_values("accident_year")
    )

    comparison = []
    for _, row in agg.iterrows():
        cl_ibnr = int(row[cl_ibnr_col])
        bf_ibnr = int(row["ibnr_bf"])
        cl_ultimate = int(row[cl_ult_col])
        bf_ultimate = int(row["ultimate_bf"])
        difference = bf_ibnr - cl_ibnr
        pct_diff = round(difference / cl_ibnr * 100, 2) if cl_ibnr != 0 else 0.0
        comparison.append({
            "accident_year": int(row["accident_year"]),
            "cl_ibnr": cl_ibnr,
            "bf_ibnr": bf_ibnr,
            "cl_ultimate": cl_ultimate,
            "bf_ultimate": bf_ultimate,
            "difference": difference,
            "pct_diff": pct_diff,
        })

    return {"comparison": comparison}
