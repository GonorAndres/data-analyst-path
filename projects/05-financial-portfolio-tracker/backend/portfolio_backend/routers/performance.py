"""Performance endpoint -- returns, drawdowns, attribution, calendar."""

from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query

from portfolio_backend import data_loader
from portfolio_backend.config import DEFAULT_PORTFOLIO
from portfolio_backend import portfolio_engine as engine

router = APIRouter()


def _series_to_json(s: pd.Series) -> list[dict]:
    """Convert a datetime-indexed series to [{date, value}, ...]."""
    if s.empty:
        return []
    return [
        {"date": str(idx.date()) if hasattr(idx, "date") else str(idx), "value": round(float(v), 6)}
        for idx, v in s.items()
        if pd.notna(v)
    ]


@router.get("/performance")
def performance(period: Optional[str] = Query("5y", pattern="^(1y|2y|3y|5y|10y|max)$")):
    """Return cumulative returns, rolling returns, drawdowns, calendar, attribution."""
    data = data_loader.get_portfolio_data(period=period)
    port_ret = data["portfolio_returns"]
    bench_ret = data["benchmark_returns"]
    returns_df = data["returns"]

    if port_ret.empty:
        return {"error": "No data available."}

    # ── Cumulative returns ───────────────────────────────────────────────
    cum_portfolio = engine.cumulative_returns(port_ret)
    cum_benchmark = engine.cumulative_returns(bench_ret) if not bench_ret.empty else pd.Series(dtype=float)

    cum_assets = {}
    for ticker in data["tickers"]:
        if ticker in returns_df.columns:
            cum_assets[ticker] = _series_to_json(engine.cumulative_returns(returns_df[ticker].dropna()))

    # ── Rolling returns ──────────────────────────────────────────────────
    rolling_30 = engine.rolling_returns(port_ret, 30)
    rolling_90 = engine.rolling_returns(port_ret, 90)
    rolling_252 = engine.rolling_returns(port_ret, 252)

    # ── Drawdown ─────────────────────────────────────────────────────────
    dd = engine.drawdown_series(port_ret)

    # ── Calendar returns ─────────────────────────────────────────────────
    cal = engine.calendar_returns(port_ret)
    calendar_data = []
    if not cal.empty:
        for year in cal.index:
            row = {"year": int(year)}
            for col in cal.columns:
                val = cal.loc[year, col]
                row[str(col)] = round(float(val), 6) if pd.notna(val) else None
            calendar_data.append(row)

    # ── Attribution ──────────────────────────────────────────────────────
    attribution = []
    for ticker in data["tickers"]:
        if ticker not in returns_df.columns:
            continue
        asset_ret = returns_df[ticker].dropna()
        w = data["weights"].get(ticker, 0.0)
        total_asset_return = float((1 + asset_ret).prod() - 1)
        contribution = w * total_asset_return
        info = DEFAULT_PORTFOLIO.get(ticker, {})
        attribution.append({
            "ticker": ticker,
            "name": info.get("name", ticker),
            "weight": round(w, 4),
            "asset_return": round(total_asset_return, 6),
            "contribution": round(contribution, 6),
        })

    return {
        "cumulative": {
            "portfolio": _series_to_json(cum_portfolio),
            "benchmark": _series_to_json(cum_benchmark),
            "assets": cum_assets,
        },
        "rolling": {
            "30d": _series_to_json(rolling_30),
            "90d": _series_to_json(rolling_90),
            "252d": _series_to_json(rolling_252),
        },
        "drawdown": _series_to_json(dd),
        "calendar_returns": calendar_data,
        "attribution": attribution,
        "period": period,
    }
