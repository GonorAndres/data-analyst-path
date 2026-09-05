'use client'
import { useProjectText } from '@/features/market/components/useProjectText'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface SampleHost {
  host_name: string
  listing_count: number
  avg_price: number
}

interface Segment {
  name: string
  label: string
  host_count: number
  avg_listings: number
  avg_price: number
  total_listings: number
  sample_hosts: SampleHost[]
}

interface HostSegmentationData {
  segments: Segment[]
}

const SEGMENT_COLORS: Record<string, string> = {
  casual: 'var(--series-2)',
  professional: 'var(--series-1)',
  enterprise: 'var(--series-4)',
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: Segment }[] }) => {
  const tx = useProjectText()
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div style={{
      fontFamily: 'var(--font-lora)',
      fontSize: 12,
      border: '1px solid var(--chart-grid)',
      backgroundColor: 'var(--tooltip-bg)',
      color: 'var(--chart-label)',
      padding: '10px 14px',
      minWidth: 180,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{tx(s.label)}</p>
      <p>{s.host_count.toLocaleString()} {" " + tx("anfitriones")}</p>
      <p>{s.total_listings.toLocaleString()} {" " + tx("ofertas totales")}</p>
      <p>{tx("Prom.") + " "}{s.avg_listings.toFixed(1)} {" " + tx("ofertas/anfitrión")}</p>
      <p>{tx("Prom. MXN") + " "}{s.avg_price.toLocaleString()}{tx("/noche")}</p>
      {s.sample_hosts.length > 0 && (
        <>
          <p style={{ marginTop: 8, color: 'var(--chart-tick)', fontSize: 11 }}>{tx("Principales anfitriones:")}</p>
          {s.sample_hosts.slice(0, 3).map(h => (
            <p key={h.host_name} style={{ fontSize: 11, color: 'var(--chart-tick)' }}>
              {h.host_name} — {h.listing_count} listings
            </p>
          ))}
        </>
      )}
    </div>
  )
}

export function HostSegmentation({ data }: { data: HostSegmentationData }) {
  const tx = useProjectText()
  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* Total listings by segment */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">{tx("Ofertas totales por segmento")}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.segments} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              tickFormatter={(value: string) => tx(value)}
              tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total_listings" radius={[1, 1, 0, 0]}>
              {data.segments.map(s => (
                <Cell key={s.name} fill={SEGMENT_COLORS[s.name] ?? 'var(--series-1)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segment stats table */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">{tx("Resumen por segmento")}</p>
        <div className="max-w-full overflow-x-auto"><table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              {[tx("Segmento"), tx("Anfitriones"), tx("Ofertas"), tx("Precio prom./noche")].map(h => (
                <th key={h} className="font-sans text-xs tracking-widest uppercase text-muted pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.segments.map(s => (
              <tr key={s.name} className="border-b border-border">
                <td className="font-sans text-sm py-3 pr-4">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.name] }} />
                    {tx(s.label)}
                  </span>
                </td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.host_count.toLocaleString()}</td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.total_listings.toLocaleString()}</td>
                <td className="font-sans text-sm text-muted py-3">MXN {s.avg_price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
