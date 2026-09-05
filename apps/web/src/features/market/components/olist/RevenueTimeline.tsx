'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

interface MonthRow {
  month: string
  order_count: number
  revenue: number
  avg_value: number
}

interface RevenueData {
  months: MonthRow[]
}

interface Props {
  data: RevenueData | undefined
  isLoading: boolean
}

export function RevenueTimeline({ data, isLoading }: Props) {
  const tx = useProjectText()
  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface rounded" style={{ height: 400 }} />
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data.months} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={1}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg)',
            border: '1px solid var(--chart-grid)',
            fontFamily: 'var(--font-lora)',
            fontSize: 12,
            color: 'var(--chart-label)',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'revenue') return [`R$ ${value.toLocaleString()}`, tx("Ingresos")]
            if (name === 'order_count') return [value.toLocaleString(), tx("Pedidos")]
            return [value, name]
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          fill="var(--bar-rank-3)"
          stroke="var(--bar-rank-1)"
          fillOpacity={0.3}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="order_count"
          stroke="var(--series-4)"
          dot={false}
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
