'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface FreqSevRow {
  accident_year: number
  claim_count: number
  avg_paid: number
  avg_incurred: number
  median_paid: number
  total_paid: number
  total_incurred: number
}

interface FreqSevData {
  by_year: FreqSevRow[]
}

interface Props {
  data: FreqSevData | undefined
  isLoading: boolean
}

function formatAmount(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

export function FrequencySeverityChart({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
  }

  if (!data.by_year.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const chartData = data.by_year.map(row => ({
    year: String(row.accident_year),
    frequency: row.claim_count,
    severity: row.avg_incurred,
    claim_count: row.claim_count,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          label={{
            value: 'Frecuencia',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            style: { fontSize: 10, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatAmount(v)}
          label={{
            value: 'Severidad',
            angle: 90,
            position: 'insideRight',
            offset: 10,
            style: { fontSize: 10, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' },
          }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const freq = payload.find(p => p.dataKey === 'frequency')?.value as number | undefined
            const sev = payload.find(p => p.dataKey === 'severity')?.value as number | undefined
            return (
              <div style={{
                backgroundColor: 'var(--chart-bg)',
                border: '1px solid var(--chart-grid)',
                fontFamily: 'var(--font-lora)',
                fontSize: 12,
                color: 'var(--chart-label)',
                padding: '10px 14px',
                minWidth: 180,
              }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Año: {label}</p>
                {freq != null && <p>Frecuencia: {freq.toFixed(4)}</p>}
                {sev != null && <p>Severidad: {formatAmount(sev)}</p>}
              </div>
            )
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              frequency: 'Frecuencia',
              severity: 'Severidad promedio',
            }
            return labels[value] || value
          }}
          wrapperStyle={{ fontFamily: 'var(--font-lora)', fontSize: 11, color: 'var(--chart-tick)' }}
        />
        <Bar
          yAxisId="left"
          dataKey="frequency"
          fill="var(--lob-auto)"
          radius={[2, 2, 0, 0]}
          barSize={32}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="severity"
          stroke="var(--ratio-breakeven)"
          dot={{ fill: 'var(--ratio-breakeven)', r: 3 }}
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
