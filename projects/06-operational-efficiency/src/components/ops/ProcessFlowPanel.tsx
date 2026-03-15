'use client'
import { useOpsBotleneck } from '@/hooks/useOpsAPI'
import { useOpsFilters } from '@/context/OpsFilterContext'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { SankeyFlow } from '@/components/d3/SankeyFlow'

interface BottleneckRow {
  agency: string
  complaint_type: string
  avg_days: number
  median_days: number
  count: number
  sla_compliance: number
}

export function ProcessFlowPanel() {
  const { queryString } = useOpsFilters()
  const { data, error, isLoading } = useOpsBotleneck(queryString)

  if (error) {
    return (
      <div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">Error al cargar datos de flujo de procesos.</p>
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

  const sankeyData = data.sankey ?? { nodes: [], links: [] }
  const bottlenecks: BottleneckRow[] = data.bottlenecks ?? []

  return (
    <div className="space-y-4">
      <ChartContainer
        title="Flujo de Procesos"
        subtitle="Categoria de queja -> Agencia -> Etapa -> Resultado"
      >
        {sankeyData.nodes.length > 0 ? (
          <SankeyFlow data={sankeyData} />
        ) : (
          <p className="text-ops-text-muted text-sm font-sans py-8 text-center">
            Sin datos de flujo disponibles.
          </p>
        )}
      </ChartContainer>

      <ChartContainer title="Cuellos de Botella" subtitle="Agencias con mayor tiempo de resolucion">
        {bottlenecks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ops-border">
                  <th className="text-left font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-4">
                    Agencia
                  </th>
                  <th className="text-left font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-4">
                    Tipo de Queja
                  </th>
                  <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-4">
                    Dias Prom.
                  </th>
                  <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-4">
                    Dias Med.
                  </th>
                  <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2 pr-4">
                    Solicitudes
                  </th>
                  <th className="text-right font-sans text-xs text-ops-text-muted uppercase tracking-wide py-2">
                    SLA
                  </th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.map((row, i) => {
                  const isLow = row.sla_compliance != null && row.sla_compliance < 70
                  return (
                    <tr
                      key={`${row.agency}-${row.complaint_type}-${i}`}
                      className={`border-b border-ops-border/50 ${isLow ? 'bg-ops-red/5' : ''}`}
                    >
                      <td className="font-sans text-ops-text py-2 pr-4">{row.agency}</td>
                      <td className="font-sans text-ops-text-muted py-2 pr-4">
                        {row.complaint_type}
                      </td>
                      <td className="font-mono text-ops-text text-right py-2 pr-4 tabular-nums">
                        {(row.avg_days ?? 0).toFixed(1)}
                      </td>
                      <td className="font-mono text-ops-text text-right py-2 pr-4 tabular-nums">
                        {(row.median_days ?? 0).toFixed(1)}
                      </td>
                      <td className="font-mono text-ops-text text-right py-2 pr-4 tabular-nums">
                        {(row.count ?? 0).toLocaleString('es-MX')}
                      </td>
                      <td
                        className={`font-mono text-right py-2 tabular-nums ${
                          isLow ? 'text-ops-red font-bold' : 'text-ops-text'
                        }`}
                      >
                        {row.sla_compliance != null ? `${row.sla_compliance.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ops-text-muted text-sm font-sans py-8 text-center">
            Sin datos de cuellos de botella.
          </p>
        )}
      </ChartContainer>
    </div>
  )
}
