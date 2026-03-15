'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 font-sans text-sm text-muted hover:text-ink transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 border-t border-white/[0.06]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const PORTFOLIO = [
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', weight: '30%', category: 'US Equity' },
  { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: '20%', category: 'International Equity' },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', weight: '10%', category: 'Emerging Markets' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: '20%', category: 'Fixed Income' },
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', weight: '10%', category: 'Real Estate' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', weight: '10%', category: 'Commodities' },
]

const TAB_GUIDE = [
  { tab: 'Overview', desc: 'Portfolio KPIs, allocation breakdown, and benchmark comparison.' },
  { tab: 'Performance', desc: 'Cumulative returns, drawdowns, calendar heatmap, and rolling returns.' },
  { tab: 'Risk', desc: 'Value at Risk (3 methods), risk-adjusted ratios, return distribution, and rolling volatility.' },
  { tab: 'Correlation', desc: 'Pairwise correlations, rolling correlation, and diversification ratio.' },
  { tab: 'Monte Carlo', desc: 'GBM simulation with adjustable parameters, fan charts, and probability forecasts.' },
  { tab: 'Frontier', desc: 'Efficient frontier optimization, current vs optimal weights, min-variance & max-Sharpe portfolios.' },
  { tab: 'Methodology', desc: 'Full Jupyter notebooks with math derivations and code.' },
]

const DEFINITIONS = [
  { term: 'Sharpe Ratio', desc: 'Risk-adjusted return: excess return per unit of total volatility. Higher is better.' },
  { term: 'Sortino Ratio', desc: 'Like Sharpe but only penalizes downside volatility, ignoring upside swings.' },
  { term: 'Max Drawdown', desc: 'Largest peak-to-trough decline in portfolio value. Measures worst-case loss.' },
  { term: 'Value at Risk (VaR)', desc: 'Maximum expected loss at a given confidence level (e.g., 95%) over a time horizon.' },
  { term: 'CVaR (Expected Shortfall)', desc: 'Average loss in the worst tail scenarios beyond VaR. Captures tail risk.' },
  { term: 'Beta', desc: 'Sensitivity of portfolio returns to benchmark returns. Beta = 1 means market-level risk.' },
  { term: 'Alpha', desc: 'Excess return above what the benchmark delivered, adjusted for risk.' },
  { term: 'CAGR', desc: 'Compound Annual Growth Rate -- smoothed annualized return over the full period.' },
  { term: 'Efficient Frontier', desc: 'Set of portfolios offering the highest return for each level of risk.' },
  { term: 'Geometric Brownian Motion', desc: 'Stochastic model for asset prices used in Monte Carlo simulation.' },
]

const TECH_STACK = {
  Backend: ['Python', 'FastAPI', 'yfinance', 'pandas', 'numpy', 'scipy'],
  Frontend: ['Next.js', 'React', 'Recharts', 'Tailwind CSS', 'Framer Motion'],
  Analysis: ['Jupyter', 'Plotly', 'LaTeX', 'Portfolio Optimization'],
}

export function IntroSection() {
  return (
    <div className="mb-6 space-y-3">
      {/* Hero Context Box */}
      <div className="glass-card p-5">
        <p className="font-sans text-sm leading-relaxed text-muted">
          This dashboard tracks a diversified 6-asset portfolio ($100K initial investment) against
          the S&P 500 benchmark. It applies modern portfolio theory, risk analytics, and Monte Carlo
          simulation to evaluate performance and find optimal allocations. Data is sourced live from
          Yahoo Finance.
        </p>
      </div>

      {/* Accordions */}
      <Accordion title="Portfolio Composition">
        <div className="overflow-x-auto mt-3">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-white/[0.1]">
                <th className="py-2 pr-4 text-left text-muted text-xs uppercase tracking-wider">Ticker</th>
                <th className="py-2 pr-4 text-left text-muted text-xs uppercase tracking-wider">Name</th>
                <th className="py-2 pr-4 text-right text-muted text-xs uppercase tracking-wider">Weight</th>
                <th className="py-2 text-left text-muted text-xs uppercase tracking-wider">Category</th>
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO.map((row, i) => (
                <tr key={row.ticker} className={i < PORTFOLIO.length - 1 ? 'border-b border-white/[0.04]' : ''}>
                  <td className="py-2 pr-4 font-mono font-semibold text-accent">{row.ticker}</td>
                  <td className="py-2 pr-4 text-ink">{row.name}</td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums text-ink">{row.weight}</td>
                  <td className="py-2 text-muted">{row.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-sans text-xs text-muted-dim leading-relaxed">
          Classic diversified allocation spanning 6 asset classes. Benchmark: SPY (S&P 500). Risk-free rate: 4.5%.
        </p>
      </Accordion>

      <Accordion title="How to Read This Dashboard">
        <div className="mt-3 space-y-2.5">
          {TAB_GUIDE.map((item) => (
            <div key={item.tab} className="flex gap-3">
              <span className="font-medium text-sm text-ink shrink-0 w-24">{item.tab}</span>
              <span className="text-sm text-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Key Definitions">
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
          {DEFINITIONS.map((item) => (
            <div key={item.term}>
              <span className="font-medium text-sm text-ink">{item.term}: </span>
              <span className="text-sm text-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Tools & Tech Stack">
        <div className="mt-3 space-y-4">
          {Object.entries(TECH_STACK).map(([category, tools]) => (
            <div key={category}>
              <p className="font-sans text-xs uppercase tracking-wider text-muted mb-2">{category}</p>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2.5 py-1 text-xs font-mono border border-accent/20 text-accent rounded-md"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  )
}
