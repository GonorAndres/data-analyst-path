'use client'
import { useState, useEffect } from 'react'

const NOTEBOOKS = [
  {
    id: '01_data_acquisition',
    title: '01. Data Acquisition',
    description: 'Fetching market data via yfinance, quality checks, gap and split handling, parquet caching.',
    concepts: ['yfinance API', 'OHLCV data', 'Data quality', 'Parquet storage'],
  },
  {
    id: '02_portfolio_construction',
    title: '02. Portfolio Construction',
    description: 'Defining asset allocation, computing weighted returns, benchmark comparison, and rebalancing strategies.',
    concepts: ['Weighted returns', 'Benchmark tracking', 'Rebalancing', 'Tracking error'],
  },
  {
    id: '03_performance_analysis',
    title: '03. Performance Analysis',
    description: 'Cumulative returns, drawdown analysis, rolling windows, calendar heatmap, and return attribution.',
    concepts: ['CAGR', 'Drawdowns', 'Rolling returns', 'Attribution'],
  },
  {
    id: '04_risk_analytics',
    title: '04. Risk Analytics',
    description: 'Value at Risk (3 methods), CVaR, Sharpe/Sortino/Calmar ratios, beta/alpha, and volatility regimes.',
    concepts: ['Parametric VaR', 'Historical VaR', 'Monte Carlo VaR', 'Risk-adjusted ratios'],
  },
  {
    id: '05_monte_carlo_frontier',
    title: '05. Monte Carlo & Frontier',
    description: 'GBM simulation with Ito\'s lemma derivation, fan charts, efficient frontier optimization, and optimal portfolios.',
    concepts: ['GBM', 'Ito\'s lemma', 'Efficient frontier', 'Portfolio optimization'],
  },
]

export function MethodologyPanel() {
  const [activeNotebook, setActiveNotebook] = useState(NOTEBOOKS[0].id)
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setHtml(null)
    fetch(`/notebooks_html/${activeNotebook}.html`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.text()
      })
      .then((content) => {
        setHtml(content)
        setLoading(false)
      })
      .catch(() => {
        setHtml(null)
        setLoading(false)
      })
  }, [activeNotebook])

  const active = NOTEBOOKS.find((n) => n.id === activeNotebook)!

  return (
    <div>
      {/* Notebook sub-tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {NOTEBOOKS.map((nb) => (
          <button
            key={nb.id}
            onClick={() => setActiveNotebook(nb.id)}
            className={`
              px-4 py-2 font-sans text-xs font-medium rounded-lg transition-all
              ${activeNotebook === nb.id
                ? 'bg-accent text-black'
                : 'glass-card text-muted hover:text-ink'
              }
            `}
          >
            {nb.title}
          </button>
        ))}
      </div>

      {/* Description card */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-heading text-lg font-semibold text-ink mb-1">
          {active.title}
        </h3>
        <p className="font-sans text-sm text-muted mb-3">
          {active.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {active.concepts.map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 text-[11px] font-mono text-accent border border-accent/20 rounded bg-accent/5"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Notebook content */}
      {loading ? (
        <div className="py-16 text-center">
          <p className="font-sans text-sm text-muted animate-pulse">Loading notebook...</p>
        </div>
      ) : html ? (
        <div className="glass-card overflow-hidden">
          <iframe
            srcDoc={html}
            title={active.title}
            className="w-full border-0"
            style={{ height: '800px' }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="font-sans text-sm text-muted mb-2">
            Notebook HTML not yet generated.
          </p>
          <p className="font-mono text-xs text-muted-dim">
            Run: jupyter nbconvert --to html --execute --output-dir=public/notebooks_html notebooks/*.ipynb
          </p>
        </div>
      )}
    </div>
  )
}
