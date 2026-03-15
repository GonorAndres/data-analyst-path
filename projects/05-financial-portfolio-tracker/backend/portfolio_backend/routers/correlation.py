"""Correlation endpoint -- matrix, rolling correlation, diversification."""

from typing import Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, Query

from portfolio_backend import data_loader
from portfolio_backend import portfolio_engine as engine

router = APIRouter()


@router.get("/correlation")
def correlation(period: Optional[str] = Query("5y", pattern="^(1y|2y|3y|5y|10y|max)$")):
    """Return correlation matrix, rolling correlations, diversification ratio."""
    data = data_loader.get_portfolio_data(period=period)
    returns_df = data["returns"]
    port_ret = data["portfolio_returns"]
    tickers = data["tickers"]

    if port_ret.empty:
        return {"error": "No data available."}

    # Filter to portfolio tickers only
    asset_returns = returns_df[[t for t in tickers if t in returns_df.columns]].dropna()

    # ── Correlation matrix ───────────────────────────────────────────────
    corr = engine.correlation_matrix(asset_returns)
    corr_json = {
        "tickers": corr.columns.tolist(),
        "matrix": [[round(float(v), 4) for v in row] for row in corr.values],
    }

    # ── Rolling correlation vs portfolio ─────────────────────────────────
    rolling_corr = {}
    for ticker in tickers:
        if ticker in returns_df.columns:
            rc = engine.rolling_correlation(returns_df[ticker], port_ret, window=60)
            rolling_corr[ticker] = [
                {
                    "date": str(idx.date()) if hasattr(idx, "date") else str(idx),
                    "value": round(float(v), 4),
                }
                for idx, v in rc.items()
                if pd.notna(v)
            ]

    # ── Diversification ratio ────────────────────────────────────────────
    # DR = (sum of weighted individual vols) / portfolio vol
    weights = data["weights"]
    individual_vols = asset_returns.std() * np.sqrt(252)
    weighted_vol_sum = sum(
        weights.get(t, 0.0) * float(individual_vols.get(t, 0.0))
        for t in tickers
        if t in individual_vols.index
    )
    port_vol = float(port_ret.std() * np.sqrt(252))
    diversification_ratio = round(weighted_vol_sum / port_vol, 4) if port_vol > 0 else 0.0

    return {
        "correlation_matrix": corr_json,
        "rolling_correlation": rolling_corr,
        "diversification_ratio": diversification_ratio,
        "period": period,
    }
