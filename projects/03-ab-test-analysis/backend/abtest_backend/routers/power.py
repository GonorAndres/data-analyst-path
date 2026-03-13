"""Power analysis endpoint."""

from typing import Optional

from fastapi import APIRouter, Query

from abtest_backend import data_loader
from abtest_backend.stats_engine import (
    minimum_detectable_effect,
    power_curve,
    required_sample_size,
)

router = APIRouter()


@router.get("/power")
def power(
    baseline_rate: Optional[float] = Query(None),
    mde: float = Query(0.01),
    alpha: float = Query(0.05),
    power_level: float = Query(0.8, alias="power"),
):
    """Return power analysis: required sample size, MDE curve, power curve,
    and runtime estimate based on daily traffic."""
    df = data_loader.df

    # Derive baseline from data if not provided
    if baseline_rate is None:
        control = df[df["group"] == "control"] if not df.empty else df
        baseline_rate = (
            float(control["converted"].mean())
            if not control.empty
            else 0.12  # fallback default
        )

    # Current sample sizes
    n_control = len(df[df["group"] == "control"]) if not df.empty else 0
    n_treatment = len(df[df["group"] == "treatment"]) if not df.empty else 0
    current_n = min(n_control, n_treatment)

    # Required sample size for desired MDE
    req_n = required_sample_size(baseline_rate, mde, alpha, power_level)
    is_adequate = current_n >= req_n

    # MDE curve: required n for a range of effect sizes
    mde_sizes = [round(x, 4) for x in [
        0.001, 0.002, 0.003, 0.005, 0.007,
        0.01, 0.015, 0.02, 0.025, 0.03,
        0.04, 0.05, 0.07, 0.1,
    ]]
    mde_curve = []
    for es in mde_sizes:
        n_needed = required_sample_size(baseline_rate, es, alpha, power_level)
        mde_curve.append({"effect_size": es, "required_n": n_needed})

    # Power curve at current sample size
    pwr_curve = power_curve(baseline_rate, current_n, alpha)

    # Actual MDE at current sample size
    actual_mde = minimum_detectable_effect(
        current_n, baseline_rate, alpha, power_level
    ) if current_n > 0 else None

    # Runtime estimate based on daily traffic
    daily_traffic = 0
    if not df.empty and "date" in df.columns:
        daily_counts = df.groupby("date").size()
        daily_traffic = int(daily_counts.mean())

    runtime_days = None
    if daily_traffic > 0 and req_n > 0:
        # Each group gets ~half the daily traffic
        daily_per_group = daily_traffic / 2
        remaining = max(0, req_n - current_n)
        runtime_days = int(remaining / daily_per_group) + 1 if remaining > 0 else 0

    return {
        "baseline_rate": round(baseline_rate, 6),
        "target_mde": mde,
        "alpha": alpha,
        "power": power_level,
        "required_sample_size_per_group": req_n,
        "current_sample_size": {
            "control": n_control,
            "treatment": n_treatment,
            "min": current_n,
        },
        "is_adequate": is_adequate,
        "actual_mde": actual_mde,
        "mde_curve": mde_curve,
        "power_curve": pwr_curve,
        "daily_traffic": daily_traffic,
        "runtime_estimate_days": runtime_days,
    }
