"""Overview endpoint -- portfolio KPIs, allocation, benchmark comparison."""

import datetime as dt
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from portfolio_backend import data_loader
from portfolio_backend.config import DEFAULT_PORTFOLIO, INITIAL_VALUE, RISK_FREE_RATE
from portfolio_backend import portfolio_engine as engine

router = APIRouter()


@router.get("/overview")
def overview(period: Optional[str] = Query("5y", pattern="^(1y|2y|3y|5y|10y|max)$")):
    """Return top-level portfolio KPIs, allocation, and benchmark comparison."""
    data = data_loader.get_portfolio_data(period=period)
    port_ret = data["portfolio_returns"]
    bench_ret = data["benchmark_returns"]

    if port_ret.empty:
        return {"error": "No data available. yfinance may be unreachable."}

    # ── KPIs ─────────────────────────────────────────────────────────────
    cum = engine.cumulative_returns(port_ret)
    total_return = float(cum.iloc[-1]) if not cum.empty else 0.0
    current_value = round(INITIAL_VALUE * (1 + total_return), 2)

    # YTD return
    current_year = dt.datetime.now().year
    ytd_mask = port_ret.index.year == current_year
    ytd_returns = port_ret[ytd_mask]
    ytd_return = float((1 + ytd_returns).prod() - 1) if not ytd_returns.empty else 0.0

    # 1-year return
    one_year_ago = port_ret.index[-1] - pd.Timedelta(days=365)
    one_year_mask = port_ret.index >= one_year_ago
    ret_1y_series = port_ret[one_year_mask]
    ret_1y = float((1 + ret_1y_series).prod() - 1) if not ret_1y_series.empty else 0.0

    ann_ret = engine.annualized_return(port_ret)
    ann_vol = engine.annualized_volatility(port_ret)
    sr = engine.sharpe_ratio(port_ret, RISK_FREE_RATE)
    mdd = engine.max_drawdown(port_ret)

    # ── Allocation breakdown ─────────────────────────────────────────────
    allocation = []
    for ticker in data["tickers"]:
        info = DEFAULT_PORTFOLIO.get(ticker, {})
        w = data["weights"].get(ticker, 0.0)
        allocation.append({
            "ticker": ticker,
            "name": info.get("name", ticker),
            "weight": round(w, 4),
            "category": info.get("category", "Other"),
            "current_value": round(current_value * w, 2),
        })

    # ── Benchmark comparison ─────────────────────────────────────────────
    bench_cum = engine.cumulative_returns(bench_ret) if not bench_ret.empty else None
    bench_total = float(bench_cum.iloc[-1]) if bench_cum is not None and not bench_cum.empty else 0.0
    bench_ann_ret = engine.annualized_return(bench_ret) if not bench_ret.empty else 0.0
    bench_ann_vol = engine.annualized_volatility(bench_ret) if not bench_ret.empty else 0.0
    bench_sr = engine.sharpe_ratio(bench_ret, RISK_FREE_RATE) if not bench_ret.empty else 0.0

    return {
        "portfolio_value": current_value,
        "initial_value": INITIAL_VALUE,
        "total_return": round(total_return, 6),
        "ytd_return": round(ytd_return, 6),
        "return_1y": round(ret_1y, 6),
        "annualized_return": round(ann_ret, 6),
        "annualized_volatility": round(ann_vol, 6),
        "sharpe_ratio": round(sr, 4),
        "max_drawdown": mdd,
        "allocation": allocation,
        "benchmark": {
            "ticker": data_loader.BENCHMARK_TICKER if hasattr(data_loader, "BENCHMARK_TICKER") else "SPY",
            "total_return": round(bench_total, 6),
            "annualized_return": round(bench_ann_ret, 6),
            "annualized_volatility": round(bench_ann_vol, 6),
            "sharpe_ratio": round(bench_sr, 4),
        },
        "period": period,
        "last_updated": dt.datetime.now().isoformat(),
    }
