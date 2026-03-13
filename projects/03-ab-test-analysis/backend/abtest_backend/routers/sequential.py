"""Sequential testing endpoint -- daily cumulative stats and stopping rules."""

from typing import Optional

from fastapi import APIRouter, Query

from abtest_backend import data_loader
from abtest_backend.stats_engine import (
    cumulative_stats_by_day,
    obrien_fleming_bounds,
)

router = APIRouter()


@router.get("/sequential")
def sequential(
    device_type: Optional[str] = Query(None),
    browser: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    user_segment: Optional[str] = Query(None),
    traffic_source: Optional[str] = Query(None),
):
    """Return sequential test data: daily cumulative stats,
    O'Brien-Fleming boundaries, daily p-values, and optimal stopping point."""
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

    # Daily cumulative statistics
    cum_stats = cumulative_stats_by_day(df)

    if not cum_stats:
        return {
            "cumulative_stats": [],
            "obrien_fleming_boundaries": [],
            "daily_p_values": [],
            "optimal_stopping_point": None,
        }

    n_days = len(cum_stats)

    # O'Brien-Fleming boundaries for each day as a look
    boundaries = obrien_fleming_bounds(n_days, alpha=0.05)

    # Daily p-values (extracted from cumulative stats)
    daily_p_values = [
        {"date": day["date"], "p_value": day["p_value"]}
        for day in cum_stats
    ]

    # Find optimal stopping point: first day where |z_stat| exceeds boundary
    optimal_stopping = None
    for i, day in enumerate(cum_stats):
        if i < len(boundaries) and abs(day["z_stat"]) >= boundaries[i]:
            optimal_stopping = {
                "date": day["date"],
                "day_number": i + 1,
                "z_stat": day["z_stat"],
                "boundary": boundaries[i],
                "p_value": day["p_value"],
                "cum_n_control": day["cum_n_control"],
                "cum_n_treatment": day["cum_n_treatment"],
            }
            break

    return {
        "cumulative_stats": cum_stats,
        "obrien_fleming_boundaries": [
            {"day": i + 1, "date": cum_stats[i]["date"], "boundary": b}
            for i, b in enumerate(boundaries)
        ],
        "daily_p_values": daily_p_values,
        "optimal_stopping_point": optimal_stopping,
    }
