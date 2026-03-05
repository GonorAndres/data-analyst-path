'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface IBNRRow {
  accident_year: number
  latest_lag: number | null
  latest_value: number | null
  cdf: number
  ultimate: number | null
  ibnr: number | null
}

interface WaterfallData {
  accident_years: number[]
  development_lags: number[]
  triangle: (number | null)[][]
  ibnr_by_year: IBNRRow[]
}

interface Props {
  data: WaterfallData | undefined
  isLoading: boolean
}

function formatAmount(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

export function IBNRWaterfall({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
  }

  if (!data.ibnr_by_year?.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const chartData = data.ibnr_by_year.map(row => ({
    year: String(row.accident_year),
    observed: row.latest_value ?? 0,
    ibnr: row.ibnr ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatAmount(v)}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const observed = (payload.find(p => p.dataKey === 'observed')?.value as number) ?? 0
            const ibnr = (payload.find(p => p.dataKey === 'ibnr')?.value as number) ?? 0
            const ultimate = observed + ibnr
            return (
              <div style={{
                backgroundColor: 'var(--chart-bg)',
                border: '1px solid var(--chart-grid)',
                fontFamily: 'var(--font-lora)',
                fontSize: 12,
                color: 'var(--chart-label)',
                padding: '10px 14px',
                minWidth: 200,
              }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Año de accidente: {label}</p>
                <p>Observado: {formatAmount(observed)}</p>
                <p>IBNR: {formatAmount(ibnr)}</p>
                <p style={{ fontWeight: 600, marginTop: 4, borderTop: '1px solid var(--chart-grid)', paddingTop: 4 }}>
                  Ultimate: {formatAmount(ultimate)}
                </p>
              </div>
            )
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              observed: 'Observado',
              ibnr: 'IBNR',
            }
            return labels[value] || value
          }}
          wrapperStyle={{ fontFamily: 'var(--font-lora)', fontSize: 11, color: 'var(--chart-tick)' }}
        />
        <Bar dataKey="observed" stackId="stack" fill="var(--lob-comauto)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="ibnr" stackId="stack" fill="var(--ratio-loss)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
