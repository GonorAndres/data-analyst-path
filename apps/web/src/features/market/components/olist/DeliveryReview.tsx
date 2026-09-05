'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

interface DeliveryBin {
  bin: string
  avg_review: number
  order_count: number
  pct_late: number
}

interface DeliveryReviewData {
  bins: DeliveryBin[]
}

interface Props {
  data: DeliveryReviewData | undefined
  isLoading: boolean
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
}) => {
  const tx = useProjectText()
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: 'var(--tooltip-bg)',
      border: '1px solid var(--chart-grid)',
      fontFamily: 'var(--font-lora)',
      fontSize: 12,
      color: 'var(--chart-label)',
      padding: '10px 14px',
      minWidth: 180,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label} {" " + tx("dias")}</p>
      {payload.map(entry => (
        <p key={entry.dataKey} style={{ marginBottom: 2 }}>
          {entry.dataKey === 'avg_review'
            ? (tx("Calificacion:") + " " + (entry.value.toFixed(2)) + "")
            : (tx("Entregas tardias:") + " " + (entry.value.toFixed(1)) + "%")}
        </p>
      ))}
    </div>
  )
}

export function DeliveryReview({ data, isLoading }: Props) {
  const tx = useProjectText()
  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-surface rounded" style={{ height: 400 }} />
    )
  }

  if (!data.bins.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">{tx("Sin datos para los filtros seleccionados")}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data.bins} margin={{ top: 8, right: 24, left: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="bin"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          label={{
            value: tx("Dias de entrega"),
            position: 'insideBottom',
            offset: -16,
            fontSize: 11,
            fontFamily: 'var(--font-lora)',
            fill: 'var(--chart-label)',
          }}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 5]}
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          label={{
            value: tx("Calificacion promedio"),
            angle: -90,
            position: 'insideLeft',
            offset: 4,
            fontSize: 11,
            fontFamily: 'var(--font-lora)',
            fill: 'var(--chart-label)',
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
          label={{
            value: tx("% entregas tardias"),
            angle: 90,
            position: 'insideRight',
            offset: 4,
            fontSize: 11,
            fontFamily: 'var(--font-lora)',
            fill: 'var(--chart-label)',
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          yAxisId="left"
          dataKey="avg_review"
          fill="var(--bar-rank-1)"
          radius={[2, 2, 0, 0]}
          barSize={32}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="pct_late"
          stroke="var(--rfm-at-risk)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--rfm-at-risk)' }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
