'use client'
import { useState } from 'react'
import { usePortfolio } from '@/context/PortfolioContext'
import { useMonteCarlo } from '@/hooks/usePortfolioAPI'
import { KPICard } from '@/components/ui/KPICard'
import { ChartContainer } from '@/components/ui/ChartContainer'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

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

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export function MonteCarloPanel() {
  const { period } = usePortfolio()
  const [days, setDays] = useState(252)
  const [simulations, setSimulations] = useState(1000)
  const [initialValue, setInitialValue] = useState(100000)
  const [target, setTarget] = useState(10)

  const { data, isLoading, error } = useMonteCarlo(period, days, simulations, initialValue, target)

  const d = data as any

  // API percentile_paths: { '5': [...], '25': [...], '50': [...], '75': [...], '95': [...] }
  const paths = d?.percentile_paths ?? {}
  const p50 = paths['50'] ?? []

  // Build fan chart data
  const fanData = p50.map((_: number, i: number) => ({
    day: i,
    p5: paths['5']?.[i] ?? 0,
    p25: paths['25']?.[i] ?? 0,
    p50: paths['50']?.[i] ?? 0,
    p75: paths['75']?.[i] ?? 0,
    p95: paths['95']?.[i] ?? 0,
  }))

  // API stats
  const stats = d?.final_value_stats ?? {}
  const probProfit = (d?.prob_profit ?? 0) * 100
  const probTarget = (d?.prob_target ?? 0) * 100

  return (
    <div>
      {/* Input Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 glass-card p-6">
        <div>
          <label className="block font-sans text-[11px] tracking-widest uppercase text-muted mb-2">Horizon (Days)</label>
          <input type="range" min={63} max={1260} step={63} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full" />
          <p className="font-mono text-sm font-semibold tabular-nums text-accent mt-1">{days} days ({(days / 252).toFixed(1)}y)</p>
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-widest uppercase text-muted mb-2">Simulations</label>
          <input type="range" min={100} max={5000} step={100} value={simulations} onChange={(e) => setSimulations(Number(e.target.value))} className="w-full" />
          <p className="font-mono text-sm font-semibold tabular-nums text-accent mt-1">{simulations.toLocaleString()}</p>
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-widest uppercase text-muted mb-2">Initial Value</label>
          <input type="range" min={10000} max={1000000} step={10000} value={initialValue} onChange={(e) => setInitialValue(Number(e.target.value))} className="w-full" />
          <p className="font-mono text-sm font-semibold tabular-nums text-accent mt-1">{formatCurrency(initialValue)}</p>
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-widest uppercase text-muted mb-2">Target Return (%)</label>
          <input type="range" min={0} max={100} step={5} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full" />
          <p className="font-mono text-sm font-semibold tabular-nums text-accent mt-1">{target}%</p>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center">
          <p className="font-sans text-sm text-muted animate-pulse">Running Monte Carlo simulation...</p>
        </div>
      )}

      {error && (
        <div className="py-16 text-center">
          <p className="font-sans text-sm text-loss">Failed to run simulation.</p>
        </div>
      )}

      {d && (
        <>
          {/* Statistics KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard label="P(Profit)" value={probProfit} suffix="%" decimals={1} trend={probProfit >= 50 ? 'up' : 'down'} tooltip="Probability that the portfolio ends above its starting value." />
            <KPICard label="P(Target)" value={probTarget} suffix="%" decimals={1} trend={probTarget >= 50 ? 'up' : 'down'} delay={0.08} tooltip="Probability of reaching the target return you set." />
            <KPICard label="Median Final Value" value={stats.median ?? 0} prefix="$" decimals={0} trend="neutral" delay={0.16} tooltip="The middle outcome across all simulations, 50% chance of doing better or worse." />
            <KPICard label="5th Pctl (Worst Case)" value={stats.percentile_5 ?? 0} prefix="$" decimals={0} trend="down" delay={0.24} tooltip="Only 5% of simulations ended below this value." />
          </div>

          {/* Fan Chart */}
          <ChartContainer
            title="Simulation Fan Chart"
            subtitle="Percentile bands showing the range of possible portfolio values over the simulation horizon."
          >
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fanData}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fill: 'var(--muted)', fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                  <Area type="monotone" dataKey="p95" stroke="none" fill="var(--accent)" fillOpacity={0.06} name="95th Pctl" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="var(--accent)" fillOpacity={0.1} name="75th Pctl" />
                  <Area type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={2.5} fill="none" name="Median" />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="var(--accent)" fillOpacity={0.1} name="25th Pctl" />
                  <Area type="monotone" dataKey="p5" stroke="var(--loss)" strokeWidth={1} strokeDasharray="4 4" fill="var(--loss)" fillOpacity={0.05} name="5th Pctl" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Final Value Stats Table */}
          <ChartContainer
            title="Final Value Statistics"
            subtitle="Summary statistics of simulated portfolio values at the end of the horizon."
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-white/[0.1]">
                    <th className="py-3 pr-4 text-left font-semibold text-muted">Statistic</th>
                    <th className="py-3 pl-4 text-right font-semibold text-muted">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Mean', value: stats.mean },
                    { label: 'Median', value: stats.median },
                    { label: 'Std Dev', value: stats.std },
                    { label: '5th Percentile', value: stats.percentile_5 },
                    { label: '25th Percentile', value: stats.percentile_25 },
                    { label: '75th Percentile', value: stats.percentile_75 },
                    { label: '95th Percentile', value: stats.percentile_95 },
                    { label: 'Min', value: stats.min },
                    { label: 'Max', value: stats.max },
                  ].map((row, i, arr) => (
                    <tr key={row.label} className={i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}>
                      <td className="py-2 pr-4 font-medium text-ink">{row.label}</td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums text-accent">
                        {row.value != null ? formatCurrency(row.value) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartContainer>
        </>
      )}
    </div>
  )
}
