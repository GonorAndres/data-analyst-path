'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts'

interface LobRatioRow {
  line_of_business: string
  loss_ratio_reported: number
  loss_ratio_ultimate_cl: number
  loss_ratio_ultimate_bf: number
}

interface LossRatioData {
  by_lob: LobRatioRow[]
  by_year: unknown[]
}

interface Props {
  data: LossRatioData | undefined
  isLoading: boolean
}

type RatioView = 'reported' | 'ultimate'

const LOB_COLOR_MAP: Record<string, string> = {
  'Private Passenger Auto': 'var(--lob-auto)',
  'Workers Compensation': 'var(--lob-workers)',
  'Medical Malpractice': 'var(--lob-medmal)',
  'Other Liability': 'var(--lob-liability)',
  'Product Liability': 'var(--lob-product)',
  'Commercial Auto': 'var(--lob-comauto)',
}

function getLobColor(lob: string): string {
  return LOB_COLOR_MAP[lob] || 'var(--bar-rank-2)'
}

export function LossRatioByLOB({ data, isLoading }: Props) {
  const [ratioView, setRatioView] = useState<RatioView>('reported')

  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
  }

  if (!data.by_lob?.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const lobAgg = data.by_lob.map(row => ({
    lob: row.line_of_business,
    ratio: ratioView === 'reported' ? row.loss_ratio_reported : row.loss_ratio_ultimate_cl,
  })).sort((a, b) => b.ratio - a.ratio)

  return (
    <div>
      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        {(['reported', 'ultimate'] as RatioView[]).map(mode => (
          <button
            key={mode}
            onClick={() => setRatioView(mode)}
            className={`font-sans text-xs px-3 py-1.5 border transition-colors ${
              ratioView === mode
                ? 'border-ink dark:border-[#F0EFEB] bg-ink dark:bg-[#F0EFEB] text-[#FAFAF8] dark:text-[#1A1A1A]'
                : 'border-border dark:border-[#2a2a2a] text-muted hover:border-muted'
            }`}
          >
            {mode === 'reported' ? 'Reportado' : 'Último (Ultimate)'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(300, lobAgg.length * 48)}>
        <BarChart data={lobAgg} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            domain={[0, 'auto']}
          />
          <YAxis
            type="category"
            dataKey="lob"
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            width={160}
          />
          <ReferenceLine
            x={1}
            stroke="var(--ratio-loss)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: '100%',
              position: 'top',
              fill: 'var(--ratio-loss)',
              fontSize: 10,
              fontFamily: 'var(--font-lora)',
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as { lob: string; ratio: number }
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
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>{row.lob}</p>
                  <p>Loss ratio ({ratioView}): {(row.ratio * 100).toFixed(1)}%</p>
                </div>
              )
            }}
          />
          <Bar dataKey="ratio" radius={[0, 2, 2, 0]}>
            {lobAgg.map((entry, i) => (
              <Cell key={i} fill={getLobColor(entry.lob)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
