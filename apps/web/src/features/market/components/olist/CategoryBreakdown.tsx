'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface CategoryRow {
  name: string
  revenue: number
  order_count: number
  avg_price: number
}

interface CategoryData {
  categories: CategoryRow[]
}

interface Props {
  data: CategoryData | undefined
  isLoading: boolean
}

function cleanName(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function barColor(index: number): string {
  if (index < 3) return 'var(--bar-rank-1)'
  if (index < 8) return 'var(--bar-rank-2)'
  return 'var(--bar-rank-3)'
}

export function CategoryBreakdown({ data, isLoading }: Props) {
  const tx = useProjectText()
  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface rounded" style={{ height: 400 }} />
  }

  const sorted = [...data.categories]
    .sort((a, b) => b.revenue - a.revenue)
    .map(c => ({ ...c, displayName: cleanName(c.name) }))

  const chartHeight = Math.max(400, sorted.length * 28)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="displayName"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg)',
            border: '1px solid var(--chart-grid)',
            fontFamily: 'var(--font-lora)',
            fontSize: 12,
            color: 'var(--chart-label)',
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const row = payload[0].payload as CategoryRow & { displayName: string }
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
                <p style={{ fontWeight: 600, marginBottom: 6 }}>{row.displayName}</p>
                <p>{tx("Ingresos: R$") + " "}{row.revenue.toLocaleString()}</p>
                <p>{tx("Pedidos:") + " "}{row.order_count.toLocaleString()}</p>
                <p>{tx("Precio promedio: R$") + " "}{row.avg_price.toFixed(2)}</p>
              </div>
            )
          }}
        />
        <Bar dataKey="revenue" radius={[0, 1, 1, 0]}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={barColor(i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
