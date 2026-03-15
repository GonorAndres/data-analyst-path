"""
Generate 24 months of synthetic SaaS data for "NovaCRM".

NovaCRM is a mid-market B2B SaaS company in the $5M-$12M ARR range.
Output: monthly_metrics.parquet and segment_metrics.parquet in data/processed/.

Reproducible via np.random.default_rng(42).
"""

from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
RNG = np.random.default_rng(42)
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MONTHS = pd.date_range("2024-01-01", "2025-12-01", freq="MS")
N_MONTHS = len(MONTHS)

SEGMENTS = ["Starter", "Professional", "Enterprise"]
# Segment share of MRR (approximate, shifts slightly over time)
SEG_MRR_SHARE = {"Starter": 0.15, "Professional": 0.40, "Enterprise": 0.45}
# Segment share of customers
SEG_CUST_SHARE = {"Starter": 0.55, "Professional": 0.30, "Enterprise": 0.15}
# Segment churn baselines (logo churn rate %)
SEG_CHURN_BASE = {"Starter": 0.055, "Professional": 0.030, "Enterprise": 0.012}
# Segment NPS baselines
SEG_NPS_BASE = {"Starter": 32, "Professional": 45, "Enterprise": 55}

# Targets
MRR_TARGET_GROWTH = 0.05  # 5% MoM target early, decelerating
NRR_TARGET = 1.10
CHURN_TARGET = 0.030


# ---------------------------------------------------------------------------
# Helper: seasonal multiplier
# ---------------------------------------------------------------------------
def _seasonal_factor(month_dt: pd.Timestamp) -> float:
    """Return a multiplier for new business acquisition seasonality."""
    m = month_dt.month
    # December holiday stall
    if m == 12:
        return 0.65
    # Summer dip (Jun-Aug)
    if m in (6, 7, 8):
        return 0.80 + RNG.uniform(-0.03, 0.03)
    # Q1 strong (budget flush)
    if m in (1, 2, 3):
        return 1.10 + RNG.uniform(-0.03, 0.03)
    return 1.0 + RNG.uniform(-0.05, 0.05)


# ---------------------------------------------------------------------------
# Generate monthly-level data
# ---------------------------------------------------------------------------
def generate_monthly() -> pd.DataFrame:
    """Build the monthly_metrics DataFrame (24 rows)."""
    records = []

    # Starting state
    mrr = 420_000.0
    total_customers = 310
    nps = 45.0
    dau = 4800
    mau = 14500

    for i, month in enumerate(MONTHS):
        # ---- Growth rate (decelerating from ~4% to ~1.5%) ----
        base_growth = 0.040 - (i / N_MONTHS) * 0.025
        seasonal = _seasonal_factor(month)

        # ---- Event flags ----
        # Event 1: Q3 2024 pricing-change churn spike (Jul-Sep 2024)
        is_pricing_event = month.year == 2024 and month.month in (7, 8, 9)
        pricing_severity = {7: 1.0, 8: 0.6, 9: 0.25}.get(month.month, 0) if is_pricing_event else 0

        # Event 2: Q2 2025 product-launch bump (Apr-Jun 2025)
        is_launch_event = month.year == 2025 and month.month in (4, 5, 6)
        launch_severity = {4: 0.6, 5: 1.0, 6: 0.7}.get(month.month, 0) if is_launch_event else 0

        # ---- MRR movement components ----
        # For annualized NRR ~108%: need monthly (expansion - churn - contraction) / mrr ~ +0.007
        # So expansion ~3.3%, revenue churn ~2.0%, contraction ~0.6% => net +0.7%/mo => 1.007^12 = 1.087
        new_mrr_base = mrr * base_growth * seasonal
        new_mrr_base *= (1.0 + launch_severity * 0.40)  # product launch boost
        new_mrr = max(0, new_mrr_base + RNG.normal(0, mrr * 0.004))

        expansion_base = mrr * 0.030 * (1 + i / N_MONTHS * 0.2)
        expansion_mrr = max(0, expansion_base * (1 + launch_severity * 0.7) + RNG.normal(0, mrr * 0.002))

        churn_base_rate = 0.020 + RNG.normal(0, 0.002)
        churn_base_rate += pricing_severity * 0.020  # churn spike
        churn_base_rate = max(0.008, churn_base_rate)
        churned_mrr = mrr * churn_base_rate

        contraction_rate = 0.006 + RNG.normal(0, 0.0015)
        contraction_rate += pricing_severity * 0.005
        contraction_rate = max(0.002, contraction_rate)
        contraction_mrr = mrr * contraction_rate

        # Net MRR change
        net_new = new_mrr + expansion_mrr - churned_mrr - contraction_mrr
        mrr_prev = mrr
        mrr = mrr + net_new

        # ARR
        arr = mrr * 12

        # ---- Customers ----
        new_cust_base = int(total_customers * base_growth * seasonal * 1.3)
        new_cust_base = max(4, int(new_cust_base * (1 + launch_severity * 0.30) + RNG.integers(-2, 4)))
        new_customers = new_cust_base

        logo_churn_base = 0.025 + RNG.normal(0, 0.004)
        logo_churn_base += pricing_severity * 0.020
        logo_churn_base = max(0.008, logo_churn_base)
        churned_customers = max(1, int(total_customers * logo_churn_base + RNG.normal(0, 1)))

        total_customers = total_customers + new_customers - churned_customers
        logo_churn_rate = churned_customers / (total_customers + churned_customers)  # beginning-of-period
        revenue_churn_rate = churned_mrr / mrr_prev

        # NRR (annualized: monthly retention ratio ^ 12)
        monthly_nrr = (mrr_prev + expansion_mrr - churned_mrr - contraction_mrr) / mrr_prev
        nrr = monthly_nrr ** 12  # annualize to get 105-115% range

        # ---- Unit economics ----
        cac = 8000 + RNG.normal(0, 500) - (launch_severity * 1500)  # launch improves CAC via inbound
        cac = max(4000, cac)
        avg_revenue_per_customer = mrr / total_customers
        avg_life = 1 / max(logo_churn_rate, 0.005) / 12  # in years
        ltv = avg_revenue_per_customer * 12 * avg_life * 0.80  # gross-margin-adjusted
        ltv_cac_ratio = ltv / cac
        payback_months = cac / avg_revenue_per_customer if avg_revenue_per_customer > 0 else 99

        # ---- Engagement ----
        dau_growth = 1 + base_growth * 0.6 + launch_severity * 0.05 + RNG.normal(0, 0.01)
        dau = int(dau * dau_growth)
        mau_growth = 1 + base_growth * 0.4 + launch_severity * 0.03 + RNG.normal(0, 0.008)
        mau = int(mau * mau_growth)
        mau = max(mau, int(dau * 1.5))  # sanity
        dau_mau_ratio = dau / mau

        feature_adoption_rate = 0.35 + i / N_MONTHS * 0.15 + launch_severity * 0.08 + RNG.normal(0, 0.02)
        feature_adoption_rate = np.clip(feature_adoption_rate, 0.25, 0.75)

        # ---- Support ----
        support_tickets = int(total_customers * (0.35 + pricing_severity * 0.25) + RNG.normal(0, 10))
        support_tickets = max(30, support_tickets)
        avg_resolution_hours = 6.5 - i / N_MONTHS * 1.5 + pricing_severity * 3 + RNG.normal(0, 0.5)
        avg_resolution_hours = max(2.0, avg_resolution_hours)

        # ---- NPS ----
        nps_delta = RNG.normal(0.3, 1.5)  # slight upward trend
        nps_delta -= pricing_severity * 10
        nps_delta += launch_severity * 8
        nps = np.clip(nps + nps_delta, 28, 62)

        # ---- Financial health ----
        gross_margin = 0.78 + i / N_MONTHS * 0.03 + RNG.normal(0, 0.01)
        gross_margin = np.clip(gross_margin, 0.74, 0.86)

        # Burn rate decreasing as company scales
        burn_rate = 450_000 - i * 5000 + RNG.normal(0, 10_000)
        burn_rate = max(300_000, burn_rate)
        cash_balance = 8_000_000 + arr * 0.15  # simplified
        runway_months = cash_balance / burn_rate

        # Rule of 40
        annualized_growth = (mrr / mrr_prev - 1) * 12 if mrr_prev > 0 else 0
        rule_of_40 = annualized_growth + gross_margin  # both as ratios
        rule_of_40_pct = rule_of_40 * 100  # as percentage points

        # ---- Targets ----
        # MRR target: 5% MoM early, decaying
        mrr_target_growth = max(0.02, 0.05 - i / N_MONTHS * 0.03)
        mrr_target = mrr_prev * (1 + mrr_target_growth) if i > 0 else 441_000
        nrr_target = NRR_TARGET
        churn_target = CHURN_TARGET

        records.append(
            {
                "month": month,
                "mrr": round(mrr, 2),
                "arr": round(arr, 2),
                "new_mrr": round(new_mrr, 2),
                "expansion_mrr": round(expansion_mrr, 2),
                "contraction_mrr": round(contraction_mrr, 2),
                "churned_mrr": round(churned_mrr, 2),
                "total_customers": total_customers,
                "new_customers": new_customers,
                "churned_customers": churned_customers,
                "logo_churn_rate": round(logo_churn_rate, 5),
                "revenue_churn_rate": round(revenue_churn_rate, 5),
                "nrr": round(nrr, 5),
                "cac": round(cac, 2),
                "ltv": round(ltv, 2),
                "ltv_cac_ratio": round(ltv_cac_ratio, 2),
                "payback_months": round(payback_months, 1),
                "dau": dau,
                "mau": mau,
                "dau_mau_ratio": round(dau_mau_ratio, 4),
                "feature_adoption_rate": round(feature_adoption_rate, 4),
                "support_tickets": support_tickets,
                "avg_resolution_hours": round(avg_resolution_hours, 2),
                "nps": round(nps, 1),
                "gross_margin": round(gross_margin, 4),
                "burn_rate": round(burn_rate, 2),
                "runway_months": round(runway_months, 1),
                "rule_of_40": round(rule_of_40_pct, 2),
                "mrr_target": round(mrr_target, 2),
                "nrr_target": round(nrr_target, 5),
                "churn_target": round(churn_target, 5),
            }
        )

    return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# Generate segment-level data
# ---------------------------------------------------------------------------
def generate_segments(monthly_df: pd.DataFrame) -> pd.DataFrame:
    """Build segment_metrics (72 rows = 24 months x 3 segments).

    Segment values are designed so that weighted sums/averages approximate
    the monthly totals.
    """
    seg_records = []

    for _, row in monthly_df.iterrows():
        month = row["month"]
        i = monthly_df.index.get_loc(_)

        # Distribute metrics across segments with noise
        for seg in SEGMENTS:
            mrr_share = SEG_MRR_SHARE[seg] + RNG.normal(0, 0.01)
            mrr_share = np.clip(mrr_share, 0.05, 0.60)
            cust_share = SEG_CUST_SHARE[seg] + RNG.normal(0, 0.01)
            cust_share = np.clip(cust_share, 0.05, 0.70)

            seg_mrr = row["mrr"] * mrr_share
            seg_arr = seg_mrr * 12
            seg_new_mrr = row["new_mrr"] * mrr_share * (1 + RNG.normal(0, 0.05))
            seg_expansion = row["expansion_mrr"] * mrr_share * (1 + RNG.normal(0, 0.05))
            seg_contraction = row["contraction_mrr"] * mrr_share * (1 + RNG.normal(0, 0.05))
            seg_churned_mrr = row["churned_mrr"] * mrr_share * (1 + RNG.normal(0, 0.05))

            seg_total_cust = max(5, int(row["total_customers"] * cust_share + RNG.normal(0, 2)))
            seg_new_cust = max(0, int(row["new_customers"] * cust_share + RNG.normal(0, 1)))
            seg_churned_cust = max(0, int(row["churned_customers"] * cust_share + RNG.normal(0, 1)))

            # Segment-specific churn
            base_churn = SEG_CHURN_BASE[seg]
            is_pricing = month.year == 2024 and month.month in (7, 8, 9)
            pricing_add = {7: 1.0, 8: 0.6, 9: 0.25}.get(month.month, 0) * 0.015 if is_pricing else 0
            logo_churn = base_churn + pricing_add + RNG.normal(0, 0.003)
            logo_churn = max(0.005, logo_churn)

            revenue_churn = logo_churn * (0.8 if seg == "Enterprise" else 1.1 if seg == "Starter" else 1.0)
            revenue_churn += RNG.normal(0, 0.002)
            revenue_churn = max(0.003, revenue_churn)

            # NRR per segment
            if seg == "Enterprise":
                seg_nrr = 1.12 + RNG.normal(0, 0.01)
            elif seg == "Professional":
                seg_nrr = 1.08 + RNG.normal(0, 0.015)
            else:
                seg_nrr = 0.96 + RNG.normal(0, 0.02)

            # Unit economics per segment
            if seg == "Enterprise":
                seg_cac = 18000 + RNG.normal(0, 1500)
                seg_ltv = seg_cac * (5.5 + RNG.normal(0, 0.5))
            elif seg == "Professional":
                seg_cac = 8000 + RNG.normal(0, 800)
                seg_ltv = seg_cac * (3.5 + RNG.normal(0, 0.4))
            else:
                seg_cac = 3000 + RNG.normal(0, 400)
                seg_ltv = seg_cac * (2.0 + RNG.normal(0, 0.3))

            seg_ltv_cac = seg_ltv / seg_cac
            avg_rev_per_cust = seg_mrr / max(seg_total_cust, 1)
            seg_payback = seg_cac / avg_rev_per_cust if avg_rev_per_cust > 0 else 99

            # Engagement
            seg_dau = max(100, int(row["dau"] * cust_share * (1.2 if seg == "Enterprise" else 0.9 if seg == "Starter" else 1.0) + RNG.normal(0, 30)))
            seg_mau = max(seg_dau, int(row["mau"] * cust_share * (1.1 if seg == "Enterprise" else 0.95 if seg == "Starter" else 1.0) + RNG.normal(0, 50)))
            seg_dau_mau = seg_dau / seg_mau

            seg_adoption = row["feature_adoption_rate"] + (0.15 if seg == "Enterprise" else -0.10 if seg == "Starter" else 0.0) + RNG.normal(0, 0.02)
            seg_adoption = np.clip(seg_adoption, 0.15, 0.85)

            # Support
            seg_tickets = max(5, int(row["support_tickets"] * cust_share + RNG.normal(0, 5)))
            seg_resolution = row["avg_resolution_hours"] * (0.7 if seg == "Enterprise" else 1.3 if seg == "Starter" else 1.0) + RNG.normal(0, 0.3)
            seg_resolution = max(1.5, seg_resolution)

            # NPS per segment
            seg_nps_base = SEG_NPS_BASE[seg]
            is_launch = month.year == 2025 and month.month in (4, 5, 6)
            nps_adj = 0
            if is_pricing:
                nps_adj -= {7: 8, 8: 5, 9: 2}.get(month.month, 0)
            if is_launch:
                nps_adj += {4: 4, 5: 7, 6: 5}.get(month.month, 0)
            seg_nps = seg_nps_base + nps_adj + i * 0.2 + RNG.normal(0, 2)
            seg_nps = np.clip(seg_nps, 20, 70)

            # Financial
            seg_gm = row["gross_margin"] + (0.03 if seg == "Enterprise" else -0.02 if seg == "Starter" else 0) + RNG.normal(0, 0.005)
            seg_gm = np.clip(seg_gm, 0.70, 0.90)

            seg_burn = row["burn_rate"] * mrr_share + RNG.normal(0, 5000)
            seg_burn = max(50000, seg_burn)
            seg_runway = (8_000_000 * mrr_share + seg_arr * 0.15) / seg_burn

            seg_growth_ann = (seg_nrr - 1) * 12 if seg_nrr > 0 else 0
            seg_rule40 = (seg_growth_ann + seg_gm) * 100

            # Targets (same across segments for simplicity)
            seg_records.append(
                {
                    "month": month,
                    "segment": seg,
                    "mrr": round(seg_mrr, 2),
                    "arr": round(seg_arr, 2),
                    "new_mrr": round(max(0, seg_new_mrr), 2),
                    "expansion_mrr": round(max(0, seg_expansion), 2),
                    "contraction_mrr": round(max(0, seg_contraction), 2),
                    "churned_mrr": round(max(0, seg_churned_mrr), 2),
                    "total_customers": seg_total_cust,
                    "new_customers": seg_new_cust,
                    "churned_customers": seg_churned_cust,
                    "logo_churn_rate": round(logo_churn, 5),
                    "revenue_churn_rate": round(revenue_churn, 5),
                    "nrr": round(seg_nrr, 5),
                    "cac": round(seg_cac, 2),
                    "ltv": round(seg_ltv, 2),
                    "ltv_cac_ratio": round(seg_ltv_cac, 2),
                    "payback_months": round(seg_payback, 1),
                    "dau": seg_dau,
                    "mau": seg_mau,
                    "dau_mau_ratio": round(seg_dau_mau, 4),
                    "feature_adoption_rate": round(seg_adoption, 4),
                    "support_tickets": seg_tickets,
                    "avg_resolution_hours": round(seg_resolution, 2),
                    "nps": round(seg_nps, 1),
                    "gross_margin": round(seg_gm, 4),
                    "burn_rate": round(seg_burn, 2),
                    "runway_months": round(seg_runway, 1),
                    "rule_of_40": round(seg_rule40, 2),
                    "mrr_target": round(row["mrr_target"] * mrr_share, 2),
                    "nrr_target": round(row["nrr_target"], 5),
                    "churn_target": round(row["churn_target"], 5),
                }
            )

    return pd.DataFrame(seg_records)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    print("Generating NovaCRM synthetic SaaS data (Jan 2024 - Dec 2025)...")

    monthly_df = generate_monthly()
    segment_df = generate_segments(monthly_df)

    # Save
    monthly_path = OUTPUT_DIR / "monthly_metrics.parquet"
    segment_path = OUTPUT_DIR / "segment_metrics.parquet"

    monthly_df.to_parquet(monthly_path, index=False, engine="pyarrow")
    segment_df.to_parquet(segment_path, index=False, engine="pyarrow")

    print(f"  monthly_metrics.parquet : {monthly_df.shape[0]} rows x {monthly_df.shape[1]} cols -> {monthly_path}")
    print(f"  segment_metrics.parquet: {segment_df.shape[0]} rows x {segment_df.shape[1]} cols -> {segment_path}")

    # Quick sanity checks
    print(f"\n  MRR range: ${monthly_df['mrr'].min():,.0f} - ${monthly_df['mrr'].max():,.0f}")
    print(f"  ARR range: ${monthly_df['arr'].min():,.0f} - ${monthly_df['arr'].max():,.0f}")
    print(f"  NPS range: {monthly_df['nps'].min():.0f} - {monthly_df['nps'].max():.0f}")
    print(f"  Customer range: {monthly_df['total_customers'].min()} - {monthly_df['total_customers'].max()}")
    print("Done.")


if __name__ == "__main__":
    main()
