"""Default portfolio configuration and constants."""

from pathlib import Path

DEFAULT_PORTFOLIO = {
    "VOO": {"name": "Vanguard S&P 500 ETF", "weight": 0.30, "category": "US Equity"},
    "VXUS": {"name": "Vanguard Total Intl Stock ETF", "weight": 0.20, "category": "International Equity"},
    "VWO": {"name": "Vanguard FTSE Emerging Markets ETF", "weight": 0.10, "category": "Emerging Markets"},
    "BND": {"name": "Vanguard Total Bond Market ETF", "weight": 0.20, "category": "Fixed Income"},
    "VNQ": {"name": "Vanguard Real Estate ETF", "weight": 0.10, "category": "Real Estate"},
    "GLD": {"name": "SPDR Gold Shares", "weight": 0.10, "category": "Commodities"},
}

BENCHMARK_TICKER = "SPY"

RISK_FREE_RATE = 0.045  # ~4.5% (current T-bill rate)

TRADING_DAYS = 252

CACHE_DIR = Path(__file__).parent.parent.parent / "data" / "cache"

CACHE_TTL_HOURS = 4  # Re-fetch after 4 hours

INITIAL_VALUE = 100_000  # Assumed initial portfolio value in USD
