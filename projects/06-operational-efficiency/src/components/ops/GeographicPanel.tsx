'use client'
import { useOpsGeographic } from '@/hooks/useOpsAPI'
import { useOpsFilters } from '@/context/OpsFilterContext'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { ChoroplethMap } from '@/components/d3/ChoroplethMap'

interface BoroughRow {
  borough: string
  total_requests: number
  avg_resolution_days: number
  sla_compliance: number
  top_complaint: string
}

export function GeographicPanel() {
  const { queryString, setFilters } = useOpsFilters()
  const { data, error, isLoading } = useOpsGeographic(queryString)

  function handleBoroughClick(borough: string) {
    setFilters({ borough })
  }

  if (error) {
    return (
      <div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">
          Error al cargar datos geograficos.
        </p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-ops-surface animate-pulse border border-ops-border" />
        <div className="h-48 bg-ops-surface animate-pulse border border-ops-border" />
      </div>
    )
  }

  const boroughs: BoroughRow[] = data.boroughs ?? []
  const mapData = boroughs.map((b) => ({ borough: b.borough, value: b.total_requests }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Choropleth map */}
        <ChartContainer
          title="Solicitudes por Municipio"
          subtitle="Haz clic en un municipio para filtrar"
        >
          {mapData.length > 0 ? (
            <ChoroplethMap
              data={mapData}
              metric="Solicitudes"
              onBoroughClick={handleBoroughClick}
            />
          ) : (
            <p className="text-ops-text-muted text-sm font-sans py-8 text-center">
              Sin datos de mapa.
            </p>
          )}
        </ChartContainer>

        {/* Right: Comparison table */}
        <ChartContainer title="Comparativa por Municipio">
          {boroughs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ops-border">
                    <th className="text-left font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-3">
                      Municipio
                    </th>
                    <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-3">
                      Solicitudes
                    </th>
                    <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-3">
                      Dias Prom.
                    </th>
                    <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-3">
                      SLA
                    </th>
                    <th className="text-left font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2">
                      Top Queja
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boroughs.map((row) => (
                    <tr
                      key={row.borough}
                      className="border-b border-ops-border/50 hover:bg-ops-surface-hover cursor-pointer"
                      onClick={() => handleBoroughClick(row.borough)}
                    >
                      <td className="font-sans text-ops-text py-2 pr-3">{row.borough}</td>
                      <td className="font-mono text-ops-text text-right py-2 pr-3 tabular-nums">
                        {row.total_requests.toLocaleString('es-MX')}
                      </td>
                      <td className="font-mono text-ops-text text-right py-2 pr-3 tabular-nums">
                        {(row.avg_resolution_days ?? 0).toFixed(1)}
                      </td>
                      <td
                        className={`font-mono text-right py-2 pr-3 tabular-nums ${
                          (row.sla_compliance ?? 0) < 70
                            ? 'text-ops-red'
                            : (row.sla_compliance ?? 0) < 85
                              ? 'text-ops-amber'
                              : 'text-ops-green'
                        }`}
                      >
                        {row.sla_compliance != null ? `${row.sla_compliance.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="font-sans text-xs text-ops-text-muted py-2 truncate max-w-[150px]">
                        {row.top_complaint}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-ops-text-muted text-sm font-sans py-8 text-center">
              Sin datos de municipios.
            </p>
          )}
        </ChartContainer>
      </div>
    </div>
  )
}
