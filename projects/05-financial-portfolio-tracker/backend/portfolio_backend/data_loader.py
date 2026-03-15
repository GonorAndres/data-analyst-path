"""Fetch price data via yfinance with file-based parquet caching."""

import datetime as dt
from pathlib import Path
from typing import Optional

import pandas as pd
import yfinance as yf

from portfolio_backend.config import (
    BENCHMARK_TICKER,
    CACHE_DIR,
    CACHE_TTL_HOURS,
    DEFAULT_PORTFOLIO,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cache_path(tickers: list[str], period: str) -> Path:
    """Return the parquet cache file path for a set of tickers + period."""
    key = "_".join(sorted(tickers)) + f"_{period}"
    return CACHE_DIR / f"{key}.parquet"


def _meta_path(tickers: list[str], period: str) -> Path:
    """Return the metadata file (stores fetch timestamp)."""
    key = "_".join(sorted(tickers)) + f"_{period}"
    return CACHE_DIR / f"{key}.meta"


def _cache_is_fresh(tickers: list[str], period: str) -> bool:
    """Check whether the cache exists and is younger than CACHE_TTL_HOURS."""
    meta = _meta_path(tickers, period)
    if not meta.exists():
        return False
    try:
        ts = dt.datetime.fromisoformat(meta.read_text().strip())
        age = dt.datetime.now() - ts
        return age.total_seconds() < CACHE_TTL_HOURS * 3600
    except (ValueError, OSError):
        return False


# ---------------------------------------------------------------------------
# Core fetching
# ---------------------------------------------------------------------------

def fetch_prices(tickers: list[str], period: str = "5y") -> pd.DataFrame:
    """Download adjusted close prices via yfinance.

    Args:
        tickers: List of Yahoo Finance ticker symbols.
        period: yfinance period string (1y, 2y, 3y, 5y, 10y, max).

    Returns:
        DataFrame with DatetimeIndex and one column per ticker (adjusted close).
    """
    try:
        raw = yf.download(tickers, period=period, auto_adjust=True, progress=False)
    except Exception as exc:
        print(f"  WARNING: yfinance download failed: {exc}")
        return pd.DataFrame()

    if raw.empty:
        return pd.DataFrame()

    # yf.download returns MultiIndex columns when >1 ticker: (Price, Ticker)
    if isinstance(raw.columns, pd.MultiIndex):
        prices = raw["Close"]
    else:
        # Single ticker returns flat columns
        prices = raw[["Close"]].rename(columns={"Close": tickers[0]})

    prices = prices.dropna(how="all")
    return prices


def get_cached_or_fetch(tickers: list[str], period: str = "5y") -> pd.DataFrame:
    """Return cached prices if fresh, otherwise re-fetch and cache."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = _cache_path(tickers, period)

    if _cache_is_fresh(tickers, period) and cache.exists():
        try:
            df = pd.read_parquet(cache)
            print(f"  Cache hit: {cache.name} ({len(df)} rows)")
            return df
        except Exception:
            pass  # fall through to re-fetch

    df = fetch_prices(tickers, period)

    if not df.empty:
        try:
            df.to_parquet(cache)
            _meta_path(tickers, period).write_text(dt.datetime.now().isoformat())
            print(f"  Cached {cache.name} ({len(df)} rows)")
        except Exception as exc:
            print(f"  WARNING: could not write cache: {exc}")

    return df


# ---------------------------------------------------------------------------
# Portfolio-level data
# ---------------------------------------------------------------------------

def get_portfolio_data(
    portfolio: Optional[dict] = None,
    benchmark: Optional[str] = None,
    period: str = "5y",
) -> dict:
    """Fetch prices and compute returns for portfolio + benchmark.

    Returns:
        dict with keys:
            prices        - DataFrame of adjusted close prices
            returns       - DataFrame of daily log returns per ticker
            portfolio_returns - Series of weighted portfolio daily returns
            benchmark_returns - Series of benchmark daily returns
            tickers       - list of portfolio ticker symbols
            weights       - dict of ticker -> weight
    """
    if portfolio is None:
        portfolio = DEFAULT_PORTFOLIO
    if benchmark is None:
        benchmark = BENCHMARK_TICKER

    tickers = list(portfolio.keys())
    all_tickers = tickers + [benchmark] if benchmark not in tickers else tickers

    prices = get_cached_or_fetch(all_tickers, period)

    if prices.empty:
        return {
            "prices": pd.DataFrame(),
            "returns": pd.DataFrame(),
            "portfolio_returns": pd.Series(dtype=float),
            "benchmark_returns": pd.Series(dtype=float),
            "tickers": tickers,
            "weights": {t: portfolio[t]["weight"] for t in tickers},
        }

    # Daily simple returns (arithmetic, not log -- standard for portfolio math)
    returns = prices.pct_change().dropna(how="all")

    # Align: only use tickers present in both portfolio dict AND returns columns
    portfolio_tickers_present = [
        t for t in tickers if t in returns.columns and t in portfolio
    ]
    weights_series = pd.Series(
        {t: portfolio[t]["weight"] for t in portfolio_tickers_present}
    )
    # Re-normalise weights in case a ticker is missing
    weights_series = weights_series / weights_series.sum()

    # Weighted portfolio returns
    portfolio_returns = (
        returns[portfolio_tickers_present].multiply(weights_series).sum(axis=1)
    )
    portfolio_returns = portfolio_returns.dropna()

    # Benchmark returns
    if benchmark in returns.columns:
        benchmark_returns = returns[benchmark].dropna()
    else:
        benchmark_returns = pd.Series(dtype=float)

    return {
        "prices": prices,
        "returns": returns,
        "portfolio_returns": portfolio_returns,
        "benchmark_returns": benchmark_returns,
        "tickers": portfolio_tickers_present,
        "weights": weights_series.to_dict(),
    }
