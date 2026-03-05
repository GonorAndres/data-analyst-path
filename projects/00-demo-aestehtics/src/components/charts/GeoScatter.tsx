'use client'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, Customized,
} from 'recharts'
import { useFilter } from '@/context/FilterContext'

interface GeoPoint {
  lat: number
  lon: number
  price: number
  name: string
  room_type: string
  neighbourhood: string
}

interface GeoHeatmapData {
  points: GeoPoint[]
}

const CDMX_ALCALDIAS = [
  { name: 'Álvaro Obregón',   lon: -99.197, lat: 19.361 },
  { name: 'Azcapotzalco',     lon: -99.185, lat: 19.487 },
  { name: 'Benito Juárez',    lon: -99.163, lat: 19.376 },
  { name: 'Coyoacán',         lon: -99.161, lat: 19.330 },
  { name: 'Cuajimalpa',       lon: -99.300, lat: 19.360 },
  { name: 'Cuauhtémoc',       lon: -99.148, lat: 19.432 },
  { name: 'G.A. Madero',      lon: -99.118, lat: 19.495 },
  { name: 'Iztacalco',        lon: -99.098, lat: 19.395 },
  { name: 'Iztapalapa',       lon: -99.055, lat: 19.354 },
  { name: 'Mag. Contreras',   lon: -99.243, lat: 19.303 },
  { name: 'Miguel Hidalgo',   lon: -99.220, lat: 19.428 },
  { name: 'Milpa Alta',       lon: -99.020, lat: 19.200 },
  { name: 'Tláhuac',          lon: -99.005, lat: 19.293 },
  { name: 'Tlalpan',          lon: -99.163, lat: 19.253 },
  { name: 'V. Carranza',      lon: -99.095, lat: 19.425 },
  { name: 'Xochimilco',       lon: -99.103, lat: 19.255 },
]

const ROOM_TYPE_ES: Record<string, string> = {
  'Entire home/apt': 'Casa/depto completo',
  'Private room':    'Cuarto privado',
  'Shared room':     'Cuarto compartido',
  'Hotel room':      'Cuarto de hotel',
}

function priceToColor(price: number): string {
  if (price < 800) return '#6B9DB8'
  if (price < 2000) return '#1E3A5F'
  return '#C4841D'
}

const CustomDot = (props: {
  cx?: number
  cy?: number
  payload?: GeoPoint
}) => {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={2.5}
      fill={priceToColor(payload.price)}
      opacity={0.55}
      stroke="none"
    />
  )
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: GeoPoint }[] }) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{
      fontFamily: 'var(--font-lora)',
      fontSize: 12,
      border: '1px solid #E5E4DF',
      backgroundColor: '#FAFAF8',
      color: '#1A1A1A',
      padding: '8px 12px',
    }}>
      <p style={{ fontWeight: 600 }}>{p.name || 'Listing'}</p>
      <p>{p.neighbourhood}</p>
      <p>MXN {p.price?.toLocaleString()}/noche</p>
      <p style={{ color: '#6B6B6B' }}>{ROOM_TYPE_ES[p.room_type] ?? p.room_type}</p>
    </div>
  )
}

const AlcaldiaLabels = (props: {
  xAxisMap?: Record<string, { scale: (v: number) => number }>
  yAxisMap?: Record<string, { scale: (v: number) => number }>
}) => {
  const xScale = props.xAxisMap?.['0']?.scale
  const yScale = props.yAxisMap?.['0']?.scale
  if (!xScale || !yScale) return null
  return (
    <g>
      {CDMX_ALCALDIAS.map(({ name, lon, lat }) => (
        <text
          key={name}
          x={xScale(lon)}
          y={yScale(lat)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontWeight={600}
          fontFamily="var(--font-lora), Georgia, serif"
          fill="var(--chart-label)"
          stroke="var(--background)"
          strokeWidth={3}
          strokeLinejoin="round"
          opacity={0.75}
          pointerEvents="none"
          style={{ userSelect: 'none', paintOrder: 'stroke' }}
        >
          {name}
        </text>
      ))}
    </g>
  )
}

export function GeoScatter({ data }: { data: GeoHeatmapData }) {
  const { roomType } = useFilter()

  const points = roomType === 'All'
    ? data.points
    : data.points.filter(p => p.room_type === roomType)

  return (
    <div>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 4, right: 16, bottom: 20, left: 0 }}>
          <XAxis
            dataKey="lon"
            type="number"
            domain={[-99.4, -98.95]}
            tick={{ fontSize: 10, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.toFixed(2)}
            label={{ value: 'Longitud', position: 'insideBottom', offset: -10, fontSize: 11, fill: 'var(--chart-tick)', fontFamily: 'var(--font-lora)' }}
          />
          <YAxis
            dataKey="lat"
            type="number"
            domain={[19.15, 19.6]}
            tick={{ fontSize: 10, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.toFixed(2)}
            label={{ value: 'Latitud', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: 'var(--chart-tick)', fontFamily: 'var(--font-lora)' }}
          />
          <ZAxis range={[20, 20]} />
          <Tooltip content={<CustomTooltip />} />
          <Customized component={AlcaldiaLabels} />
          <Scatter data={points} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex gap-6 mt-2 justify-center">
        {[
          { color: '#6B9DB8', label: '< MXN 800' },
          { color: '#1E3A5F', label: 'MXN 800–2,000' },
          { color: '#C4841D', label: '> MXN 2,000' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-sans text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
