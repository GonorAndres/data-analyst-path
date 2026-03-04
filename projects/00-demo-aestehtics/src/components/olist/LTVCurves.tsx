'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList, Cell,
} from 'recharts'

interface LTVPoint {
  month: number
  ltv: number
}

interface LTVCurve {
  cohort: string
  size: number
  points: LTVPoint[]
}

interface LTVData {
  cohorts: string[]
  curves: LTVCurve[]
}

interface Props {
  data: LTVData | undefined
  isLoading: boolean
}

const COHORT_COLORS = [
  'var(--bar-rank-1)',
  'var(--bar-rank-2)',
  'var(--bar-rank-3)',
  '#C4841D',
  '#9CA3AF',
  '#6BA3C8',
]

interface SnapshotEntry {
  cohort: string
  ltv: number
  size: number
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: SnapshotEntry }>
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      backgroundColor: 'var(--chart-bg)',
      border: '1px solid var(--chart-grid)',
      fontFamily: 'var(--font-lora)',
      fontSize: 12,
      color: 'var(--chart-label)',
      padding: '10px 14px',
      minWidth: 160,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.cohort}</p>
      <p>LTV: R$ {d.ltv.toLocaleString()}</p>
      <p style={{ marginTop: 2, opacity: 0.7 }}>n = {d.size.toLocaleString()}</p>
    </div>
  )
}

export function LTVCurves({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 300 }} />
    )
  }

  if (!data.curves.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const maxMonth = Math.max(
    ...data.curves.flatMap(c => c.points.map(p => p.month))
  )

  const snapshots: SnapshotEntry[] = data.curves
    .map(curve => ({
      cohort: curve.cohort,
      ltv: curve.points[curve.points.length - 1]?.ltv ?? 0,
      size: curve.size,
    }))
    .sort((a, b) => b.ltv - a.ltv)

  return (
    <div>
      <p className="font-sans text-xs text-muted mb-3">
        LTV acumulado al mes {maxMonth}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={snapshots}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
          <YAxis
            dataKey="cohort"
            type="category"
            width={70}
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `R$ ${v.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="ltv" radius={[0, 3, 3, 0]}>
            {snapshots.map((entry, i) => (
              <Cell key={entry.cohort} fill={COHORT_COLORS[i % COHORT_COLORS.length]} />
            ))}
            <LabelList
              dataKey="ltv"
              position="right"
              style={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-label)' }}
              formatter={(v: number | string) => `R$ ${Number(v).toLocaleString()}`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="font-sans text-xs text-muted mt-2">
        Método: LTV histórico (observado). Alternativas no incluidas: predictivo simple (AOV × frecuencia × vida útil) y probabilístico (BG/NBD + Gamma-Gamma para modelar abandono silencioso en negocios no contractuales).
      </p>
    </div>
  )
}
