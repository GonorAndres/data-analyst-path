'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface RFMSegment {
  segment: string
  count: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
}

interface RFMData {
  segments: RFMSegment[]
}

interface Props {
  data: RFMData | undefined
  isLoading: boolean
}

const SEGMENT_COLORS: Record<string, string> = {
  Champions: 'var(--rfm-champions)',
  Loyal: 'var(--rfm-loyal)',
  Potential: 'var(--rfm-potential)',
  New: 'var(--rfm-new)',
  'At Risk': 'var(--rfm-at-risk)',
  Hibernating: 'var(--rfm-hibernating)',
}

const SEGMENT_SPANISH: Record<string, string> = {
  Champions: 'Alto valor recurrente',
  Loyal: 'Recurrentes estables',
  Potential: 'Potencial de recompra',
  New: 'Compra reciente',
  'At Risk': 'En riesgo de abandono',
  Hibernating: 'Compra única',
}

function getSegmentColor(segment: string): string {
  for (const [key, color] of Object.entries(SEGMENT_COLORS)) {
    if (segment.toLowerCase().includes(key.toLowerCase())) return color
  }
  return 'var(--bar-rank-1)'
}

function getSegmentLabel(segment: string): string {
  for (const [key, label] of Object.entries(SEGMENT_SPANISH)) {
    if (segment.toLowerCase().includes(key.toLowerCase())) return label
  }
  return segment
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: RFMSegment }>
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
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{getSegmentLabel(s.segment)}</p>
      <p>{s.count.toLocaleString()} clientes</p>
      <p>Recencia prom.: {s.avg_recency.toFixed(0)} dias</p>
      <p>Frecuencia prom.: {s.avg_frequency.toFixed(1)}</p>
      <p>Valor prom.: R$ {s.avg_monetary.toLocaleString()}</p>
    </div>
  )
}

export function RFMSegments({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
    )
  }

  if (!data.segments.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const displaySegments = data.segments.map(s => ({
    ...s,
    label: getSegmentLabel(s.segment),
  }))

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-12">
      {/* Horizontal bar chart — customer count per segment */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">Clientes por segmento</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={displaySegments} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 2, 2, 0]} barSize={20}>
              {displaySegments.map(s => (
                <Cell key={s.segment} fill={getSegmentColor(s.segment)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">Resumen por segmento</p>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border dark:border-[#2a2a2a]">
              {['Segmento', 'Clientes', 'Recencia', 'Frecuencia', 'Valor'].map(h => (
                <th key={h} className="font-sans text-xs tracking-widest uppercase text-muted pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displaySegments.map(s => (
              <tr key={s.segment} className="border-b border-border dark:border-[#2a2a2a]">
                <td className="font-sans text-sm py-3 pr-4">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: getSegmentColor(s.segment) }} />
                    {s.label}
                  </span>
                </td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.count.toLocaleString()}</td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.avg_recency.toFixed(0)}d</td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.avg_frequency.toFixed(1)}</td>
                <td className="font-sans text-sm text-muted py-3">R$ {s.avg_monetary.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      <p className="font-sans text-xs text-muted mt-4">
        Método: RFM clásico con puntuación por cuartiles (1–4) en cada dimensión. Puntuación combinada R+F+M (rango 3–12) asigna segmentos. En contextos con frecuencia promedio {'>='}  2, la variante RFM-T (con Tenure) o modelos probabilísticos como BG/NBD permiten estimar probabilidad de recompra — más apropiado para negocios contractuales o con ciclo de vida definido.
      </p>
    </div>
  )
}
