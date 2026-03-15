'use client'
import { useState } from 'react'
import { usePortfolio } from '@/context/PortfolioContext'
import { usePerformance } from '@/hooks/usePortfolioAPI'
import { ChartContainer } from '@/components/ui/ChartContainer'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const ROLLING_WINDOWS = [
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '252d', label: '1Y' },
]

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

const ASSET_COLORS: Record<string, string> = {
  VOO: '#7B9EC4', VXUS: '#B08AD4', VWO: '#C4867B',
  BND: '#7BC4A4', VNQ: '#D4C5A0', GLD: '#C49B7B',
}

function heatmapColor(value: number): string {
  if (value > 5) return '#7BC4A4'
  if (value > 2) return 'rgba(123, 196, 164, 0.5)'
  if (value > 0) return 'rgba(123, 196, 164, 0.25)'
  if (value > -2) return 'rgba(196, 123, 138, 0.25)'
  if (value > -5) return 'rgba(196, 123, 138, 0.5)'
  return '#C47B8A'
}

export function PerformancePanel() {
  const { period } = usePortfolio()
  const { data, isLoading, error } = usePerformance(period)
  const [rollingWindow, setRollingWindow] = useState('90d')

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-sm text-muted animate-pulse">Loading performance data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-sm text-loss">Failed to load performance data.</p>
      </div>
    )
  }

  const d = data as any

  // API cumulative: { portfolio: [{date, value}], benchmark: [{date, value}], assets: { VOO: [{date, value}], ... } }
  const cumPortfolio = d?.cumulative?.portfolio ?? []
  const cumBenchmark = d?.cumulative?.benchmark ?? []
  const cumAssets = d?.cumulative?.assets ?? {}
  const assetKeys = Object.keys(cumAssets)

  // Merge into single array for Recharts
  const cumulativeReturns = cumPortfolio.map((p: any, i: number) => {
    const row: any = { date: p.date, portfolio: p.value * 100 }
    const bench = cumBenchmark[i]
    if (bench) row.benchmark = bench.value * 100
    for (const asset of assetKeys) {
      const assetData = cumAssets[asset]
      if (assetData?.[i]) row[asset] = assetData[i].value * 100
    }
    return row
  })

  // API drawdown: [{date, value}]
  const drawdowns = (d?.drawdown ?? []).map((p: any) => ({
    date: p.date,
    drawdown: p.value * 100,
  }))

  // API calendar_returns: [{year, 1: val|null, 2: val|null, ..., 12: val|null, YTD: val}]
  const calendarReturns = d?.calendar_returns ?? []

  // API rolling: { '30d': [{date, value}], '90d': [...], '252d': [...] }
  const rollingReturns = (d?.rolling?.[rollingWindow] ?? []).map((p: any) => ({
    date: p.date,
    return: p.value * 100,
  }))

  return (
    <div>
      {/* Cumulative Returns */}
      <ChartContainer
        title="Cumulative Returns"
        subtitle="Growth of a $1 investment in each asset and the overall portfolio."
      >
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeReturns}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontFamily: 'var(--font-outfit)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontFamily: 'var(--font-outfit)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(value: number, name: string) => [
                  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-outfit)', fontSize: '12px', color: 'var(--muted)' }} />
              <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="var(--benchmark)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              {assetKeys.map((asset) => (
                <Line
                  key={asset}
                  type="monotone"
                  dataKey={asset}
                  name={asset}
                  stroke={ASSET_COLORS[asset] ?? '#8A8078'}
                  strokeWidth={1.5}
                  dot={false}
                  strokeOpacity={0.6}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Drawdowns */}
      <ChartContainer
        title="Drawdowns"
        subtitle="Peak-to-trough declines. The deeper the drawdown, the longer it typically takes to recover."
      >
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdowns}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 0]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']} />
              <Area type="monotone" dataKey="drawdown" stroke="var(--loss)" fill="var(--loss)" fillOpacity={0.15} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Calendar Heatmap */}
      <ChartContainer
        title="Monthly Returns"
        subtitle="Calendar heatmap of monthly portfolio returns. Green = positive, Red = negative."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted font-medium">Year</th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="p-2 text-center text-muted font-medium">{m}</th>
                ))}
                <th className="p-2 text-center text-muted font-medium">YTD</th>
              </tr>
            </thead>
            <tbody>
              {calendarReturns.map((row: any) => (
                <tr key={row.year}>
                  <td className="p-2 font-semibold text-ink font-mono tabular-nums">{row.year}</td>
                  {MONTH_NAMES.map((_, mi) => {
                    const val = row[String(mi + 1)]
                    const pct = val != null ? val * 100 : null
                    return (
                      <td
                        key={mi}
                        className="p-2 text-center font-mono tabular-nums font-medium rounded"
                        style={{
                          backgroundColor: pct != null ? heatmapColor(pct) : 'transparent',
                          color: pct != null ? '#EDE8F0' : 'var(--muted-dim)',
                        }}
                      >
                        {pct != null ? `${pct.toFixed(1)}%` : '--'}
                      </td>
                    )
                  })}
                  <td
                    className="p-2 text-center font-mono tabular-nums font-semibold"
                    style={{ color: (row.YTD ?? 0) >= 0 ? 'var(--gain)' : 'var(--loss)' }}
                  >
                    {row.YTD != null ? `${(row.YTD * 100).toFixed(1)}%` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Rolling Returns */}
      <ChartContainer
        title="Rolling Returns"
        subtitle="Rolling total returns over different window lengths."
      >
        <div className="flex gap-2 mb-4">
          {ROLLING_WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setRollingWindow(w.key)}
              className={`px-3 py-1.5 font-mono text-xs font-semibold rounded-lg transition-all ${
                rollingWindow === w.key ? 'bg-accent text-white' : 'glass-card text-muted hover:text-ink'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingReturns}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Rolling Return']} />
              <Line type="monotone" dataKey="return" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  )
}
