# 05 -- Financial Portfolio Tracker: Monte Carlo & Efficient Frontier

> **Analyst Flavor:** Financial | **Tools:** Python, Next.js, FastAPI | **Status:** Complete

**Live demo:** [data-analyst.gonor.me/portfolio](https://data-analyst.gonor.me/portfolio/)

## Business Question

**How does a diversified multi-asset ETF portfolio perform relative to the S&P 500, what is its true risk profile, and can we find a mathematically optimal allocation using real market data?**

This project builds a full-stack analytics dashboard that tracks a 6-ETF portfolio ($100K initial investment) against the SPY benchmark. It applies modern portfolio theory, three flavors of Value at Risk, Monte Carlo simulation via Geometric Brownian Motion, and mean-variance optimization to move beyond "what happened" into "what should we do."

## Key Findings

- This is historical analysis and a model-based scenario demonstration. No local price cache was available in the 2026-09-05 audit; period-specific returns and risk figures are unverified here.
- Diversification compares portfolio volatility with weighted standalone volatility for the selected sample; it does not guarantee protection in every drawdown.
- VaR depends on the period and method. A 95% VaR is a quantile, not a maximum possible loss.
- Maximum-Sharpe weights optimize in-sample estimates. They require out-of-sample evaluation before claiming an improvement.
- GBM percentiles describe simulated outcomes under estimated constant parameters. They are conditional scenarios, not promises of future returns.

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
- **Next.js 14 + React + Recharts**: Shared frontend in `../../apps/web`, with common light/dark themes, English/Spanish preferences, an 8-tab layout, and animated transitions
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

The dashboard at [data-analyst.gonor.me/portfolio](https://data-analyst.gonor.me/portfolio/) provides 8 tabs:

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
| Risk-free rate at 4.5% (hardcoded) | Dynamic T-bill fetch | Fixed analytical assumption; it is not a verified current market rate. |

## Recommendations

1. Compare allocations over held-out periods and stress windows.
2. Include turnover, transaction costs, taxes, and rebalancing rules in implementable comparisons.
3. Report the exact price window and test sensitivity to the assumed 4.5% risk-free rate.
4. Present Monte Carlo output as conditional scenarios alongside historical drawdowns.

[Evidence ledger](../../docs/evidence-audit.md).

## How to Reproduce

```bash
# 1. From the repository root, navigate to the project
cd projects/05-financial-portfolio-tracker

# 2. Install Python backend dependencies
pip install -r requirements.txt

# 3. Start the consolidated backend (portfolio data comes from Yahoo Finance)
cd ../..
pip install -r backend/requirements.txt
bash backend/dev.sh
# API docs available at http://localhost:8080/portfolio/docs
```

In another terminal, from the repository root:

```bash
npm ci --prefix apps/web
npm run dev
# Dashboard at http://localhost:3000/portfolio/
```

Optional research workflows, run from this project directory:

```bash
# Run the Jupyter notebooks
jupyter notebook notebooks/

# Export notebooks to HTML for the Methodology tab
jupyter nbconvert --to html --output-dir=public/notebooks_html notebooks/*.ipynb
```

Frontend components live in `apps/web/src/features/portfolio`. English and light
mode are the first-visit defaults; language, theme, and site navigation are shared
across projects. Browser requests use `/api/portfolio` through the common
development proxy, with no project-specific frontend environment setup. Exported
notebooks remain in this project's `public/notebooks_html/` and are staged into
the shared app. Legacy frontend source and configuration have been archived
outside the repository and removed; backend and research remain here.
