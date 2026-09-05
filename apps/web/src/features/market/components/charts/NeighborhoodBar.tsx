'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useState } from 'react'

interface Neighborhood {
  name: string
  listing_count: number
  avg_price: number
  avg_rating: number | null
}

interface NeighborhoodData {
  neighborhoods: Neighborhood[]
}

type SortKey = 'listing_count' | 'avg_price' | 'avg_rating'

const SORT_LABELS: Record<SortKey, string> = {
  listing_count: 'Ofertas',
  avg_price: 'Precio promedio',
  avg_rating: 'Calificación promedio',
}

export function NeighborhoodBar({ data }: { data: NeighborhoodData }) {
  const tx = useProjectText()
  const [sortBy, setSortBy] = useState<SortKey>('listing_count')

  const sorted = [...data.neighborhoods]
    .filter(n => sortBy === 'avg_rating' ? n.avg_rating !== null : true)
    .sort((a, b) => {
      const av = a[sortBy] ?? 0
      const bv = b[sortBy] ?? 0
      return (bv as number) - (av as number)
    })

  const maxVal = Math.max(...sorted.map(n => (n[sortBy] ?? 0) as number))

  return (
    <div>
      {/* Sort controls */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <span className="font-sans text-xs tracking-widest uppercase text-muted mr-1">{tx("Ordenar por")}</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
          <button
            key={key}
            type="button"
            aria-pressed={sortBy === key}
            onClick={() => setSortBy(key)}
            className={`font-sans text-xs px-3 py-1 border transition-colors ${
              sortBy === key
                ? 'border-ink bg-ink text-paper'
                : 'border-border text-muted hover:border-muted'
            }`}
          >
            {tx(SORT_LABELS[key])}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v =>
              sortBy === 'avg_price' ? `${(v / 1000).toFixed(1)}k` :
              sortBy === 'avg_rating' ? v.toFixed(2) :
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <YAxis
            dataKey="name"
            type="category"
            width={160}
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-label)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'var(--font-lora)',
              fontSize: 12,
              border: '1px solid var(--chart-grid)',
              borderRadius: 0,
              backgroundColor: 'var(--tooltip-bg)',
              color: 'var(--chart-label)',
            }}
            formatter={(value: number) =>
              sortBy === 'avg_price' ? [`MXN ${value.toLocaleString()}`, tx("Precio promedio")] :
              sortBy === 'avg_rating' ? [value.toFixed(2), tx("Calificación promedio")] :
              [value.toLocaleString(), tx("Ofertas")]
            }
          />
          <Bar dataKey={sortBy} radius={[0, 1, 1, 0]}>
            {sorted.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={i === 0 ? 'var(--bar-rank-1)' : i < 3 ? 'var(--bar-rank-2)' : 'var(--bar-rank-3)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
