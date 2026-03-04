'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface StateRow {
  state: string
  order_count: number
  avg_order_value: number
  avg_review_score: number | null
}

interface GeoStatesData {
  states: StateRow[]
}

interface Props {
  data: GeoStatesData | undefined
  isLoading: boolean
}

type SortKey = 'order_count' | 'avg_order_value' | 'avg_review_score'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'order_count', label: 'Pedidos' },
  { key: 'avg_order_value', label: 'Valor promedio' },
  { key: 'avg_review_score', label: 'Calificacion' },
]

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
}

function getStateName(abbr: string): string {
  return STATE_NAMES[abbr.toUpperCase()] ?? abbr
}

function barColor(index: number): string {
  if (index < 3) return 'var(--bar-rank-1)'
  if (index < 8) return 'var(--bar-rank-2)'
  return 'var(--bar-rank-3)'
}

function formatValue(value: number, key: SortKey): string {
  if (key === 'order_count') return value.toLocaleString()
  if (key === 'avg_order_value') return `R$ ${value.toFixed(0)}`
  return value?.toFixed(2) ?? '-'
}

const CustomTooltip = ({ active, payload, sortKey }: {
  active?: boolean
  payload?: Array<{ payload: StateRow }>
  sortKey: SortKey
}) => {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
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
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{getStateName(s.state)} ({s.state})</p>
      <p>Pedidos: {s.order_count.toLocaleString()}</p>
      <p>Valor prom.: R$ {s.avg_order_value.toFixed(0)}</p>
      {s.avg_review_score != null && (
        <p>Calificación: {s.avg_review_score.toFixed(2)}</p>
      )}
    </div>
  )
}

export function GeoStatesBar({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('order_count')

  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
  }

  const sorted = [...data.states]
    .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))
    .slice(0, 15)

  const chartHeight = Math.max(400, sorted.length * 28)

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`px-3 py-1 rounded text-xs font-sans transition-colors ${
              sortKey === opt.key
                ? 'bg-ink dark:bg-[#F0EFEB] text-paper dark:text-[#141414]'
                : 'text-muted border border-border dark:border-[#2a2a2a]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => sortKey === 'avg_order_value' ? `R$ ${v}` : String(v)}
          />
          <YAxis
            type="category"
            dataKey="state"
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip sortKey={sortKey} />} />
          <Bar dataKey={sortKey} radius={[0, 1, 1, 0]}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={barColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
