'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useFilter } from '@/context/FilterContext'

interface PriceDistributionData {
  bins: number[]
  room_types: Record<string, number[]>
}

const ROOM_TYPE_ES: Record<string, string> = {
  'Entire home/apt': 'Casa/depto completo',
  'Private room':    'Cuarto privado',
  'Shared room':     'Cuarto compartido',
  'Hotel room':      'Cuarto de hotel',
}

const ROOM_COLORS: Record<string, string> = {
  'Entire home/apt': '#1E3A5F',
  'Private room': '#C4841D',
  'Hotel room': '#6B9DB8',
  'Shared room': '#9CA3AF',
}

// Show only first 12 bins (0–6000 MXN) where most listings concentrate
const MAX_BINS = 12

export function PriceHistogram({ data }: { data: PriceDistributionData }) {
  const { roomType } = useFilter()

  const chartData = data.bins.slice(0, MAX_BINS).map((binStart, i) => {
    const binEnd = data.bins[i + 1]
    if (binEnd === undefined) return null
    const label = `${(binStart / 1000).toFixed(1)}k`
    const entry: Record<string, string | number> = { bin: label }
    for (const [rt, counts] of Object.entries(data.room_types)) {
      entry[rt] = counts[i] ?? 0
    }
    return entry
  }).filter(Boolean) as Record<string, string | number>[]

  const activeTypes =
    roomType === 'All'
      ? Object.keys(data.room_types)
      : [roomType]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="bin"
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Precio (MXN/noche)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--chart-tick)', fontFamily: 'var(--font-lora)' }}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
        <Tooltip
          contentStyle={{
            fontFamily: 'var(--font-lora)',
            fontSize: 12,
            border: '1px solid #E5E4DF',
            borderRadius: 0,
            backgroundColor: '#FAFAF8',
            color: '#1A1A1A',
          }}
          formatter={(value: number, name: string) => [value.toLocaleString(), ROOM_TYPE_ES[name] ?? name]}
          labelFormatter={label => `${label} MXN`}
        />
        {activeTypes.length > 1 && <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-lora)' }} formatter={(value: string) => ROOM_TYPE_ES[value] ?? value} />}
        {activeTypes.map(rt => (
          <Bar
            key={rt}
            dataKey={rt}
            fill={ROOM_COLORS[rt] ?? '#1E3A5F'}
            opacity={0.85}
            radius={[1, 1, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
