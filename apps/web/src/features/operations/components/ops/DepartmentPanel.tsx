'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { useOpsDepartments } from '@/features/operations/hooks/useOpsAPI'
import { useOpsFilters } from '@/features/operations/context/OpsFilterContext'
import { ChartContainer } from '@/features/operations/components/ui/ChartContainer'
import { GaugeChart } from '@/features/operations/components/d3/GaugeChart'
import { HeatmapGrid } from '@/features/operations/components/d3/HeatmapGrid'

interface AgencyRow {
  agency: string
  total_requests: number
  avg_resolution_days: number
  sla_compliance: number
}

export function DepartmentPanel() {
  const { queryString } = useOpsFilters()
  const { data, error, isLoading } = useOpsDepartments(queryString)

  if (error) {
    return (
      <FeatureText><div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">
          Error al cargar datos de rendimiento por agencia.
        </p>
      </div></FeatureText>
    )
  }

  if (isLoading) {
    return (
      <FeatureText><div className="space-y-4">
        <div className="h-64 bg-ops-surface animate-pulse border border-ops-border" />
        <div className="h-48 bg-ops-surface animate-pulse border border-ops-border" />
      </div></FeatureText>
    )
  }

  if (!data) return <FeatureText><p className="text-sm text-muted py-8">No data available.</p></FeatureText>

  const agencies: AgencyRow[] = data.ranking ?? []
  const heatmapRaw = data.heatmap ?? { agencies: [], complaint_types: [], matrix: [] }
  const heatmapData = { rows: heatmapRaw.agencies ?? [], cols: heatmapRaw.complaint_types ?? [], matrix: heatmapRaw.matrix ?? [] }
  const topAgencies = agencies.slice(0, 3)
  const maxRequests = Math.max(...agencies.map((a) => a.total_requests), 1)

  return (
    <FeatureText><div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Agency ranking with horizontal bars */}
        <ChartContainer
          title="Ranking por Volumen"
          subtitle="Solicitudes por agencia (top 15)"
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {agencies.slice(0, 15).map((agency, i) => (
              <div key={agency.agency} className="flex items-center gap-3">
                <span className="font-mono text-xs text-ops-text-muted w-5 text-right tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-sans text-xs text-ops-text truncate mr-2">
                      {agency.agency}
                    </span>
                    <span className="font-mono text-xs text-ops-text-muted tabular-nums whitespace-nowrap">
                      {agency.total_requests.toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-ops-border">
                    <div
                      className="h-full bg-ops-blue"
                      style={{ width: `${(agency.total_requests / maxRequests) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Right: Gauges for top 3 agencies */}
        <ChartContainer
          title="Cumplimiento SLA"
          subtitle="Top 3 agencias por volumen"
        >
          <div className="grid grid-cols-3 gap-2">
            {topAgencies.map((agency) => (
              <div key={agency.agency} className="text-center">
                <GaugeChart
                  value={agency.sla_compliance ?? Number.NaN}
                  label={
                    agency.agency.length > 12
                      ? agency.agency.slice(0, 10) + '...'
                      : agency.agency
                  }
                />
                <div className="font-mono text-xs text-ops-text-muted mt-1 tabular-nums">
                  {agency.avg_resolution_days == null ? '—' : agency.avg_resolution_days.toFixed(1)}d prom.
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* Bottom: Heatmap */}
      {heatmapData.rows.length > 0 && heatmapData.cols.length > 0 && (
        <ChartContainer
          title="Mapa de Calor"
          subtitle="Agencia x Tipo de queja (volumen de solicitudes)"
        >
          <HeatmapGrid data={heatmapData} />
        </ChartContainer>
      )}
    </div></FeatureText>
  )
}
