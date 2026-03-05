from typing import Optional

import numpy as np
from fastapi import APIRouter, Query

from insurance_backend import data_loader
from insurance_backend.filters import apply_filters

router = APIRouter()


@router.get("/claim-distribution")
def claim_distribution(
    lob: Optional[str] = Query(None),
    company: Optional[int] = Query(None),
    year_start: Optional[int] = Query(None),
    year_end: Optional[int] = Query(None),
):
    """Return severity histogram bins and report lag statistics by LOB."""
    df = apply_filters(data_loader.claims, lob, None, year_start, year_end)

    if df.empty:
        return {
            "severity_histogram": [],
            "severity_by_band": [],
            "report_lag_stats": [],
            "status_breakdown": [],
        }

    # --- Severity histogram (paid_amount distribution) ---
    paid = df["paid_amount"].dropna()
    if not paid.empty:
        # Define bins using quantile-based edges for meaningful distribution
        bin_edges = [0, 1000, 5000, 10000, 25000, 50000, 100000, float("inf")]
        bin_labels = [
            "0-1K", "1K-5K", "5K-10K", "10K-25K",
            "25K-50K", "50K-100K", "100K+",
        ]
        counts, _ = np.histogram(paid.values, bins=bin_edges)
        severity_histogram = [
            {"bin": label, "count": int(c)}
            for label, c in zip(bin_labels, counts)
        ]
    else:
        severity_histogram = []

    # --- Severity by band ---
    if "severity_band" in df.columns:
        band_agg = (
            df.groupby("severity_band")
            .agg(
                count=("claim_id", "count"),
                avg_paid=("paid_amount", "mean"),
                avg_incurred=("incurred_amount", "mean"),
                total_paid=("paid_amount", "sum"),
            )
            .reset_index()
            .sort_values("count", ascending=False)
        )
        severity_by_band = [
            {
                "severity_band": row["severity_band"],
                "count": int(row["count"]),
                "avg_paid": round(float(row["avg_paid"]), 2),
                "avg_incurred": round(float(row["avg_incurred"]), 2),
                "total_paid": round(float(row["total_paid"]), 2),
            }
            for _, row in band_agg.iterrows()
        ]
    else:
        severity_by_band = []

    # --- Report lag statistics by LOB ---
    if "report_lag_days" in df.columns and "line_of_business" in df.columns:
        lag_stats = (
            df.groupby("line_of_business")["report_lag_days"]
            .agg(["mean", "median", "std", "min", "max", "count"])
            .reset_index()
            .sort_values("line_of_business")
        )
        report_lag_stats = [
            {
                "line_of_business": row["line_of_business"],
                "mean_lag": round(float(row["mean"]), 1),
                "median_lag": round(float(row["median"]), 1),
                "std_lag": round(float(row["std"]), 1) if not np.isnan(row["std"]) else 0.0,
                "min_lag": int(row["min"]),
                "max_lag": int(row["max"]),
                "count": int(row["count"]),
            }
            for _, row in lag_stats.iterrows()
        ]
    else:
        report_lag_stats = []

    # --- Status breakdown ---
    if "claim_status" in df.columns:
        status_counts = df["claim_status"].value_counts().reset_index()
        status_counts.columns = ["status", "count"]
        status_breakdown = [
            {"status": row["status"], "count": int(row["count"])}
            for _, row in status_counts.iterrows()
        ]
    else:
        status_breakdown = []

    return {
        "severity_histogram": severity_histogram,
        "severity_by_band": severity_by_band,
        "report_lag_stats": report_lag_stats,
        "status_breakdown": status_breakdown,
    }
