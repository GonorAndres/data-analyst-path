'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { usePreferences } from '@/components/SitePreferences'
import { usePortfolio } from '@/features/portfolio/context/PortfolioContext'
import { useOverview } from '@/features/portfolio/hooks/usePortfolioAPI'
import { KPICard } from '@/features/portfolio/components/ui/KPICard'
import { ChartContainer } from '@/features/portfolio/components/ui/ChartContainer'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'

const CATEGORY_COLORS: Record<string, string> = {
  'US Equity': 'var(--us-equity)',
  'International Equity': 'var(--intl-equity)',
  'Emerging Markets': 'var(--emerging)',
  'Fixed Income': 'var(--gain)',
  'Real Estate': 'var(--benchmark)',
  'Commodities': 'var(--commodities)',
}

const TOOLTIP_STYLE = {
  background: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: '8px',
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '13px',
  color: 'var(--ink)',
}
const TOOLTIP_LABEL_STYLE = { color: 'var(--ink)' }
const TOOLTIP_ITEM_STYLE = { color: 'var(--ink)' }

export function OverviewPanel() {
  const { locale } = usePreferences()
  const { period } = usePortfolio()
  const { data, isLoading, error } = useOverview(period)

  if (isLoading) {
    return (
      <FeatureText><div className="py-16 text-center">
        <p className="font-sans text-sm text-muted animate-pulse">Loading portfolio overview...</p>
      </div></FeatureText>
    )
  }

  if (error) {
    return (
      <FeatureText><div className="py-16 text-center">
        <p className="font-sans text-sm text-loss">Failed to load portfolio data.</p>
      </div></FeatureText>
    )
  }

  if (!data) return <FeatureText><p className="text-sm text-muted py-8">No data available.</p></FeatureText>

  const d = data as any

  // API returns: total_return (decimal), ytd_return (decimal), sharpe_ratio, max_drawdown (object), portfolio_value, benchmark (object)
  const totalReturn = (d?.total_return ?? Number.NaN) * 100
  const ytdReturn = (d?.ytd_return ?? Number.NaN) * 100
  const sharpe = d?.sharpe_ratio ?? Number.NaN
  const maxDD = (d?.max_drawdown?.max_dd ?? Number.NaN) * 100
  const portfolioValue = d?.portfolio_value ?? Number.NaN
  const benchTotal = (d?.benchmark?.total_return ?? Number.NaN) * 100
  const vsBenchmark = totalReturn - benchTotal

  const kpis = [
    { label: 'Total Return', value: totalReturn, suffix: '%', trend: totalReturn >= 0 ? 'up' as const : 'down' as const, tooltip: 'How much the portfolio gained or lost since inception, as a percentage.' },
    { label: 'YTD Return', value: ytdReturn, suffix: '%', trend: ytdReturn >= 0 ? 'up' as const : 'down' as const, tooltip: 'Year-to-date gain or loss since January 1st.' },
    { label: 'Sharpe Ratio', value: sharpe, trend: sharpe >= 1 ? 'up' as const : 'neutral' as const, tooltip: 'Return earned per unit of risk. Above 1.0 is good, above 2.0 is excellent.' },
    { label: 'Max Drawdown', value: maxDD, suffix: '%', trend: 'down' as const, tooltip: 'Largest drop from peak to trough. Shows worst-case historical loss.' },
    { label: 'Portfolio Value', value: portfolioValue, prefix: '$', decimals: 0, trend: 'neutral' as const, tooltip: 'Current total value of all holdings.' },
    { label: 'vs Benchmark', value: vsBenchmark, suffix: '%', trend: vsBenchmark >= 0 ? 'up' as const : 'down' as const, tooltip: 'How much the portfolio outperformed (+) or underperformed (-) the S&P 500.' },
  ]

  // API allocation: [{ticker, name, weight (decimal), category, current_value}]
  const allocation = d?.allocation ?? []

  return (
    <FeatureText><div>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            prefix={kpi.prefix}
            suffix={kpi.suffix}
            decimals={kpi.decimals ?? 2}
            trend={kpi.trend}
            tooltip={kpi.tooltip}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* Allocation Donut */}
      <ChartContainer
        title="Asset Allocation"
        subtitle="Current portfolio weight distribution across asset categories."
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation.map((a: any) => ({ ...a, weightPct: a.weight * 100 }))}
                  dataKey="weightPct"
                  nameKey="ticker"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                  stroke="none"
                >
                  {allocation.map((a: any, i: number) => (
                    <Cell key={i} fill={CATEGORY_COLORS[a.category] ?? 'var(--muted)'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2">
            <div className="space-y-3">
              {allocation.map((a: any) => (
                <div key={a.ticker} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: CATEGORY_COLORS[a.category] ?? 'var(--muted)' }}
                    />
                    <span className="font-sans text-sm text-ink">{a.ticker}</span>
                    <span className="font-sans text-xs text-muted">{a.category}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                    {(a.weight * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartContainer>

      {/* Benchmark Comparison Table */}
      <ChartContainer
        title="Portfolio vs Benchmark"
        subtitle="Key metrics comparison over the selected period."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left font-semibold text-muted">Metric</th>
                <th className="py-3 px-4 text-right font-semibold text-muted">Portfolio</th>
                <th className="py-3 pl-4 text-right font-semibold text-muted">{d?.benchmark?.ticker ?? 'SPY'}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Total Return', p: totalReturn, b: benchTotal, fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
                { label: 'Ann. Return', p: (d?.annualized_return ?? Number.NaN) * 100, b: (d?.benchmark?.annualized_return ?? Number.NaN) * 100, fmt: (v: number) => `${v.toFixed(2)}%` },
                { label: 'Ann. Volatility', p: (d?.annualized_volatility ?? Number.NaN) * 100, b: (d?.benchmark?.annualized_volatility ?? Number.NaN) * 100, fmt: (v: number) => `${v.toFixed(2)}%` },
                { label: 'Sharpe Ratio', p: sharpe, b: d?.benchmark?.sharpe_ratio ?? Number.NaN, fmt: (v: number) => v.toFixed(3) },
              ].map((row, i) => (
                <tr key={row.label} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="py-3 pr-4 font-medium text-ink">{row.label}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-accent">{Number.isFinite(row.p) ? row.fmt(row.p) : '—'}</td>
                  <td className="py-3 pl-4 text-right font-mono tabular-nums text-muted">{Number.isFinite(row.b) ? row.fmt(row.b) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {d?.last_updated && (
        <p className="font-sans text-xs text-muted-dim mt-4">
          Last updated: {new Date(d.last_updated).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
        </p>
      )}
    </div></FeatureText>
  )
}
