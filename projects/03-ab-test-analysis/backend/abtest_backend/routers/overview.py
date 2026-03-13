"""Overview endpoint -- high-level A/B test results and verdict."""

from typing import Optional

from fastapi import APIRouter, Query

from abtest_backend import data_loader
from abtest_backend.stats_engine import (
    power_curve,
    required_sample_size,
    sample_ratio_mismatch_test,
    z_test_proportions,
)

router = APIRouter()


@router.get("/overview")
def overview(
    device_type: Optional[str] = Query(None),
    browser: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    user_segment: Optional[str] = Query(None),
    traffic_source: Optional[str] = Query(None),
):
    """Return top-level A/B test summary, verdict, and SRM check."""
    df = data_loader.apply_filters(
        data_loader.df,
        device_type=device_type,
        browser=browser,
        country=country,
        user_segment=user_segment,
        traffic_source=traffic_source,
    )

    if df.empty:
        return {"error": "No data matches the selected filters."}

    control = df[df["group"] == "control"]
    treatment = df[df["group"] == "treatment"]

    n_control = len(control)
    n_treatment = len(treatment)
    conv_control = int(control["converted"].sum())
    conv_treatment = int(treatment["converted"].sum())
    conv_rate_control = conv_control / n_control if n_control > 0 else 0.0
    conv_rate_treatment = conv_treatment / n_treatment if n_treatment > 0 else 0.0

    # Lift percentage
    lift_pct = (
        (conv_rate_treatment - conv_rate_control) / conv_rate_control * 100
        if conv_rate_control > 0
        else 0.0
    )

    # Statistical test
    z_result = z_test_proportions(n_control, conv_control, n_treatment, conv_treatment)
    is_significant = z_result["p_value"] < 0.05

    # Verdict
    if z_result["p_value"] >= 0.05:
        verdict = "NEEDS MORE DATA"
    elif conv_rate_treatment > conv_rate_control:
        verdict = "SHIP IT"
    else:
        verdict = "DON'T SHIP"

    # Revenue metrics (if available)
    revenue_control_mean = (
        round(float(control["revenue"].mean()), 4)
        if "revenue" in control.columns and not control.empty
        else None
    )
    revenue_treatment_mean = (
        round(float(treatment["revenue"].mean()), 4)
        if "revenue" in treatment.columns and not treatment.empty
        else None
    )
    revenue_lift = None
    if revenue_control_mean is not None and revenue_treatment_mean is not None:
        revenue_lift = round(revenue_treatment_mean - revenue_control_mean, 4)

    # SRM test
    srm = sample_ratio_mismatch_test(n_control, n_treatment)

    # Power at observed MDE
    observed_mde = abs(conv_rate_treatment - conv_rate_control)
    min_n = min(n_control, n_treatment)
    pwr_list = power_curve(
        conv_rate_control,
        min_n,
        alpha=0.05,
        effect_sizes=[observed_mde] if observed_mde > 0 else [0.01],
    )
    achieved_power = pwr_list[0]["power"] if pwr_list else None

    return {
        "n_control": n_control,
        "n_treatment": n_treatment,
        "conv_rate_control": round(conv_rate_control, 6),
        "conv_rate_treatment": round(conv_rate_treatment, 6),
        "lift_pct": round(lift_pct, 4),
        "p_value": z_result["p_value"],
        "is_significant": is_significant,
        "verdict": verdict,
        "revenue_control_mean": revenue_control_mean,
        "revenue_treatment_mean": revenue_treatment_mean,
        "revenue_lift": revenue_lift,
        "srm_test": srm,
        "power": achieved_power,
    }
