'use client'
import {
  Target,
  Lightbulb,
  Database,
  BarChart3,
  Layout,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import type { ReactNode } from 'react'

/* ── helpers ─────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target
  title: string
  children: ReactNode
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="w-5 h-5 text-accent shrink-0" />
        <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function TabGuide({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
      <div>
        <span className="font-medium text-sm text-ink">{name}</span>
        <span className="text-sm text-muted ml-1.5">: {desc}</span>
      </div>
    </div>
  )
}

/* ── data ────────────────────────────────────────────────────── */

const PORTFOLIO = [
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', weight: '30%', category: 'US Equity' },
  { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: '20%', category: 'International Equity' },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', weight: '10%', category: 'Emerging Markets' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: '20%', category: 'Fixed Income' },
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', weight: '10%', category: 'Real Estate' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', weight: '10%', category: 'Commodities' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'US Equity': '#7B9EC4',
  'International Equity': '#B08AD4',
  'Emerging Markets': '#C4867B',
  'Fixed Income': '#7BC4A4',
  'Real Estate': '#D4C5A0',
  'Commodities': '#C49B7B',
}

const TAB_GUIDE = [
  { tab: 'About', desc: 'Project context, methodology overview, and how to navigate the dashboard.' },
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
  { term: 'CAGR', desc: 'Compound Annual Growth Rate, smoothed annualized return over the full period.' },
  { term: 'Efficient Frontier', desc: 'Set of portfolios offering the highest return for each level of risk.' },
  { term: 'Geometric Brownian Motion', desc: 'Stochastic model for asset prices used in Monte Carlo simulation.' },
]

const TECH_STACK = {
  Backend: ['Python', 'FastAPI', 'yfinance', 'pandas', 'numpy', 'scipy'],
  Frontend: ['Next.js', 'React', 'Recharts', 'Tailwind CSS', 'Framer Motion'],
  Analysis: ['Jupyter', 'Plotly', 'LaTeX', 'Portfolio Optimization'],
}

const METHODOLOGY_CARDS = [
  {
    title: 'Performance Analysis',
    color: 'var(--accent-blue)',
    items: ['Cumulative & rolling returns', 'Drawdown analysis', 'Calendar heatmaps'],
  },
  {
    title: 'Risk Analytics',
    color: 'var(--accent)',
    items: ['Historical, Parametric & Monte Carlo VaR', 'CVaR / Expected Shortfall', 'Rolling volatility & beta'],
  },
  {
    title: 'Monte Carlo Simulation',
    color: 'var(--benchmark)',
    items: ['Geometric Brownian Motion', 'Correlated multi-asset paths', 'Probability cone forecasts'],
  },
  {
    title: 'Portfolio Optimization',
    color: 'var(--emerging)',
    items: ['Mean-variance frontier', 'Min-variance & max-Sharpe', 'Weight comparison analysis'],
  },
]

const CHALLENGES = [
  {
    title: 'Live data variability',
    desc: 'Yahoo Finance data can gap or lag. Built caching and fallback logic so the dashboard stays responsive even when the upstream API is slow.',
  },
  {
    title: 'Monte Carlo at scale',
    desc: 'Running 10,000 correlated simulations across 6 assets needs careful vectorization. Used numpy broadcasting instead of Python loops for 50x speedup.',
  },
  {
    title: 'Efficient frontier solver',
    desc: 'scipy.optimize with equality + inequality constraints requires well-chosen initial guesses. Added bounds and SLSQP fallback to avoid convergence failures.',
  },
  {
    title: 'Bridging theory and UX',
    desc: 'Financial math is dense. Invested in clear labels, contextual definitions, and methodology notebooks so non-quant viewers can follow the analysis.',
  },
]

/* ── component ───────────────────────────────────────────────── */

export function AboutPanel() {
  return (
    <div className="space-y-6 pb-4">
      {/* 1. Hero */}
      <div className="glass-card p-6 md:p-8">
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-muted-dim mb-2">
          Data Analyst Portfolio: Project 05
        </p>
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-ink mb-3">
          Multi-Asset Portfolio Analytics & Optimization
        </h2>
        <p className="font-sans text-sm md:text-base leading-relaxed text-muted max-w-3xl">
          A full-stack analytics dashboard that tracks a diversified 6-ETF portfolio against the S&P 500.
          It applies modern portfolio theory, risk analytics, and Monte Carlo simulation to evaluate
          performance, quantify risk, and find mathematically optimal allocations, all powered by live
          market data from Yahoo Finance.
        </p>
      </div>

      {/* 2. Challenge + Why This Approach */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard icon={Target} title="The Challenge">
          <ul className="space-y-2 font-sans text-sm text-muted">
            <li className="flex gap-2"><span className="text-accent">*</span>How does a diversified ETF portfolio perform versus a passive S&P 500 benchmark?</li>
            <li className="flex gap-2"><span className="text-accent">*</span>What is the portfolio&apos;s true risk profile beyond headline returns?</li>
            <li className="flex gap-2"><span className="text-accent">*</span>Can we find a mathematically optimal asset allocation using real market data?</li>
            <li className="flex gap-2"><span className="text-accent">*</span>What range of future outcomes should an investor expect over 1-5 year horizons?</li>
          </ul>
        </SectionCard>

        <SectionCard icon={Lightbulb} title="Why This Approach">
          <ul className="space-y-2 font-sans text-sm text-muted">
            <li className="flex gap-2"><span className="text-accent">*</span>Live data keeps the analysis current, not a static snapshot from a CSV.</li>
            <li className="flex gap-2"><span className="text-accent">*</span>Multiple VaR methods (historical, parametric, Monte Carlo) show risk from different angles.</li>
            <li className="flex gap-2"><span className="text-accent">*</span>Efficient frontier optimization goes beyond &ldquo;what happened&rdquo; to &ldquo;what should we do.&rdquo;</li>
            <li className="flex gap-2"><span className="text-accent">*</span>Full methodology notebooks let viewers audit every formula and assumption.</li>
          </ul>
        </SectionCard>
      </div>

      {/* 3. Data Source */}
      <SectionCard icon={Database} title="Data Source">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Source', value: 'Yahoo Finance (yfinance)' },
            { label: 'Type', value: 'Daily adjusted close prices' },
            { label: 'Assets', value: '6 ETFs + SPY benchmark' },
            { label: 'Frequency', value: 'Live on each request' },
          ].map((cell) => (
            <div key={cell.label}>
              <p className="font-mono text-[11px] tracking-wider uppercase text-muted-dim mb-1">{cell.label}</p>
              <p className="font-sans text-sm text-ink">{cell.value}</p>
            </div>
          ))}
        </div>
        <p className="font-sans text-xs text-muted-dim leading-relaxed">
          Limitations: Yahoo Finance data may have minor gaps or delayed quotes. Dividends are reflected
          via adjusted close prices. Analysis assumes frictionless trading (no commissions or slippage).
        </p>
      </SectionCard>

      {/* 4. Portfolio Composition */}
      <div className="glass-card p-6">
        <h2 className="font-heading text-lg font-semibold text-ink mb-4">Portfolio Composition</h2>
        <div className="overflow-x-auto">
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
                  <td className="py-2">
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[row.category] }}
                      />
                      {row.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-sans text-xs text-muted-dim leading-relaxed">
          Classic diversified allocation spanning 6 asset classes. Benchmark: SPY (S&P 500). Risk-free rate: 4.5%.
        </p>
      </div>

      {/* 5. Methodology */}
      <SectionCard icon={BarChart3} title="Methodology">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {METHODOLOGY_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-lg p-4"
              style={{
                background: `color-mix(in srgb, ${card.color} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${card.color} 18%, transparent)`,
              }}
            >
              <h3 className="font-sans text-sm font-semibold text-ink mb-2">{card.title}</h3>
              <ul className="space-y-1">
                {card.items.map((item) => (
                  <li key={item} className="font-sans text-xs text-muted flex gap-1.5">
                    <span style={{ color: card.color }}>-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 6. How to Navigate */}
      <SectionCard icon={Layout} title="How to Navigate">
        <div className="space-y-2.5">
          {TAB_GUIDE.map((item) => (
            <TabGuide key={item.tab} name={item.tab} desc={item.desc} />
          ))}
        </div>
      </SectionCard>

      {/* 7. Challenges & Learnings */}
      <SectionCard icon={BookOpen} title="Challenges & Learnings">
        <div className="space-y-4">
          {CHALLENGES.map((item, i) => (
            <div key={item.title} className="flex gap-3">
              <span className="font-mono text-sm font-semibold text-accent shrink-0 w-6 text-right">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="font-sans text-sm font-medium text-ink">{item.title}</p>
                <p className="font-sans text-sm text-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 8. Tech Stack */}
      <div className="glass-card p-6">
        <h2 className="font-heading text-lg font-semibold text-ink mb-4">Tech Stack</h2>
        <div className="space-y-4">
          {Object.entries(TECH_STACK).map(([category, tools]) => (
            <div key={category}>
              <p className="font-mono text-[11px] tracking-wider uppercase text-muted-dim mb-2">{category}</p>
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
      </div>

      {/* 9. Key Definitions */}
      <div className="glass-card p-6">
        <h2 className="font-heading text-lg font-semibold text-ink mb-4">Key Definitions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
          {DEFINITIONS.map((item) => (
            <div key={item.term}>
              <span className="font-medium text-sm text-ink">{item.term}: </span>
              <span className="text-sm text-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
