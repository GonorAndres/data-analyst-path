# 05 -- Financial Portfolio Tracker: Monte Carlo & Efficient Frontier

> **Analyst Flavor:** Financial | **Tools:** Python, Next.js, FastAPI | **Status:** Complete

**Live demo:** [financial-portfolio-tracker-iota.vercel.app](https://financial-portfolio-tracker-iota.vercel.app)

## Business Question

**How does a diversified multi-asset ETF portfolio perform relative to the S&P 500, what is its true risk profile, and can we find a mathematically optimal allocation using real market data?**

This project builds a full-stack analytics dashboard that tracks a 6-ETF portfolio ($100K initial investment) against the SPY benchmark. It applies modern portfolio theory, three flavors of Value at Risk, Monte Carlo simulation via Geometric Brownian Motion, and mean-variance optimization to move beyond "what happened" into "what should we do."

## Key Findings

- **Diversification works**: The portfolio spans 6 asset classes (US equity, international equity, emerging markets, fixed income, real estate, commodities) and consistently shows a diversification ratio above 1.0, confirming that cross-asset correlation reduction lowers realized volatility below the weighted sum of individual volatilities.
- **VaR methods diverge in the tails**: Parametric, historical, and Monte Carlo VaR at 95% confidence produce meaningfully different estimates -- the parametric (Gaussian) assumption underestimates tail risk relative to historical VaR when return distributions exhibit negative skewness and excess kurtosis.
- **Efficient frontier reveals reallocation opportunity**: The max-Sharpe optimal portfolio typically concentrates weight away from the current equal-ish allocation, suggesting that rebalancing toward the optimization output could improve the risk-adjusted return without increasing overall risk.
- **Monte Carlo probability cones quantify uncertainty**: GBM simulations (up to 5,000 paths over 1-5 year horizons) show the full range of outcomes, giving investors a probability-weighted view rather than a single point estimate.
- **Fixed income and gold act as portfolio stabilizers**: BND and GLD consistently show low or negative correlation with equity positions (VOO, VXUS, VWO), validating their role as hedging instruments during equity drawdowns.

## Data Source

| Attribute | Value |
|-----------|-------|
| **Source** | Yahoo Finance via `yfinance` Python library |
| **Type** | Daily adjusted close prices (dividends reflected via price adjustment) |
| **Assets** | 6 ETFs: VOO (30%), VXUS (20%), BND (20%), VWO (10%), VNQ (10%), GLD (10%) + SPY benchmark |
| **Periods** | Selectable: 1Y, 2Y, 3Y, 5Y |
| **Frequency** | Live on each API request, with 4-hour parquet cache to avoid rate limits |
| **Limitations** | Yahoo Finance data may have minor gaps or delayed quotes; analysis assumes frictionless trading (no commissions, slippage, or taxes); risk-free rate hardcoded at 4.5% |

## Methodology

### Tools
- **Python** (FastAPI, pandas, numpy, scipy, yfinance): Backend API with 6 analytical endpoints
- **Next.js 14 + React + Recharts**: Interactive dashboard with dark theme, 8-tab layout, animated transitions
- **Tailwind CSS + Framer Motion**: UI styling and micro-animations
- **Jupyter Notebooks**: 5 notebooks documenting the full analytical pipeline with LaTeX derivations
- **SWR**: Client-side data fetching with deduplication and error retry

### Approach
1. **Data acquisition**: Fetch daily adjusted close prices from Yahoo Finance for all 7 tickers (6 portfolio + 1 benchmark). Cache results as parquet files with a 4-hour TTL to balance freshness against API rate limits.
2. **Portfolio construction**: Compute weighted daily returns using the fixed allocation weights, align all series to the common date range, and re-normalize weights if any ticker is missing data.
3. **Performance analysis**: Calculate cumulative returns, drawdown series (peak-to-trough), rolling returns (30D/90D/1Y windows), monthly calendar heatmap, and return attribution by asset.
4. **Risk analytics**: Compute VaR at 95% and 99% confidence using three methods (parametric/Gaussian, historical percentile, Monte Carlo with 10,000 simulations). Calculate CVaR (Expected Shortfall), Sharpe/Sortino/Calmar ratios, Jensen's alpha, beta, tracking error, and information ratio vs. SPY.
5. **Monte Carlo simulation**: Forward-project portfolio value using GBM (drift = mu - 0.5*sigma^2, with normally distributed shocks). Generate percentile fan charts (5th/25th/50th/75th/95th) and probability of reaching user-defined targets.
6. **Efficient frontier optimization**: Generate 5,000 random portfolio allocations, solve for the minimum-variance and maximum-Sharpe portfolios using `scipy.optimize` (SLSQP with equality and bound constraints), and trace the efficient frontier curve across 50 target return levels.

### Alternatives Considered
- **Streamlit**: Originally planned per the project stub. Replaced with Next.js + FastAPI for richer interactivity, component-level state management, and design consistency with other portfolio projects.
- **Log returns vs. simple returns**: Used simple (arithmetic) returns for portfolio aggregation since weighted log returns are not additive across assets. Log returns used only inside the GBM simulation where they are mathematically required.
- **Correlated multi-asset Monte Carlo**: The current implementation simulates portfolio-level returns (single series) rather than individual correlated asset paths. This simplifies the simulation while still producing valid portfolio-level probability estimates.
- **Black-Litterman model**: Deferred to future iteration -- would allow incorporating subjective views into the optimization.

## Results

### Interactive Dashboard

The dashboard at [financial-portfolio-tracker-iota.vercel.app](https://financial-portfolio-tracker-iota.vercel.app) provides 8 tabs:

| Tab | Content |
|-----|---------|
| **About** | Project context, portfolio composition table, methodology overview, tab navigation guide, key financial definitions, tech stack, challenges and learnings |
| **Overview** | KPI cards (total return, YTD, Sharpe, max drawdown, portfolio value, vs benchmark), asset allocation donut chart, portfolio vs SPY comparison table |
| **Performance** | Cumulative returns line chart (portfolio + benchmark + individual assets), drawdown area chart, monthly returns calendar heatmap (color-coded green/red), rolling returns with 30D/90D/1Y toggle |
| **Risk** | VaR comparison bar chart (3 methods at 95%), risk-adjusted ratios table (Sharpe, Sortino, Calmar, beta, alpha, tracking error, information ratio), return distribution histogram with skewness/kurtosis stats, 30-day rolling volatility line chart |
| **Correlation** | Diversification ratio KPI, pairwise correlation matrix heatmap (color intensity by magnitude), 60-day rolling correlation line chart per asset vs portfolio |
| **Monte Carlo** | Interactive sliders for horizon (63-1260 days), simulations (100-5,000), initial value ($10K-$1M), target return (0-100%). Percentile fan chart, probability KPIs (P(profit), P(target)), final value statistics table |
| **Frontier** | Efficient frontier scatter plot (5,000 random portfolios colored by Sharpe, frontier curve, current/min-variance/max-Sharpe portfolio markers), optimal vs current weight comparison bar chart, key portfolio points comparison table |
| **Methodology** | Embedded Jupyter notebooks (HTML renders) with sub-tab navigation and concept tags per notebook |

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/overview` | Portfolio KPIs, allocation, benchmark comparison |
| `GET /api/v1/performance` | Cumulative returns, drawdowns, rolling returns, calendar heatmap, attribution |
| `GET /api/v1/risk` | VaR (3 methods), CVaR, ratios, rolling volatility, return distribution |
| `GET /api/v1/correlation` | Correlation matrix, rolling correlation, diversification ratio |
| `GET /api/v1/montecarlo` | GBM simulation with configurable parameters |
| `GET /api/v1/frontier` | Random portfolios, efficient frontier curve, optimal portfolios |
| `GET /health` | Service health check |

All analytical endpoints accept a `period` query parameter (`1y`, `2y`, `3y`, `5y`).

### Notebooks

| # | Notebook | Key Output |
|---|----------|------------|
| 01 | Data Acquisition | yfinance API usage, OHLCV data quality checks, gap/split handling, parquet caching |
| 02 | Portfolio Construction | Weighted returns computation, benchmark tracking, rebalancing strategies, tracking error |
| 03 | Performance Analysis | CAGR, cumulative returns, drawdown analysis, rolling windows, return attribution |
| 04 | Risk Analytics | Parametric/Historical/Monte Carlo VaR, CVaR, Sharpe/Sortino/Calmar ratios, volatility regimes |
| 05 | Monte Carlo & Frontier | GBM derivation with Ito's lemma, simulation fan charts, mean-variance optimization, efficient frontier |

## Decisions & Trade-offs

| Decision | Alternative | Rationale |
|----------|-------------|-----------|
| Next.js + FastAPI instead of Streamlit | Streamlit (original plan) | Needed component-level interactivity (sliders, tab state, animated transitions) and design parity with projects 01, 03, 06 |
| Portfolio-level Monte Carlo (single series) | Correlated multi-asset simulation | Simpler implementation, still valid for portfolio-level probability estimates; multi-asset version deferred |
| Fixed allocation weights | User-editable weights via UI | Keeps the analytical focus on the methodology; weight editing adds UI complexity without analytical depth |
| 4-hour parquet cache | No cache / longer TTL | Balances data freshness (markets move) against yfinance rate limits and API response time |
| scipy.optimize SLSQP | cvxpy / manual gradient descent | SLSQP handles equality + bound constraints natively; convergence improved with well-chosen initial guesses (equal weights) |
| Simple returns for portfolio math | Log returns everywhere | Weighted simple returns are additive across assets; log returns are not, making them incorrect for multi-asset portfolio aggregation |
| Risk-free rate at 4.5% (hardcoded) | Dynamic T-bill fetch | Avoids an additional API dependency; 4.5% reflects the current short-term rate environment |

## Recommendations

1. **Rebalance toward the max-Sharpe allocation**: The efficient frontier consistently identifies weight concentrations that improve Sharpe ratio relative to the current equal-ish split -- implement quarterly rebalancing to capture this.
2. **Monitor correlation regime shifts**: Rolling 60-day correlations between equity and fixed income are not constant. When BND-VOO correlation spikes toward +1 during stress events, the diversification benefit evaporates -- consider adding explicit tail-risk hedges.
3. **Extend to correlated multi-asset Monte Carlo**: Simulating individual asset paths with a Cholesky-decomposed covariance matrix would produce more realistic joint scenarios, especially for stress testing.
4. **Add transaction cost modeling**: The frictionless assumption inflates the benefit of frequent rebalancing. Adding realistic bid-ask spreads and commission estimates would give more actionable optimization output.
5. **Implement Black-Litterman**: Incorporate subjective market views (e.g., "emerging markets will outperform by 2% next year") into the optimization framework to produce more stable and forward-looking allocations.

## How to Reproduce

```bash
# 1. Clone the repo and navigate to the project
cd projects/05-financial-portfolio-tracker

# 2. Install Python backend dependencies
pip install -r requirements.txt

# 3. Start the FastAPI backend (fetches live data from Yahoo Finance)
cd backend && python3 -m uvicorn portfolio_backend.main:app --host 0.0.0.0 --port 2055
# API docs available at http://localhost:2055/docs

# 4. In another terminal, install frontend dependencies and start the dashboard
cd projects/05-financial-portfolio-tracker
npm install && npm run dev
# Dashboard at http://localhost:3055

# 5. (Optional) Run the Jupyter notebooks
jupyter notebook notebooks/

# 6. (Optional) Export notebooks to HTML for the Methodology tab
jupyter nbconvert --to html --output-dir=public/notebooks_html notebooks/*.ipynb
```

**Environment variables** (optional, defaults work for local dev):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORTFOLIO_BACKEND_URL` | `http://localhost:2055` | FastAPI backend URL for Next.js proxy rewrites |
