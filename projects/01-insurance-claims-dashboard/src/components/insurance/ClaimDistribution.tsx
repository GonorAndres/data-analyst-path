'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface SeverityBin {
  bin: string
  count: number
}

interface ReportLagRow {
  line_of_business: string
  mean_lag: number
  median_lag: number
  std_lag: number
  min_lag: number
  max_lag: number
  count: number
}

interface ClaimDistData {
  severity_histogram: SeverityBin[]
  report_lag_stats?: ReportLagRow[]
}

interface Props {
  data: ClaimDistData | undefined
  isLoading: boolean
}

function formatAmount(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

function barColor(index: number, total: number): string {
  if (index < total * 0.3) return 'var(--ratio-profitable)'
  if (index < total * 0.7) return 'var(--ratio-breakeven)'
  return 'var(--ratio-loss)'
}

export function ClaimDistribution({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="animate-pulse bg-surface dark:bg-[#1a1a1a] rounded" style={{ height: 400 }} />
  }

  if (!data.severity_histogram?.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <p className="font-sans text-sm text-muted">Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  const histData = data.severity_histogram

  return (
    <div>
      {/* Severity histogram */}
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={histData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 10, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'var(--font-lora)', fill: 'var(--chart-tick)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as SeverityBin
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
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>{row.bin}</p>
                  <p>Siniestros: {row.count.toLocaleString()}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {histData.map((_, i) => (
              <Cell key={i} fill={barColor(i, histData.length)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Report lag summary table */}
      {data.report_lag_stats && data.report_lag_stats.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg text-ink dark:text-[#F0EFEB] mb-3">
            Rezago de reporte por línea de negocio
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-xs">
              <thead>
                <tr className="border-b border-border dark:border-[#2a2a2a]">
                  <th className="text-left py-2 pr-4 text-muted font-medium tracking-wide uppercase">Línea</th>
                  <th className="text-right py-2 px-4 text-muted font-medium tracking-wide uppercase">Promedio (días)</th>
                  <th className="text-right py-2 pl-4 text-muted font-medium tracking-wide uppercase">Mediana (días)</th>
                </tr>
              </thead>
              <tbody>
                {data.report_lag_stats.map((row, i) => (
                  <tr key={i} className="border-b border-border dark:border-[#2a2a2a]">
                    <td className="py-2 pr-4 text-ink dark:text-[#F0EFEB]">{row.line_of_business}</td>
                    <td className="text-right py-2 px-4 text-ink dark:text-[#F0EFEB] tabular-nums">{row.mean_lag.toFixed(0)}</td>
                    <td className="text-right py-2 pl-4 text-ink dark:text-[#F0EFEB] tabular-nums">{row.median_lag.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
