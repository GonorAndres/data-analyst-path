'use client'
import { usePortfolio } from '@/context/PortfolioContext'
import { useRisk } from '@/hooks/usePortfolioAPI'
import { ChartContainer } from '@/components/ui/ChartContainer'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

const VAR_COLORS = ['#7B9EC4', '#D4C5A0', '#B08AD4']

const TOOLTIP_STYLE = {
  background: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: '8px',
  fontFamily: 'var(--font-outfit)',
  fontSize: '13px',
  color: 'var(--ink)',
}
const TOOLTIP_LABEL_STYLE = { color: 'var(--ink)' }
const TOOLTIP_ITEM_STYLE = { color: 'var(--ink)' }

export function RiskPanel() {
  const { period } = usePortfolio()
  const { data, isLoading, error } = useRisk(period)

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-sm text-muted animate-pulse">Loading risk metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-sm text-loss">Failed to load risk data.</p>
      </div>
    )
  }

  const d = data as any

  // API var: {parametric_95, parametric_99, historical_95, historical_99, montecarlo_95, montecarlo_99}
  const varData = d?.var ?? {}
  const varComparison = [
    { method: 'Parametric', value: (varData.parametric_95 ?? 0) * 100 },
    { method: 'Historical', value: (varData.historical_95 ?? 0) * 100 },
    { method: 'Monte Carlo', value: (varData.montecarlo_95 ?? 0) * 100 },
  ]

  // API ratios: {sharpe, sortino, calmar}
  const ratios = d?.ratios ?? {}
  const benchRel = d?.benchmark_relative ?? {}
  const ratioRows = [
    { metric: 'Sharpe Ratio', value: ratios.sharpe, description: '(Ann. Return - Rf) / Ann. Volatility' },
    { metric: 'Sortino Ratio', value: ratios.sortino, description: 'Uses downside deviation only' },
    { metric: 'Calmar Ratio', value: ratios.calmar, description: 'Ann. Return / |Max Drawdown|' },
    { metric: 'Beta', value: benchRel.beta, description: 'Sensitivity to benchmark' },
    { metric: 'Alpha', value: benchRel.alpha != null ? benchRel.alpha * 100 : null, description: "Jensen's alpha (annualized %)" },
    { metric: 'Tracking Error', value: benchRel.tracking_error != null ? benchRel.tracking_error * 100 : null, description: 'Std of excess returns (annualized %)' },
    { metric: 'Information Ratio', value: benchRel.information_ratio, description: 'Excess return / Tracking error' },
  ].filter((r) => r.value != null)

  // API return_distribution: {counts: [], bin_edges: [], mean, std, skewness, kurtosis}
  const distData = d?.return_distribution ?? {}
  const counts = distData.counts ?? []
  const binEdges = distData.bin_edges ?? []
  const distribution = counts.map((c: number, i: number) => ({
    bin: ((binEdges[i] + binEdges[i + 1]) / 2) * 100,
    count: c,
  }))

  // API rolling_volatility: { '30d': [{date, value}], '90d': [...] }
  const rollingVol = (d?.rolling_volatility?.['30d'] ?? []).map((p: any) => ({
    date: p.date,
    volatility: p.value * 100,
  }))

  return (
    <div>
      {/* VaR Comparison */}
      <ChartContainer
        title="Value at Risk (95%)"
        subtitle="Comparison of VaR estimates using parametric, historical, and Monte Carlo methods."
      >
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={varComparison} layout="vertical">
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v.toFixed(2)}%`}
                tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis dataKey="method" type="category" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [`${value.toFixed(3)}%`, 'VaR (95%)']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                {varComparison.map((_, i) => (
                  <Cell key={i} fill={VAR_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Risk Ratios Table */}
      <ChartContainer
        title="Risk-Adjusted Ratios"
        subtitle="Key metrics that measure return per unit of risk taken."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-white/[0.1]">
                <th className="py-3 pr-4 text-left font-semibold text-muted">Metric</th>
                <th className="py-3 px-4 text-right font-semibold text-muted">Value</th>
                <th className="py-3 pl-4 text-left font-semibold text-muted-dim">Description</th>
              </tr>
            </thead>
            <tbody>
              {ratioRows.map((row, i) => (
                <tr key={row.metric} className={i < ratioRows.length - 1 ? 'border-b border-white/[0.04]' : ''}>
                  <td className="py-3 pr-4 font-medium text-ink">{row.metric}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-accent">
                    {typeof row.value === 'number' ? row.value.toFixed(4) : '--'}
                  </td>
                  <td className="py-3 pl-4 text-muted-dim text-xs">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Return Distribution Histogram */}
      <ChartContainer
        title="Return Distribution"
        subtitle={`Daily returns: mean=${((distData.mean ?? 0) * 100).toFixed(3)}%, skew=${(distData.skewness ?? 0).toFixed(2)}, kurtosis=${(distData.kurtosis ?? 0).toFixed(2)}`}
      >
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="bin" tickFormatter={(v: number) => `${v.toFixed(1)}%`} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [value, 'Count']} />
              <Bar dataKey="count" fill="var(--accent-blue)" fillOpacity={0.5} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Rolling Volatility */}
      <ChartContainer
        title="Rolling Volatility (30-day)"
        subtitle="Annualized rolling standard deviation of portfolio returns."
      >
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingVol}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Volatility']} />
              <Line type="monotone" dataKey="volatility" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  )
}
