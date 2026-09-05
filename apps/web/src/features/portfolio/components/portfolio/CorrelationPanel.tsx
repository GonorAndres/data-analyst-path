'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { usePortfolio } from '@/features/portfolio/context/PortfolioContext'
import { useCorrelation } from '@/features/portfolio/hooks/usePortfolioAPI'
import { KPICard } from '@/features/portfolio/components/ui/KPICard'
import { ChartContainer } from '@/features/portfolio/components/ui/ChartContainer'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

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

const ASSET_COLORS: Record<string, string> = {
  VOO: 'var(--us-equity)', VXUS: 'var(--intl-equity)', VWO: 'var(--emerging)',
  BND: 'var(--gain)', VNQ: 'var(--benchmark)', GLD: 'var(--commodities)',
}

function correlationColor(value: number): string {
  if (value >= 0.7) return 'var(--loss)'
  if (value >= 0.3) return 'var(--benchmark)'
  if (value >= -0.3) return 'var(--muted)'
  return 'var(--gain)'
}

function correlationBg(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 0.7) return value > 0 ? 'color-mix(in srgb, var(--loss) 20%, transparent)' : 'color-mix(in srgb, var(--gain) 20%, transparent)'
  if (abs >= 0.3) return value > 0 ? 'color-mix(in srgb, var(--loss) 10%, transparent)' : 'color-mix(in srgb, var(--gain) 10%, transparent)'
  return 'var(--surface)'
}

export function CorrelationPanel() {
  const { period } = usePortfolio()
  const { data, isLoading, error } = useCorrelation(period)

  if (isLoading) {
    return (
      <FeatureText><div className="py-16 text-center">
        <p className="font-sans text-sm text-muted animate-pulse">Loading correlation data...</p>
      </div></FeatureText>
    )
  }

  if (error) {
    return (
      <FeatureText><div className="py-16 text-center">
        <p className="font-sans text-sm text-loss">Failed to load correlation data.</p>
      </div></FeatureText>
    )
  }

  if (!data) return <FeatureText><p className="text-sm text-muted py-8">No data available.</p></FeatureText>

  const d = data as any

  // API correlation_matrix: { tickers: [...], matrix: [[...], ...] }
  const tickers = d?.correlation_matrix?.tickers ?? []
  const matrix = d?.correlation_matrix?.matrix ?? []
  const diversificationRatio = d?.diversification_ratio ?? Number.NaN

  // API rolling_correlation: { VOO: [{date, value}], ... }
  const rollingCorrData = d?.rolling_correlation ?? {}
  const rollingAssets = Object.keys(rollingCorrData)

  // Merge rolling correlation into single array for Recharts
  const rollingCorr = rollingAssets.length > 0
    ? (rollingCorrData[rollingAssets[0]] ?? []).map((p: any, i: number) => {
        const row: any = { date: p.date }
        for (const asset of rollingAssets) {
          row[asset] = rollingCorrData[asset]?.[i]?.value ?? null
        }
        return row
      })
    : []

  return (
    <FeatureText><div>
      {/* Diversification KPI */}
      <div className="mb-6">
        <KPICard
          label="Diversification Ratio"
          value={diversificationRatio}
          decimals={2}
          trend={diversificationRatio > 1 ? 'up' : 'neutral'}
          tooltip="Measures how much diversification reduces risk. Above 1.0 means it is working."
        />
        <p className="font-sans text-xs text-muted mt-2 max-w-lg">
          Values above 1.0 indicate the portfolio benefits from diversification.
          Higher is better -- it means assets are not perfectly correlated.
        </p>
      </div>

      {/* Correlation Matrix Heatmap */}
      <ChartContainer
        title="Correlation Matrix"
        subtitle="Pairwise correlations between all assets in the portfolio. Red = high positive, Green = negative."
      >
        <div className="overflow-x-auto">
          <table className="border-collapse font-sans text-xs">
            <thead>
              <tr>
                <th className="p-2" />
                {tickers.map((t: string) => (
                  <th key={t} className="p-2 text-center font-semibold text-muted whitespace-nowrap" style={{ minWidth: '70px' }}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((rowTicker: string, ri: number) => (
                <tr key={rowTicker}>
                  <td className="p-2 font-semibold text-muted whitespace-nowrap">{rowTicker}</td>
                  {tickers.map((colTicker: string, ci: number) => {
                    const val = matrix[ri]?.[ci] ?? Number.NaN
                    const isDiagonal = ri === ci
                    return (
                      <FeatureText key={colTicker}><td
                        key={colTicker}
                        className="p-2 text-center font-mono tabular-nums font-medium rounded"
                        style={{
                          backgroundColor: isDiagonal || !Number.isFinite(val) ? 'var(--surface)' : correlationBg(val),
                          color: isDiagonal || !Number.isFinite(val) ? 'var(--muted-dim)' : correlationColor(val),
                        }}
                      >
                        {Number.isFinite(val) ? val.toFixed(2) : '—'}
                      </td></FeatureText>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Rolling Correlation */}
      <ChartContainer
        title="Rolling Correlation"
        subtitle="60-day rolling correlation of each asset against the overall portfolio."
      >
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingCorr}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis domain={[-1, 1]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number, name: string) => [value?.toFixed(3), name]} />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '12px', color: 'var(--muted)' }} />
              {rollingAssets.map((asset) => (
                <Line
                  key={asset}
                  type="monotone"
                  dataKey={asset}
                  name={asset}
                  stroke={ASSET_COLORS[asset] ?? 'var(--muted)'}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div></FeatureText>
  )
}
