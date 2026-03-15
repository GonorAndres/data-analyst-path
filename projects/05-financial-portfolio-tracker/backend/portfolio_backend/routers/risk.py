"""Risk endpoint -- VaR, CVaR, ratios, rolling volatility, distribution."""

from typing import Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, Query

from portfolio_backend import data_loader
from portfolio_backend.config import RISK_FREE_RATE
from portfolio_backend import portfolio_engine as engine

router = APIRouter()


@router.get("/risk")
def risk(period: Optional[str] = Query("5y", pattern="^(1y|2y|3y|5y|10y|max)$")):
    """Return comprehensive risk metrics for the portfolio."""
    data = data_loader.get_portfolio_data(period=period)
    port_ret = data["portfolio_returns"]
    bench_ret = data["benchmark_returns"]

    if port_ret.empty:
        return {"error": "No data available."}

    # ── VaR & CVaR ───────────────────────────────────────────────────────
    var_metrics = {
        "parametric_95": round(engine.var_parametric(port_ret, 0.95), 6),
        "parametric_99": round(engine.var_parametric(port_ret, 0.99), 6),
        "historical_95": round(engine.var_historical(port_ret, 0.95), 6),
        "historical_99": round(engine.var_historical(port_ret, 0.99), 6),
        "montecarlo_95": round(engine.var_montecarlo(port_ret, 0.95), 6),
        "montecarlo_99": round(engine.var_montecarlo(port_ret, 0.99), 6),
    }

    cvar_metrics = {
        "cvar_95": round(engine.cvar(port_ret, 0.95), 6),
        "cvar_99": round(engine.cvar(port_ret, 0.99), 6),
    }

    # ── Ratios ───────────────────────────────────────────────────────────
    ratios = {
        "sharpe": round(engine.sharpe_ratio(port_ret, RISK_FREE_RATE), 4),
        "sortino": round(engine.sortino_ratio(port_ret, RISK_FREE_RATE), 4),
        "calmar": round(engine.calmar_ratio(port_ret), 4),
    }

    # ── Benchmark-relative ───────────────────────────────────────────────
    benchmark_relative = {}
    if not bench_ret.empty:
        benchmark_relative = {
            "beta": round(engine.beta(port_ret, bench_ret), 4),
            "alpha": round(engine.alpha(port_ret, bench_ret, RISK_FREE_RATE), 6),
            "tracking_error": round(engine.tracking_error(port_ret, bench_ret), 6),
            "information_ratio": round(engine.information_ratio(port_ret, bench_ret), 4),
        }

    # ── Rolling volatility ───────────────────────────────────────────────
    def _rolling_vol_json(window: int) -> list[dict]:
        rv = port_ret.rolling(window).std() * np.sqrt(252)
        return [
            {"date": str(idx.date()) if hasattr(idx, "date") else str(idx), "value": round(float(v), 6)}
            for idx, v in rv.items()
            if pd.notna(v)
        ]

    rolling_vol = {
        "30d": _rolling_vol_json(30),
        "90d": _rolling_vol_json(90),
    }

    # ── Return distribution ──────────────────────────────────────────────
    hist_values, bin_edges = np.histogram(port_ret.dropna().values, bins=50)
    distribution = {
        "counts": hist_values.tolist(),
        "bin_edges": [round(float(b), 8) for b in bin_edges.tolist()],
        "mean": round(float(port_ret.mean()), 8),
        "std": round(float(port_ret.std()), 8),
        "skewness": round(float(port_ret.skew()), 4),
        "kurtosis": round(float(port_ret.kurtosis()), 4),
    }

    return {
        "var": var_metrics,
        "cvar": cvar_metrics,
        "ratios": ratios,
        "benchmark_relative": benchmark_relative,
        "rolling_volatility": rolling_vol,
        "return_distribution": distribution,
        "period": period,
    }
