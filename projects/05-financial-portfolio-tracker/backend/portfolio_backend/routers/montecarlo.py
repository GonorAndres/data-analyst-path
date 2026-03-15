"""Monte Carlo simulation endpoint."""

from typing import Optional

import numpy as np
from fastapi import APIRouter, Query

from portfolio_backend import data_loader
from portfolio_backend.config import INITIAL_VALUE
from portfolio_backend import portfolio_engine as engine

router = APIRouter()


@router.get("/montecarlo")
def montecarlo(
    period: Optional[str] = Query("5y", pattern="^(1y|2y|3y|5y|10y|max)$"),
    days: int = Query(252, ge=1, le=2520, description="Trading days to simulate"),
    simulations: int = Query(1000, ge=100, le=50000, description="Number of paths"),
    initial_value: float = Query(INITIAL_VALUE, ge=1, description="Starting value in USD"),
    target: float = Query(120_000, ge=0, description="Target value for probability calc"),
):
    """Run Monte Carlo simulation and return percentile paths + statistics."""
    data = data_loader.get_portfolio_data(period=period)
    port_ret = data["portfolio_returns"]

    if port_ret.empty:
        return {"error": "No data available."}

    result = engine.monte_carlo_simulation(
        returns=port_ret,
        initial_value=initial_value,
        days=days,
        n_simulations=simulations,
    )

    final_values = result["final_values"]

    if len(final_values) == 0:
        return {"error": "Simulation produced no results."}

    # Probability of reaching target
    prob_reach_target = engine.prob_target(final_values, target)

    # VaR from simulation (loss at 5th percentile)
    var_95 = float(initial_value - np.percentile(final_values, 5))
    var_99 = float(initial_value - np.percentile(final_values, 1))

    # Subsample paths for JSON (sending all 1000+ paths is too much)
    # Send percentile envelopes instead
    percentile_paths = {}
    for pct, values in result["percentiles"].items():
        # Downsample to at most 252 points for JSON efficiency
        arr = np.array(values)
        if len(arr) > 252:
            indices = np.linspace(0, len(arr) - 1, 252, dtype=int)
            arr = arr[indices]
        percentile_paths[str(pct)] = [round(float(v), 2) for v in arr]

    return {
        "percentile_paths": percentile_paths,
        "prob_profit": round(result["prob_profit"], 4),
        "prob_target": round(prob_reach_target, 4),
        "target": target,
        "final_value_stats": {
            "mean": round(float(np.mean(final_values)), 2),
            "median": round(float(np.median(final_values)), 2),
            "std": round(float(np.std(final_values)), 2),
            "min": round(float(np.min(final_values)), 2),
            "max": round(float(np.max(final_values)), 2),
            "percentile_5": round(float(np.percentile(final_values, 5)), 2),
            "percentile_25": round(float(np.percentile(final_values, 25)), 2),
            "percentile_75": round(float(np.percentile(final_values, 75)), 2),
            "percentile_95": round(float(np.percentile(final_values, 95)), 2),
        },
        "var_from_simulation": {
            "var_95": round(var_95, 2),
            "var_99": round(var_99, 2),
        },
        "initial_value": initial_value,
        "days": days,
        "simulations": simulations,
        "period": period,
    }
