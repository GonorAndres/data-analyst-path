'use client'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

interface CombinedRatioRow {
  accident_year: number
  loss_ratio_reported: number
  expense_ratio: number
  combined_ratio_reported: number
}

interface CombinedRatioData {
  by_year: CombinedRatioRow[]
}

interface Props {
  data: CombinedRatioData | undefined
  isLoading: boolean
}

export function CombinedRatioTrend({ data, isLoading }: Props) {
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
    loss_ratio: row.loss_ratio_reported * 100,
    expense_ratio: row.expense_ratio * 100,
    combined_ratio: row.combined_ratio_reported * 100,
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
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          domain={['auto', 'auto']}
        />
        <ReferenceLine
          y={100}
          stroke="var(--ratio-loss)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: '100% — Punto de equilibrio',
            position: 'right',
            fill: 'var(--ratio-loss)',
            fontSize: 10,
            fontFamily: 'var(--font-lora)',
          }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const loss = payload.find(p => p.dataKey === 'loss_ratio')?.value as number | undefined
            const expense = payload.find(p => p.dataKey === 'expense_ratio')?.value as number | undefined
            const combined = payload.find(p => p.dataKey === 'combined_ratio')?.value as number | undefined
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
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Año: {label}</p>
                {loss != null && <p>Loss ratio: {loss.toFixed(1)}%</p>}
                {expense != null && <p>Expense ratio: {expense.toFixed(1)}%</p>}
                {combined != null && (
                  <p style={{ fontWeight: 600, marginTop: 4, borderTop: '1px solid var(--chart-grid)', paddingTop: 4 }}>
                    Combined ratio: {combined.toFixed(1)}%
                  </p>
                )}
              </div>
            )
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              loss_ratio: 'Loss ratio',
              expense_ratio: 'Expense ratio',
              combined_ratio: 'Combined ratio',
            }
            return labels[value] || value
          }}
          wrapperStyle={{ fontFamily: 'var(--font-lora)', fontSize: 11, color: 'var(--chart-tick)' }}
        />
        <Area
          type="monotone"
          dataKey="loss_ratio"
          stackId="stack"
          fill="var(--lob-auto)"
          stroke="var(--lob-auto)"
          fillOpacity={0.4}
        />
        <Area
          type="monotone"
          dataKey="expense_ratio"
          stackId="stack"
          fill="var(--ratio-breakeven)"
          stroke="var(--ratio-breakeven)"
          fillOpacity={0.3}
        />
        <Line
          type="monotone"
          dataKey="combined_ratio"
          stroke="var(--ratio-loss)"
          dot={{ fill: 'var(--ratio-loss)', r: 3 }}
          strokeWidth={2.5}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
