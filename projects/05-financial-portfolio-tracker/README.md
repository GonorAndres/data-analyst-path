# Financial Portfolio Tracker

> **Analyst Flavor:** Financial | **Tools:** Python, Streamlit, Plotly | **Status:** Planned

## Business Question

How is a diversified investment portfolio performing relative to benchmarks, what is the risk-return profile across asset classes, and which positions should be rebalanced -- presented through an interactive tool that updates with market data?

## Planned Scope

### Data
- Market data via free APIs (yfinance, Alpha Vantage)
- Portfolio composition: stocks, ETFs, bonds (user-configurable)
- Benchmarks: S&P 500, IPC (Mexico), custom weighted index

### Analysis
1. **Python Layer**: Portfolio returns calculation, risk metrics (Sharpe ratio, VaR, max drawdown, beta), correlation matrix, sector allocation
2. **Streamlit App**: Interactive dashboard with portfolio composition editor, time range selector, benchmark comparison, risk decomposition
3. **Notebook**: Detailed methodology walkthrough with formulas

### Deliverables
- [ ] Streamlit app (deployed to Streamlit Cloud)
- [ ] Jupyter notebook (methodology + backtesting walkthrough)
- [ ] Reports: sample portfolio analysis PDF

### Skills Demonstrated
- Financial analytics (risk-return metrics, modern portfolio theory basics)
- Real-time data integration via APIs
- Interactive app with user-configurable inputs
- Actuarial-adjacent quantitative skills (VaR, stochastic returns)
