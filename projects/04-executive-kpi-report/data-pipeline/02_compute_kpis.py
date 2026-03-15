"""
Compute derived KPIs from raw SaaS metrics.

Reads monthly_metrics.parquet and segment_metrics.parquet, computes:
- MoM and YoY changes
- Rolling 3-month and 6-month averages
- Z-scores against trailing 6-month window
- Traffic-light status (green/yellow/red) vs targets
- Composite health score (0-100)

Output: monthly_kpis.parquet and segment_kpis.parquet in data/processed/.
"""

from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"

# Metrics to compute MoM/YoY, rolling averages, and z-scores for
KEY_METRICS = [
    "mrr",
    "arr",
    "nrr",
    "logo_churn_rate",
    "revenue_churn_rate",
    "nps",
    "total_customers",
    "new_mrr",
    "expansion_mrr",
    "churned_mrr",
    "contraction_mrr",
    "new_customers",
    "churned_customers",
    "cac",
    "ltv",
    "ltv_cac_ratio",
    "payback_months",
    "dau_mau_ratio",
    "feature_adoption_rate",
    "support_tickets",
    "avg_resolution_hours",
    "gross_margin",
    "rule_of_40",
    "burn_rate",
    "runway_months",
]

# Metrics where lower is better (churn, resolution time, burn, etc.)
LOWER_IS_BETTER = {
    "logo_churn_rate",
    "revenue_churn_rate",
    "churned_mrr",
    "contraction_mrr",
    "churned_customers",
    "cac",
    "payback_months",
    "support_tickets",
    "avg_resolution_hours",
    "burn_rate",
}

# Traffic-light metric -> target column mapping
TRAFFIC_LIGHT_PAIRS = {
    "mrr": "mrr_target",
    "nrr": "nrr_target",
    "logo_churn_rate": "churn_target",
    "revenue_churn_rate": "churn_target",
}

# Health score weights (must sum to 1.0)
HEALTH_WEIGHTS = {
    "mrr_growth_score": 0.20,
    "nrr_score": 0.20,
    "churn_score": 0.15,
    "nps_score": 0.15,
    "rule_of_40_score": 0.15,
    "ltv_cac_score": 0.15,
}


# ---------------------------------------------------------------------------
# Computation functions
# ---------------------------------------------------------------------------
def compute_mom_yoy(df: pd.DataFrame, metrics: list[str], group_col: str | None = None) -> pd.DataFrame:
    """Add month-over-month and year-over-year percent change columns."""
    df = df.copy()

    if group_col:
        for metric in metrics:
            df[f"mom_change_{metric}"] = df.groupby(group_col)[metric].pct_change(1)
            df[f"yoy_change_{metric}"] = df.groupby(group_col)[metric].pct_change(12)
    else:
        for metric in metrics:
            df[f"mom_change_{metric}"] = df[metric].pct_change(1)
            df[f"yoy_change_{metric}"] = df[metric].pct_change(12)

    return df


def compute_rolling(df: pd.DataFrame, metrics: list[str], group_col: str | None = None) -> pd.DataFrame:
    """Add rolling 3-month and 6-month averages."""
    df = df.copy()

    for metric in metrics:
        if group_col:
            df[f"rolling_3m_{metric}"] = (
                df.groupby(group_col)[metric]
                .transform(lambda s: s.rolling(3, min_periods=1).mean())
            )
            df[f"rolling_6m_{metric}"] = (
                df.groupby(group_col)[metric]
                .transform(lambda s: s.rolling(6, min_periods=1).mean())
            )
        else:
            df[f"rolling_3m_{metric}"] = df[metric].rolling(3, min_periods=1).mean()
            df[f"rolling_6m_{metric}"] = df[metric].rolling(6, min_periods=1).mean()

    return df


def compute_zscores(df: pd.DataFrame, metrics: list[str], group_col: str | None = None) -> pd.DataFrame:
    """Add z-scores computed against a trailing 6-month window."""
    df = df.copy()

    for metric in metrics:
        if group_col:
            rolling_mean = df.groupby(group_col)[metric].transform(
                lambda s: s.rolling(6, min_periods=2).mean()
            )
            rolling_std = df.groupby(group_col)[metric].transform(
                lambda s: s.rolling(6, min_periods=2).std()
            )
        else:
            rolling_mean = df[metric].rolling(6, min_periods=2).mean()
            rolling_std = df[metric].rolling(6, min_periods=2).std()

        # Avoid division by zero
        rolling_std = rolling_std.replace(0, np.nan)
        df[f"zscore_{metric}"] = (df[metric] - rolling_mean) / rolling_std

    return df


def compute_traffic_lights(df: pd.DataFrame) -> pd.DataFrame:
    """Compute traffic-light status for metrics that have targets.

    Green:  on or above target
    Yellow: within 5% of target
    Red:    more than 5% below target

    For lower-is-better metrics, the logic is inverted.
    """
    df = df.copy()

    for metric, target_col in TRAFFIC_LIGHT_PAIRS.items():
        if target_col not in df.columns:
            continue

        col_name = f"traffic_light_{metric}"
        lights = []

        for _, row in df.iterrows():
            val = row[metric]
            target = row[target_col]

            if pd.isna(val) or pd.isna(target) or target == 0:
                lights.append("gray")
                continue

            if metric in LOWER_IS_BETTER:
                # Lower is better: green if at or below target
                ratio = val / target  # < 1 means beating target
                if ratio <= 1.0:
                    lights.append("green")
                elif ratio <= 1.05:
                    lights.append("yellow")
                else:
                    lights.append("red")
            else:
                # Higher is better: green if at or above target
                ratio = val / target  # > 1 means beating target
                if ratio >= 1.0:
                    lights.append("green")
                elif ratio >= 0.95:
                    lights.append("yellow")
                else:
                    lights.append("red")

        df[col_name] = lights

    return df


def _score_metric(value: float, good_threshold: float, bad_threshold: float, higher_is_better: bool = True) -> float:
    """Map a metric value to a 0-100 score linearly between bad and good thresholds."""
    if pd.isna(value):
        return 50.0

    if higher_is_better:
        if value >= good_threshold:
            return 100.0
        if value <= bad_threshold:
            return 0.0
        return (value - bad_threshold) / (good_threshold - bad_threshold) * 100.0
    else:
        # Lower is better
        if value <= good_threshold:
            return 100.0
        if value >= bad_threshold:
            return 0.0
        return (bad_threshold - value) / (bad_threshold - good_threshold) * 100.0


def compute_health_score(df: pd.DataFrame) -> pd.DataFrame:
    """Compute composite health score (0-100) and status."""
    df = df.copy()

    # MRR growth score: based on MoM MRR growth
    # Good: >= 5% MoM, Bad: <= 0%
    df["mrr_growth_score"] = df["mom_change_mrr"].apply(
        lambda x: _score_metric(x, 0.05, 0.0, higher_is_better=True)
    )

    # NRR score: Good >= 115%, Bad <= 95%
    df["nrr_score"] = df["nrr"].apply(
        lambda x: _score_metric(x, 1.15, 0.95, higher_is_better=True)
    )

    # Churn score (logo churn): Good <= 2%, Bad >= 5%
    df["churn_score"] = df["logo_churn_rate"].apply(
        lambda x: _score_metric(x, 0.02, 0.05, higher_is_better=False)
    )

    # NPS score: Good >= 55, Bad <= 25
    df["nps_score"] = df["nps"].apply(
        lambda x: _score_metric(x, 55.0, 25.0, higher_is_better=True)
    )

    # Rule of 40 score: Good >= 40%, Bad <= 15%
    df["rule_of_40_score"] = df["rule_of_40"].apply(
        lambda x: _score_metric(x, 40.0, 15.0, higher_is_better=True)
    )

    # LTV:CAC score: Good >= 4.0, Bad <= 1.5
    df["ltv_cac_score"] = df["ltv_cac_ratio"].apply(
        lambda x: _score_metric(x, 4.0, 1.5, higher_is_better=True)
    )

    # Weighted composite
    df["health_score"] = sum(
        df[component] * weight
        for component, weight in HEALTH_WEIGHTS.items()
    )
    df["health_score"] = df["health_score"].clip(0, 100).round(1)

    # Status thresholds
    df["health_status"] = df["health_score"].apply(
        lambda s: "green" if s >= 75 else ("yellow" if s >= 50 else "red")
    )

    return df


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
def process_dataframe(df: pd.DataFrame, group_col: str | None = None) -> pd.DataFrame:
    """Run the full KPI computation pipeline on a DataFrame."""
    # Ensure sorted by month (and group if applicable)
    sort_cols = [group_col, "month"] if group_col else ["month"]
    sort_cols = [c for c in sort_cols if c in df.columns]
    df = df.sort_values(sort_cols).reset_index(drop=True)

    df = compute_mom_yoy(df, KEY_METRICS, group_col)
    df = compute_rolling(df, KEY_METRICS, group_col)
    df = compute_zscores(df, KEY_METRICS, group_col)
    df = compute_traffic_lights(df)
    df = compute_health_score(df)

    return df


def main() -> None:
    print("Computing derived KPIs...")

    # Read raw metrics
    monthly_df = pd.read_parquet(DATA_DIR / "monthly_metrics.parquet")
    segment_df = pd.read_parquet(DATA_DIR / "segment_metrics.parquet")

    print(f"  Read monthly_metrics: {monthly_df.shape}")
    print(f"  Read segment_metrics: {segment_df.shape}")

    # Process
    monthly_kpis = process_dataframe(monthly_df, group_col=None)
    segment_kpis = process_dataframe(segment_df, group_col="segment")

    # Save
    monthly_kpis_path = DATA_DIR / "monthly_kpis.parquet"
    segment_kpis_path = DATA_DIR / "segment_kpis.parquet"

    monthly_kpis.to_parquet(monthly_kpis_path, index=False, engine="pyarrow")
    segment_kpis.to_parquet(segment_kpis_path, index=False, engine="pyarrow")

    print(f"\n  monthly_kpis.parquet : {monthly_kpis.shape[0]} rows x {monthly_kpis.shape[1]} cols -> {monthly_kpis_path}")
    print(f"  segment_kpis.parquet: {segment_kpis.shape[0]} rows x {segment_kpis.shape[1]} cols -> {segment_kpis_path}")

    # Summary
    print("\n  Health score range (monthly):", f"{monthly_kpis['health_score'].min():.1f} - {monthly_kpis['health_score'].max():.1f}")
    print("  Health status distribution (monthly):")
    for status, count in monthly_kpis["health_status"].value_counts().items():
        print(f"    {status}: {count} months")

    tl_cols = [c for c in monthly_kpis.columns if c.startswith("traffic_light_")]
    if tl_cols:
        print("\n  Traffic light summary (monthly):")
        for col in tl_cols:
            counts = monthly_kpis[col].value_counts().to_dict()
            print(f"    {col}: {counts}")

    print("\nDone.")


if __name__ == "__main__":
    main()
