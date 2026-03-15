"""Efficient frontier endpoint -- random portfolios, optimised points, frontier curve."""

from typing import Optional

import numpy as np
from fastapi import APIRouter, Query

from portfolio_backend import data_loader
from portfolio_backend.config import DEFAULT_PORTFOLIO, RISK_FREE_RATE, TRADING_DAYS
from portfolio_backend import portfolio_engine as engine

router = APIRouter()


@router.get("/frontier")
def frontier(period: Optional[str] = Query("5y", pattern="^(1y|2y|3y|5y|10y|max)$")):
    """Return efficient frontier data: random cloud, frontier curve, optimal portfolios."""
    data = data_loader.get_portfolio_data(period=period)
    returns_df = data["returns"]
    port_ret = data["portfolio_returns"]
    tickers = data["tickers"]
    weights = data["weights"]

    if port_ret.empty:
        return {"error": "No data available."}

    # Use only portfolio asset returns (not benchmark)
    asset_returns = returns_df[[t for t in tickers if t in returns_df.columns]].dropna()

    if asset_returns.empty or asset_returns.shape[1] < 2:
        return {"error": "Need at least 2 assets for frontier analysis."}

    # ── Random portfolio cloud ───────────────────────────────────────────
    cloud = engine.random_portfolios(asset_returns, n_portfolios=5000, rf_rate=RISK_FREE_RATE)

    # ── Efficient frontier curve ─────────────────────────────────────────
    curve = engine.efficient_frontier_curve(asset_returns, n_points=50, rf_rate=RISK_FREE_RATE)

    # ── Optimal portfolios ───────────────────────────────────────────────
    min_var = engine.min_variance_portfolio(asset_returns, rf_rate=RISK_FREE_RATE)
    max_sr = engine.max_sharpe_portfolio(asset_returns, rf_rate=RISK_FREE_RATE)

    # ── Current portfolio point ──────────────────────────────────────────
    mean_returns = asset_returns.mean() * TRADING_DAYS
    cov_matrix = asset_returns.cov() * TRADING_DAYS

    w_current = np.array([weights.get(t, 0.0) for t in asset_returns.columns])
    if w_current.sum() > 0:
        w_current = w_current / w_current.sum()
    current_ret = float(np.dot(w_current, mean_returns))
    current_vol = float(np.sqrt(np.dot(w_current.T, np.dot(cov_matrix.values, w_current))))
    current_sharpe = (current_ret - RISK_FREE_RATE) / current_vol if current_vol > 0 else 0.0

    current_portfolio = {
        "weights": {col: round(float(w_current[i]), 6) for i, col in enumerate(asset_returns.columns)},
        "return": round(current_ret, 6),
        "volatility": round(current_vol, 6),
        "sharpe": round(current_sharpe, 4),
    }

    # ── Individual asset points ──────────────────────────────────────────
    individual_assets = []
    for ticker in asset_returns.columns:
        asset_ann_ret = float(mean_returns[ticker])
        asset_ann_vol = float(asset_returns[ticker].std() * np.sqrt(TRADING_DAYS))
        asset_sr = (asset_ann_ret - RISK_FREE_RATE) / asset_ann_vol if asset_ann_vol > 0 else 0.0
        info = DEFAULT_PORTFOLIO.get(ticker, {})
        individual_assets.append({
            "ticker": ticker,
            "name": info.get("name", ticker),
            "return": round(asset_ann_ret, 6),
            "volatility": round(asset_ann_vol, 6),
            "sharpe": round(asset_sr, 4),
        })

    # ── Downsample cloud for JSON ────────────────────────────────────────
    # Send all 5000 points but only returns/vol/sharpe (not full weight vectors)
    cloud_data = {
        "returns": [round(v, 6) for v in cloud["returns"]],
        "volatilities": [round(v, 6) for v in cloud["volatilities"]],
        "sharpe_ratios": [round(v, 4) for v in cloud["sharpe_ratios"]],
    }

    return {
        "cloud": cloud_data,
        "frontier_curve": curve,
        "current_portfolio": current_portfolio,
        "min_variance": min_var,
        "max_sharpe": max_sr,
        "individual_assets": individual_assets,
        "tickers": list(asset_returns.columns),
        "period": period,
    }
