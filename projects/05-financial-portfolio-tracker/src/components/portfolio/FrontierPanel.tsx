'use client'
import { usePortfolio } from '@/context/PortfolioContext'
import { useFrontier } from '@/hooks/usePortfolioAPI'
import { ChartContainer } from '@/components/ui/ChartContainer'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

function sharpeColorScale(sharpe: number): string {
  if (sharpe >= 1.5) return '#7BC4A4'
  if (sharpe >= 1.0) return '#89C4A2'
  if (sharpe >= 0.5) return '#D4C5A0'
  if (sharpe >= 0) return '#7A7488'
  return '#C47B8A'
}

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

interface FrontierTooltipProps {
  active?: boolean
  payload?: any[]
}

function FrontierTooltip({ active, payload }: FrontierTooltipProps) {
  if (!active || !payload?.[0]) return null
  const p = payload[0].payload
  return (
    <div className="p-3 rounded-lg border" style={{ background: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', fontFamily: 'var(--font-outfit)', fontSize: '13px', color: 'var(--ink)' }}>
      <p className="font-semibold">{p.label || 'Portfolio'}</p>
      <p className="font-mono tabular-nums">Return: {(p.return * 100)?.toFixed(2)}%</p>
      <p className="font-mono tabular-nums">Risk: {(p.risk * 100)?.toFixed(2)}%</p>
      <p className="font-mono tabular-nums">Sharpe: {p.sharpe?.toFixed(3)}</p>
    </div>
  )
}

export function FrontierPanel() {
  const { period } = usePortfolio()
  const { data, isLoading, error } = useFrontier(period)

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-sm text-muted animate-pulse">Computing efficient frontier...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-sm text-loss">Failed to load frontier data.</p>
      </div>
    )
  }

  const d = data as any

  // API cloud: { returns: [...], volatilities: [...], sharpe_ratios: [...] }
  const cloud = d?.cloud ?? {}
  const cloudReturns = cloud.returns ?? []
  const cloudVols = cloud.volatilities ?? []
  const cloudSharpes = cloud.sharpe_ratios ?? []
  const randomPortfolios = cloudReturns.map((r: number, i: number) => ({
    return: r,
    risk: cloudVols[i],
    sharpe: cloudSharpes[i],
    fill: sharpeColorScale(cloudSharpes[i]),
  }))

  // API frontier_curve: { returns: [...], volatilities: [...] }
  const fc = d?.frontier_curve ?? {}
  const frontierCurve = (fc.returns ?? []).map((r: number, i: number) => ({
    return: r,
    risk: fc.volatilities[i],
  }))

  // API current/min/max: { weights: {}, return: float, volatility: float, sharpe: float }
  const cp = d?.current_portfolio
  const mv = d?.min_variance
  const ms = d?.max_sharpe
  const tickers = d?.tickers ?? []

  const currentPortfolio = cp ? { return: cp.return, risk: cp.volatility, sharpe: cp.sharpe, label: 'Current' } : null
  const minVariance = mv ? { return: mv.return, risk: mv.volatility, sharpe: mv.sharpe, label: 'Min Var' } : null
  const maxSharpe = ms ? { return: ms.return, risk: ms.volatility, sharpe: ms.sharpe, label: 'Max Sharpe' } : null

  // Weight comparison
  const weightComparison = tickers.map((t: string) => ({
    asset: t,
    current: (cp?.weights?.[t] ?? 0) * 100,
    optimal: (ms?.weights?.[t] ?? 0) * 100,
  }))

  return (
    <div>
      {/* Efficient Frontier Scatter */}
      <ChartContainer
        title="Efficient Frontier"
        subtitle="Each dot is a simulated portfolio. The frontier curve shows the maximum return achievable at each risk level."
      >
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                type="number" dataKey="risk" name="Risk"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                tickLine={false} axisLine={{ stroke: 'var(--border)' }}
                label={{ value: 'Annualized Risk (Std Dev)', position: 'insideBottom', offset: -5, fill: 'var(--muted)', fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey="return" name="Return"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                tickLine={false} axisLine={false}
                label={{ value: 'Annualized Return', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--muted)', fontSize: 11 }}
              />
              <ZAxis range={[20, 20]} />
              <Tooltip content={<FrontierTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-outfit)', fontSize: '12px', color: 'var(--muted)' }} />

              <Scatter name="Random Portfolios" data={randomPortfolios} fill="var(--neutral)" fillOpacity={0.4}>
                {randomPortfolios.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.4} />
                ))}
              </Scatter>

              <Scatter name="Efficient Frontier" data={frontierCurve} fill="var(--accent)" line={{ stroke: 'var(--accent)', strokeWidth: 2.5 }} lineType="fitting">
                {frontierCurve.map((_: any, i: number) => (
                  <Cell key={i} fill="var(--accent)" r={3} />
                ))}
              </Scatter>

              {currentPortfolio && (
                <Scatter name="Current Portfolio" data={[currentPortfolio]} fill="var(--accent-blue)" shape="diamond">
                  <Cell fill="var(--accent-blue)" r={8} />
                </Scatter>
              )}
              {minVariance && (
                <Scatter name="Min Variance" data={[minVariance]} fill="var(--fixed-income)" shape="star">
                  <Cell fill="var(--fixed-income)" r={8} />
                </Scatter>
              )}
              {maxSharpe && (
                <Scatter name="Max Sharpe" data={[maxSharpe]} fill="var(--gain)" shape="star">
                  <Cell fill="var(--gain)" r={8} />
                </Scatter>
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="font-sans text-xs text-muted">Sharpe Ratio:</span>
          <div className="flex items-center gap-1">
            {[
              { label: '< 0', color: '#C47B8A' },
              { label: '0-0.5', color: '#7A7488' },
              { label: '0.5-1', color: '#D4C5A0' },
              { label: '1-1.5', color: '#89C4A2' },
              { label: '> 1.5', color: '#7BC4A4' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="font-sans text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartContainer>

      {/* Optimal vs Current Weights */}
      <ChartContainer title="Optimal vs Current Weights" subtitle="How the maximum-Sharpe portfolio differs from your current allocation.">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weightComparison}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="asset" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]} />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-outfit)', fontSize: '12px', color: 'var(--muted)' }} />
              <Bar dataKey="current" name="Current" fill="var(--accent-blue)" fillOpacity={0.6} radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="optimal" name="Optimal (Max Sharpe)" fill="var(--accent)" fillOpacity={0.8} radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Key Frontier Points Table */}
      {(mv || ms || cp) && (
        <ChartContainer title="Key Portfolio Points" subtitle="Comparison of the current, minimum variance, and maximum Sharpe portfolios.">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-white/[0.1]">
                  <th className="py-3 pr-4 text-left font-semibold text-muted">Portfolio</th>
                  <th className="py-3 px-4 text-right font-semibold text-muted">Return</th>
                  <th className="py-3 px-4 text-right font-semibold text-muted">Risk</th>
                  <th className="py-3 pl-4 text-right font-semibold text-muted">Sharpe</th>
                </tr>
              </thead>
              <tbody>
                {[
                  cp && { label: 'Current Portfolio', ret: cp.return, vol: cp.volatility, sr: cp.sharpe },
                  mv && { label: 'Min Variance', ret: mv.return, vol: mv.volatility, sr: mv.sharpe },
                  ms && { label: 'Max Sharpe', ret: ms.return, vol: ms.volatility, sr: ms.sharpe },
                ].filter(Boolean).map((row: any, i: number, arr: any[]) => (
                  <tr key={row.label} className={i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}>
                    <td className="py-3 pr-4 font-medium text-ink">{row.label}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">{(row.ret * 100).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-ink">{(row.vol * 100).toFixed(2)}%</td>
                    <td className="py-3 pl-4 text-right font-mono tabular-nums font-semibold text-accent">{row.sr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}
    </div>
  )
}
