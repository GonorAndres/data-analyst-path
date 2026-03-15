"""Pure financial calculation functions -- no side effects.

All functions accept pandas Series/DataFrames and numpy arrays.
All return serialisable primitives (float, dict, list, DataFrame).
"""

from typing import Callable, Optional

import numpy as np
import pandas as pd
from scipy import optimize, stats

from portfolio_backend.config import RISK_FREE_RATE, TRADING_DAYS

# ═══════════════════════════════════════════════════════════════════════════
# Returns & Performance
# ═══════════════════════════════════════════════════════════════════════════


def cumulative_returns(returns: pd.Series) -> pd.Series:
    """Cumulative wealth index: (1 + r).cumprod() - 1."""
    return (1 + returns).cumprod() - 1


def rolling_returns(returns: pd.Series, window: int) -> pd.Series:
    """Rolling total return over *window* trading days."""
    return (1 + returns).rolling(window).apply(np.prod, raw=True) - 1


def annualized_return(returns: pd.Series) -> float:
    """CAGR from daily simple returns."""
    if returns.empty:
        return 0.0
    total = (1 + returns).prod()
    n_years = len(returns) / TRADING_DAYS
    if n_years <= 0 or total <= 0:
        return 0.0
    return float(total ** (1 / n_years) - 1)


def annualized_volatility(returns: pd.Series) -> float:
    """Annualised standard deviation of daily returns."""
    if returns.empty:
        return 0.0
    return float(returns.std() * np.sqrt(TRADING_DAYS))


def max_drawdown(returns: pd.Series) -> dict:
    """Compute maximum drawdown and its dates.

    Returns:
        dict with max_dd (negative float), peak_date, trough_date, recovery_date (or None).
    """
    if returns.empty:
        return {"max_dd": 0.0, "peak_date": None, "trough_date": None, "recovery_date": None}

    wealth = (1 + returns).cumprod()
    running_max = wealth.cummax()
    dd = wealth / running_max - 1

    trough_idx = dd.idxmin()
    max_dd = float(dd.min())

    # Peak is the running max just before the trough
    peak_idx = wealth.loc[:trough_idx].idxmax()

    # Recovery: first date after trough where wealth >= peak wealth
    peak_value = wealth.loc[peak_idx]
    post_trough = wealth.loc[trough_idx:]
    recovered = post_trough[post_trough >= peak_value]
    recovery_idx = recovered.index[0] if not recovered.empty else None

    return {
        "max_dd": round(max_dd, 6),
        "peak_date": str(peak_idx.date()) if hasattr(peak_idx, "date") else str(peak_idx),
        "trough_date": str(trough_idx.date()) if hasattr(trough_idx, "date") else str(trough_idx),
        "recovery_date": (
            str(recovery_idx.date()) if recovery_idx is not None and hasattr(recovery_idx, "date")
            else str(recovery_idx) if recovery_idx is not None
            else None
        ),
    }


def drawdown_series(returns: pd.Series) -> pd.Series:
    """Running drawdown from peak (always <= 0)."""
    wealth = (1 + returns).cumprod()
    running_max = wealth.cummax()
    return wealth / running_max - 1


def calendar_returns(returns: pd.Series) -> pd.DataFrame:
    """Monthly returns matrix: rows = years, columns = months (1-12).

    Cell value is the total return for that month.
    """
    if returns.empty:
        return pd.DataFrame()

    # Ensure DatetimeIndex for .year / .month access
    idx = pd.DatetimeIndex(returns.index)

    # Group by year-month
    monthly = returns.groupby([idx.year, idx.month]).apply(
        lambda x: (1 + x).prod() - 1
    )
    monthly.index.names = ["year", "month"]
    table = monthly.unstack(level="month")
    table.columns = [int(c) for c in table.columns]

    # Add YTD column -- reindex to match table rows in case of sparse years
    yearly = returns.groupby(idx.year).apply(
        lambda x: (1 + x).prod() - 1
    )
    table["YTD"] = yearly.reindex(table.index).values

    return table


# ═══════════════════════════════════════════════════════════════════════════
# Risk Metrics
# ═══════════════════════════════════════════════════════════════════════════


def sharpe_ratio(returns: pd.Series, rf_rate: float = RISK_FREE_RATE) -> float:
    """Annualised Sharpe ratio = (ann_ret - rf) / ann_vol."""
    vol = annualized_volatility(returns)
    if vol == 0:
        return 0.0
    return float((annualized_return(returns) - rf_rate) / vol)


def sortino_ratio(returns: pd.Series, rf_rate: float = RISK_FREE_RATE) -> float:
    """Annualised Sortino ratio -- only downside deviation in denominator."""
    excess = returns - rf_rate / TRADING_DAYS
    downside = excess[excess < 0]
    if downside.empty:
        return 0.0
    downside_std = float(np.sqrt((downside ** 2).mean()) * np.sqrt(TRADING_DAYS))
    if downside_std == 0:
        return 0.0
    ann_ret = annualized_return(returns)
    return float((ann_ret - rf_rate) / downside_std)


def calmar_ratio(returns: pd.Series) -> float:
    """Calmar ratio = annualised return / |max drawdown|."""
    mdd = max_drawdown(returns)["max_dd"]
    if mdd == 0:
        return 0.0
    return float(annualized_return(returns) / abs(mdd))


def beta(portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """Portfolio beta vs benchmark (OLS slope)."""
    aligned = pd.concat([portfolio_returns, benchmark_returns], axis=1).dropna()
    if len(aligned) < 2:
        return 0.0
    cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])
    var_benchmark = cov[1, 1]
    if var_benchmark == 0:
        return 0.0
    return float(cov[0, 1] / var_benchmark)


def alpha(
    portfolio_returns: pd.Series,
    benchmark_returns: pd.Series,
    rf_rate: float = RISK_FREE_RATE,
) -> float:
    """Jensen's alpha (annualised)."""
    b = beta(portfolio_returns, benchmark_returns)
    ret_p = annualized_return(portfolio_returns)
    ret_b = annualized_return(benchmark_returns)
    return float(ret_p - (rf_rate + b * (ret_b - rf_rate)))


def tracking_error(
    portfolio_returns: pd.Series, benchmark_returns: pd.Series
) -> float:
    """Annualised tracking error (std of return difference)."""
    diff = (portfolio_returns - benchmark_returns).dropna()
    if diff.empty:
        return 0.0
    return float(diff.std() * np.sqrt(TRADING_DAYS))


def information_ratio(
    portfolio_returns: pd.Series, benchmark_returns: pd.Series
) -> float:
    """Information ratio = excess return / tracking error."""
    te = tracking_error(portfolio_returns, benchmark_returns)
    if te == 0:
        return 0.0
    excess_ret = annualized_return(portfolio_returns) - annualized_return(benchmark_returns)
    return float(excess_ret / te)


def var_parametric(returns: pd.Series, confidence: float = 0.95) -> float:
    """Parametric (Gaussian) Value at Risk at given confidence level.

    Returns a positive number representing the loss (left-tail).
    """
    if returns.empty:
        return 0.0
    mu = returns.mean()
    sigma = returns.std()
    z = stats.norm.ppf(1 - confidence)
    return float(-(mu + z * sigma))


def var_historical(returns: pd.Series, confidence: float = 0.95) -> float:
    """Historical VaR: negative of the (1 - confidence) percentile."""
    if returns.empty:
        return 0.0
    return float(-np.percentile(returns.dropna(), (1 - confidence) * 100))


def cvar(returns: pd.Series, confidence: float = 0.95) -> float:
    """Conditional VaR (Expected Shortfall): mean of losses beyond VaR."""
    if returns.empty:
        return 0.0
    threshold = np.percentile(returns.dropna(), (1 - confidence) * 100)
    tail = returns[returns <= threshold]
    if tail.empty:
        return float(-threshold)
    return float(-tail.mean())


def var_montecarlo(
    returns: pd.Series,
    confidence: float = 0.95,
    n_sims: int = 10_000,
) -> float:
    """Monte Carlo VaR: simulate 1-day returns with GBM, take percentile."""
    if returns.empty:
        return 0.0
    mu = float(returns.mean())
    sigma = float(returns.std())
    rng = np.random.default_rng(42)
    simulated = rng.normal(mu, sigma, n_sims)
    return float(-np.percentile(simulated, (1 - confidence) * 100))


# ═══════════════════════════════════════════════════════════════════════════
# Correlation
# ═══════════════════════════════════════════════════════════════════════════


def correlation_matrix(returns_df: pd.DataFrame) -> pd.DataFrame:
    """Pearson correlation matrix of asset returns."""
    return returns_df.corr()


def rolling_correlation(
    returns1: pd.Series, returns2: pd.Series, window: int = 60
) -> pd.Series:
    """Rolling Pearson correlation between two return series."""
    return returns1.rolling(window).corr(returns2)


# ═══════════════════════════════════════════════════════════════════════════
# Monte Carlo Simulation
# ═══════════════════════════════════════════════════════════════════════════


def monte_carlo_simulation(
    returns: pd.Series,
    initial_value: float = 100_000,
    days: int = 252,
    n_simulations: int = 1_000,
) -> dict:
    """Geometric Brownian Motion Monte Carlo simulation.

    Args:
        returns: Historical daily simple returns.
        initial_value: Starting portfolio value.
        days: Number of trading days to simulate forward.
        n_simulations: Number of paths to generate.

    Returns:
        dict with paths, percentiles, final_values, prob_profit, prob_target callable.
    """
    if returns.empty:
        return {
            "paths": np.array([]),
            "percentiles": {},
            "final_values": np.array([]),
            "prob_profit": 0.0,
        }

    mu = float(returns.mean())
    sigma = float(returns.std())

    # Validate mu/sigma are finite (e.g. all-NaN returns)
    if not (np.isfinite(mu) and np.isfinite(sigma)) or sigma == 0:
        return {
            "paths": np.array([]),
            "percentiles": {},
            "final_values": np.array([]),
            "prob_profit": 0.0,
        }

    # GBM drift: mu - 0.5 * sigma^2
    drift = mu - 0.5 * sigma ** 2

    rng = np.random.default_rng(42)
    random_shocks = rng.normal(0, 1, (n_simulations, days))

    # log returns for each step
    log_returns = drift + sigma * random_shocks

    # Cumulative sum of log returns -> price path
    log_paths = np.cumsum(log_returns, axis=1)

    # Prepend zero (starting point)
    log_paths = np.hstack([np.zeros((n_simulations, 1)), log_paths])

    # Convert to price paths
    paths = initial_value * np.exp(log_paths)

    final_values = paths[:, -1]

    # Percentile paths
    percentiles = {}
    for p in [5, 25, 50, 75, 95]:
        percentiles[p] = np.percentile(paths, p, axis=0).tolist()

    prob_profit = float(np.mean(final_values > initial_value))

    return {
        "paths": paths,
        "percentiles": percentiles,
        "final_values": final_values,
        "prob_profit": prob_profit,
        "initial_value": initial_value,
    }


def prob_target(final_values: np.ndarray, target: float) -> float:
    """Probability that simulated final value exceeds target."""
    if len(final_values) == 0:
        return 0.0
    return float(np.mean(final_values >= target))


# ═══════════════════════════════════════════════════════════════════════════
# Efficient Frontier
# ═══════════════════════════════════════════════════════════════════════════


def random_portfolios(
    returns_df: pd.DataFrame,
    n_portfolios: int = 5_000,
    rf_rate: float = RISK_FREE_RATE,
) -> dict:
    """Generate random portfolio allocations.

    Returns:
        dict with arrays: returns, volatilities, sharpe_ratios, weights.
    """
    n_assets = returns_df.shape[1]
    if n_assets == 0:
        return {"returns": [], "volatilities": [], "sharpe_ratios": [], "weights": []}

    mean_returns = returns_df.mean() * TRADING_DAYS
    cov_matrix = returns_df.cov() * TRADING_DAYS

    rng = np.random.default_rng(42)

    results_ret = np.zeros(n_portfolios)
    results_vol = np.zeros(n_portfolios)
    results_sharpe = np.zeros(n_portfolios)
    all_weights = np.zeros((n_portfolios, n_assets))

    for i in range(n_portfolios):
        w = rng.random(n_assets)
        w = w / w.sum()
        all_weights[i] = w

        port_ret = float(np.dot(w, mean_returns))
        port_vol = float(np.sqrt(np.dot(w.T, np.dot(cov_matrix, w))))

        results_ret[i] = port_ret
        results_vol[i] = port_vol
        results_sharpe[i] = (port_ret - rf_rate) / port_vol if port_vol > 0 else 0.0

    return {
        "returns": results_ret.tolist(),
        "volatilities": results_vol.tolist(),
        "sharpe_ratios": results_sharpe.tolist(),
        "weights": all_weights.tolist(),
    }


def _portfolio_stats(
    weights: np.ndarray,
    mean_returns: pd.Series,
    cov_matrix: pd.DataFrame,
) -> tuple[float, float]:
    """Helper: annualised return and volatility for a given weight vector."""
    port_ret = float(np.dot(weights, mean_returns))
    port_vol = float(np.sqrt(np.dot(weights.T, np.dot(cov_matrix.values, weights))))
    return port_ret, port_vol


def min_variance_portfolio(
    returns_df: pd.DataFrame,
    rf_rate: float = RISK_FREE_RATE,
) -> dict:
    """Find the minimum variance portfolio via optimisation."""
    n = returns_df.shape[1]
    if n == 0:
        return {"weights": {}, "return": 0.0, "volatility": 0.0, "sharpe": 0.0}

    mean_returns = returns_df.mean() * TRADING_DAYS
    cov_matrix = returns_df.cov() * TRADING_DAYS

    def objective(w):
        return np.sqrt(np.dot(w.T, np.dot(cov_matrix.values, w)))

    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1}
    bounds = tuple((0, 1) for _ in range(n))
    x0 = np.ones(n) / n

    result = optimize.minimize(
        objective, x0, method="SLSQP", bounds=bounds, constraints=constraints
    )

    w = result.x
    ret, vol = _portfolio_stats(w, mean_returns, cov_matrix)
    sr = (ret - rf_rate) / vol if vol > 0 else 0.0

    return {
        "weights": {col: round(float(w[i]), 6) for i, col in enumerate(returns_df.columns)},
        "return": round(ret, 6),
        "volatility": round(vol, 6),
        "sharpe": round(sr, 6),
    }


def max_sharpe_portfolio(
    returns_df: pd.DataFrame,
    rf_rate: float = RISK_FREE_RATE,
) -> dict:
    """Find the maximum Sharpe ratio portfolio via optimisation."""
    n = returns_df.shape[1]
    if n == 0:
        return {"weights": {}, "return": 0.0, "volatility": 0.0, "sharpe": 0.0}

    mean_returns = returns_df.mean() * TRADING_DAYS
    cov_matrix = returns_df.cov() * TRADING_DAYS

    def neg_sharpe(w):
        ret = float(np.dot(w, mean_returns))
        vol = float(np.sqrt(np.dot(w.T, np.dot(cov_matrix.values, w))))
        if vol == 0:
            return 0.0
        return -(ret - rf_rate) / vol

    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1}
    bounds = tuple((0, 1) for _ in range(n))
    x0 = np.ones(n) / n

    result = optimize.minimize(
        neg_sharpe, x0, method="SLSQP", bounds=bounds, constraints=constraints
    )

    w = result.x
    ret, vol = _portfolio_stats(w, mean_returns, cov_matrix)
    sr = (ret - rf_rate) / vol if vol > 0 else 0.0

    return {
        "weights": {col: round(float(w[i]), 6) for i, col in enumerate(returns_df.columns)},
        "return": round(ret, 6),
        "volatility": round(vol, 6),
        "sharpe": round(sr, 6),
    }


def efficient_frontier_curve(
    returns_df: pd.DataFrame,
    n_points: int = 50,
    rf_rate: float = RISK_FREE_RATE,
) -> dict:
    """Trace the efficient frontier by optimising for min vol at each target return.

    Returns:
        dict with "returns" and "volatilities" arrays.
    """
    n = returns_df.shape[1]
    if n == 0:
        return {"returns": [], "volatilities": []}

    mean_returns = returns_df.mean() * TRADING_DAYS
    cov_matrix = returns_df.cov() * TRADING_DAYS

    # Range of target returns between min-variance return and max single-asset return
    mv = min_variance_portfolio(returns_df, rf_rate)
    min_ret = mv["return"]
    max_ret = float(mean_returns.max())

    if min_ret >= max_ret:
        return {"returns": [min_ret], "volatilities": [mv["volatility"]]}

    target_returns = np.linspace(min_ret, max_ret, n_points)

    frontier_ret = []
    frontier_vol = []

    for target in target_returns:
        def objective(w):
            return np.sqrt(np.dot(w.T, np.dot(cov_matrix.values, w)))

        constraints = [
            {"type": "eq", "fun": lambda w: np.sum(w) - 1},
            {"type": "eq", "fun": lambda w, t=target: np.dot(w, mean_returns) - t},
        ]
        bounds = tuple((0, 1) for _ in range(n))
        x0 = np.ones(n) / n

        result = optimize.minimize(
            objective, x0, method="SLSQP", bounds=bounds, constraints=constraints,
            options={"maxiter": 1000, "ftol": 1e-10},
        )

        if result.success:
            vol = float(objective(result.x))
            frontier_ret.append(round(float(target), 6))
            frontier_vol.append(round(vol, 6))

    return {"returns": frontier_ret, "volatilities": frontier_vol}
