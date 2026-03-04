'use client'
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
  casual: '#9AB0C8',
  professional: '#1E3A5F',
  enterprise: '#C4841D',
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: Segment }[] }) => {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div style={{
      fontFamily: 'var(--font-lora)',
      fontSize: 12,
      border: '1px solid #E5E4DF',
      backgroundColor: '#FAFAF8',
      color: '#1A1A1A',
      padding: '10px 14px',
      minWidth: 180,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
      <p>{s.host_count.toLocaleString()} anfitriones</p>
      <p>{s.total_listings.toLocaleString()} ofertas totales</p>
      <p>Prom. {s.avg_listings.toFixed(1)} ofertas/anfitrión</p>
      <p>Prom. MXN {s.avg_price.toLocaleString()}/noche</p>
      {s.sample_hosts.length > 0 && (
        <>
          <p style={{ marginTop: 8, color: '#6B6B6B', fontSize: 11 }}>Principales anfitriones:</p>
          {s.sample_hosts.slice(0, 3).map(h => (
            <p key={h.host_name} style={{ fontSize: 11, color: '#6B6B6B' }}>
              {h.host_name} — {h.listing_count} listings
            </p>
          ))}
        </>
      )}
    </div>
  )
}

export function HostSegmentation({ data }: { data: HostSegmentationData }) {
  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* Total listings by segment */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">Ofertas totales por segmento</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.segments} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: '#6B6B6B' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: '#6B6B6B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total_listings" radius={[1, 1, 0, 0]}>
              {data.segments.map(s => (
                <Cell key={s.name} fill={SEGMENT_COLORS[s.name] ?? '#1E3A5F'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segment stats table */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-muted mb-4">Resumen por segmento</p>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border dark:border-[#2a2a2a]">
              {['Segmento', 'Anfitriones', 'Ofertas', 'Precio prom./noche'].map(h => (
                <th key={h} className="font-sans text-xs tracking-widest uppercase text-muted pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.segments.map(s => (
              <tr key={s.name} className="border-b border-border dark:border-[#2a2a2a]">
                <td className="font-sans text-sm py-3 pr-4">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.name] }} />
                    {s.label}
                  </span>
                </td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.host_count.toLocaleString()}</td>
                <td className="font-sans text-sm text-muted py-3 pr-4">{s.total_listings.toLocaleString()}</td>
                <td className="font-sans text-sm text-muted py-3">MXN {s.avg_price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
