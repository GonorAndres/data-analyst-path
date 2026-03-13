"""Segment-level treatment effects and Simpson's paradox detection."""

from typing import Dict, List, Optional

from fastapi import APIRouter, Query

from abtest_backend import data_loader
from abtest_backend.stats_engine import z_test_proportions

router = APIRouter()

SEGMENT_DIMENSIONS = [
    "device_type",
    "browser",
    "country",
    "user_segment",
    "traffic_source",
]


def _segment_effects(df, dimension: str) -> List[Dict]:
    """Compute treatment effect for each value of a segment dimension."""
    if dimension not in df.columns or df.empty:
        return []

    results = []
    for val in sorted(df[dimension].dropna().unique()):
        seg = df[df[dimension] == val]
        ctrl = seg[seg["group"] == "control"]
        treat = seg[seg["group"] == "treatment"]

        n_a = len(ctrl)
        n_b = len(treat)
        conv_a = int(ctrl["converted"].sum())
        conv_b = int(treat["converted"].sum())

        if n_a == 0 or n_b == 0:
            continue

        p_a = conv_a / n_a
        p_b = conv_b / n_b
        lift = (p_b - p_a) / p_a * 100 if p_a > 0 else 0.0

        z_result = z_test_proportions(n_a, conv_a, n_b, conv_b)

        results.append({
            "segment": str(val),
            "n_control": n_a,
            "n_treatment": n_b,
            "n_total": n_a + n_b,
            "conv_rate_control": round(p_a, 6),
            "conv_rate_treatment": round(p_b, 6),
            "lift_pct": round(lift, 4),
            "p_value": z_result["p_value"],
            "ci_lower": z_result["ci_lower"],
            "ci_upper": z_result["ci_upper"],
            "is_significant": z_result["p_value"] < 0.05,
        })

    return results


def _simpsons_paradox(df) -> Dict:
    """Compare aggregate result to user_segment breakdown.

    Simpson's paradox occurs when the aggregate effect direction differs
    from the direction seen within every individual segment.
    """
    if df.empty:
        return {"detected": False, "detail": "No data"}

    # Aggregate
    ctrl = df[df["group"] == "control"]
    treat = df[df["group"] == "treatment"]
    n_a, n_b = len(ctrl), len(treat)
    conv_a, conv_b = int(ctrl["converted"].sum()), int(treat["converted"].sum())

    if n_a == 0 or n_b == 0:
        return {"detected": False, "detail": "Insufficient data"}

    agg_rate_a = conv_a / n_a
    agg_rate_b = conv_b / n_b
    agg_direction = "treatment" if agg_rate_b > agg_rate_a else "control"

    # Per user_segment
    segment_effects = _segment_effects(df, "user_segment")
    if not segment_effects:
        return {"detected": False, "detail": "No user_segment data"}

    segment_directions = []
    for seg in segment_effects:
        direction = (
            "treatment"
            if seg["conv_rate_treatment"] > seg["conv_rate_control"]
            else "control"
        )
        segment_directions.append({
            "segment": seg["segment"],
            "direction": direction,
            "control_rate": seg["conv_rate_control"],
            "treatment_rate": seg["conv_rate_treatment"],
            "lift": seg["lift_pct"],
        })

    # Paradox: aggregate direction disagrees with ALL segment directions
    all_opposite = all(
        s["direction"] != agg_direction for s in segment_directions
    )

    agg_lift = (agg_rate_b - agg_rate_a) / agg_rate_a * 100 if agg_rate_a > 0 else 0.0

    return {
        "detected": all_opposite and len(segment_directions) > 1,
        "aggregate_direction": agg_direction,
        "aggregate_control_rate": round(agg_rate_a, 6),
        "aggregate_treatment_rate": round(agg_rate_b, 6),
        "aggregate_lift": round(agg_lift, 4),
        "segments": segment_directions,
    }


@router.get("/segments")
def segments(
    device_type: Optional[str] = Query(None),
    browser: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    user_segment: Optional[str] = Query(None),
    traffic_source: Optional[str] = Query(None),
):
    """Return segment-level treatment effects and Simpson's paradox check."""
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

    segment_results = {}
    for dim in SEGMENT_DIMENSIONS:
        segment_results[dim] = _segment_effects(df, dim)

    simpsons = _simpsons_paradox(df)

    return {
        "segments": segment_results,
        "simpsons_paradox": simpsons,
    }
