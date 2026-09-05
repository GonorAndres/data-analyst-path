'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { useSection } from '@/hooks/useSection'
import { SectionNav } from '@/components/SectionNav'
import { usePreferences } from '@/components/SitePreferences'
import { OpsFilterProvider, useOpsFilters } from '@/features/operations/context/OpsFilterContext'
import { useOpsOverview, useOpsFilters as useOpsFilterOptions } from '@/features/operations/hooks/useOpsAPI'
import { SLAVerdictCard } from './SLAVerdictCard'
import { KPIRow } from './KPIRow'
import { ProcessFlowPanel } from './ProcessFlowPanel'
import { DepartmentPanel } from './DepartmentPanel'
import { GeographicPanel } from './GeographicPanel'
import { TrendsPanel } from './TrendsPanel'
import { ParetoPanel } from './ParetoPanel'
import { ProcesoTecnicoPanel } from './ProcesoTecnicoPanel'
import { IntroPanel } from './IntroPanel'

const TABS = [
  { key: 'contexto', label: 'Contexto' },
  { key: 'resumen', label: 'Resumen ejecutivo' },
  { key: 'procesos', label: 'Flujo de procesos' },
  { key: 'agencias', label: 'Rendimiento por agencia' },
  { key: 'geografico', label: 'Análisis geográfico' },
  { key: 'tendencias', label: 'Tendencias y estacionalidad' },
  { key: 'pareto', label: 'Pareto y prioridades' },
  { key: 'tecnico', label: 'Proceso técnico' },
]

function FilterBar() {
  const { t } = usePreferences()
  const { filters, setFilters, resetFilters } = useOpsFilters()
  const { data: filterOptions } = useOpsFilterOptions()

  const selectClass =
    'bg-ops-surface border border-ops-border text-ops-text font-sans text-sm px-3 py-1.5 appearance-none cursor-pointer focus:outline-none focus:border-ops-blue'

  const agencies: string[] = filterOptions?.agencies ?? []
  const complaintTypes: string[] = filterOptions?.complaint_types ?? []
  const boroughs: string[] = filterOptions?.boroughs ?? []
  const channels: string[] = filterOptions?.channels ?? []
  const yearMonths: string[] = filterOptions?.year_months ?? []

  return (
    <FeatureText><div className="flex flex-wrap items-center gap-3 py-3 px-1">
      <select
        className={selectClass}
        value={filters.agency}
        aria-label={t('Agency', 'Agencia')}
        onChange={(e) => setFilters({ agency: e.target.value })}
      >
        <option value="">Todas las agencias</option>
        {agencies.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.complaint_type}
        aria-label={t('Complaint type', 'Tipo de solicitud')}
        onChange={(e) => setFilters({ complaint_type: e.target.value })}
      >
        <option value="">Todos los tipos</option>
        {complaintTypes.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.borough}
        aria-label={t('Borough', 'Municipio')}
        onChange={(e) => setFilters({ borough: e.target.value })}
      >
        <option value="">Todos los municipios</option>
        {boroughs.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.channel}
        aria-label={t('Channel', 'Canal')}
        onChange={(e) => setFilters({ channel: e.target.value })}
      >
        <option value="">Todos los canales</option>
        {channels.map((ch) => (
          <option key={ch} value={ch}>
            {ch}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.year_month}
        aria-label={t('Period', 'Periodo')}
        onChange={(e) => setFilters({ year_month: e.target.value })}
      >
        <option value="">Todos los periodos</option>
        {yearMonths.map((ym) => (
          <option key={ym} value={ym}>
            {ym}
          </option>
        ))}
      </select>

      <button
        onClick={resetFilters}
        className="font-sans text-xs text-ops-text-muted hover:text-ops-text border border-ops-border px-3 py-1.5 bg-transparent cursor-pointer transition-colors"
      >
        Limpiar filtros
      </button>
    </div></FeatureText>
  )
}

interface TopComplaintItem {
  complaint_type: string
  count: number
  pct: number
}

function ResumenPanel() {
  const { queryString } = useOpsFilters()
  const { data, error, isLoading } = useOpsOverview(queryString)

  if (error) {
    return (
      <FeatureText><div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">Error al cargar el resumen ejecutivo.</p>
      </div></FeatureText>
    )
  }

  if (isLoading) {
    return (
      <FeatureText><div className="space-y-4">
        <div className="h-20 bg-ops-surface animate-pulse border border-ops-border" />
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-ops-surface animate-pulse border border-ops-border" />
          ))}
        </div>
      </div></FeatureText>
    )
  }

  if (!data) return <FeatureText><p className="text-sm text-muted py-8">No data available.</p></FeatureText>

  const verdict = data.sla_verdict ?? 'N/A'
  const complianceRate = data.sla_compliance_rate ?? null
  const totalRequests = data.total_requests ?? null
  const avgResolution = data.avg_resolution_days ?? null
  const topComplaints: TopComplaintItem[] = data.top_complaint_types ?? []

  return (
    <FeatureText><div className="space-y-4">
      <SLAVerdictCard
        verdict={verdict}
        complianceRate={complianceRate}
        totalRequests={totalRequests}
        avgResolution={avgResolution}
      />

      <KPIRow data={data} />

      {topComplaints.length > 0 && (
        <div className="bg-ops-surface border border-ops-border p-4">
          <h3 className="font-sans text-sm font-semibold text-ops-text-muted uppercase tracking-wide mb-3">
            Tipos de Queja Principales
          </h3>
          <div className="space-y-2">
            {topComplaints.slice(0, 10).map((item, i) => (
              <div key={item.complaint_type} className="flex items-center gap-3">
                <span className="font-mono text-xs text-ops-text-muted w-5 text-right tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-sans text-xs text-ops-text truncate mr-2">
                      {item.complaint_type}
                    </span>
                    <span className="font-mono text-xs text-ops-text-muted tabular-nums whitespace-nowrap">
                      {(item.count ?? 0).toLocaleString('es-MX')} ({(item.pct ?? 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1 bg-ops-border">
                    <div
                      className="h-full bg-ops-blue"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div></FeatureText>
  )
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useSection('contexto', TABS.map(tab => tab.key))
  const { t } = usePreferences()
  const labels = ['Context', 'Executive overview', 'Process flow', 'Agencies', 'Geography', 'Trends', 'Priorities', 'Technical process']

  return (
    <FeatureText><div className="space-y-6">

      {/* Header */}
      <header>
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-ops-text tracking-tight">
              {t('NYC 311 operations', 'Operaciones NYC 311')}
            </h1>
            <p className="font-sans text-sm text-ops-text-muted mt-2">
              {t('Service response, bottlenecks and agency performance · 2024 requests.', 'Respuesta al servicio, cuellos de botella y desempeño por agencia · Solicitudes 2024.')}
            </p>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      {!['contexto', 'tecnico'].includes(activeTab) && <FilterBar />}

      {/* Tab navigation */}
      <SectionNav items={TABS.map((tab, i) => ({ id: tab.key, label: t(labels[i], tab.label) }))} value={activeTab} onChange={setActiveTab} />

      {/* Panel content */}
      <div>
          {activeTab === 'contexto' && <IntroPanel />}
          {activeTab === 'resumen' && <ResumenPanel />}
          {activeTab === 'procesos' && <ProcessFlowPanel />}
          {activeTab === 'agencias' && <DepartmentPanel />}
          {activeTab === 'geografico' && <GeographicPanel />}
          {activeTab === 'tendencias' && <TrendsPanel />}
          {activeTab === 'pareto' && <ParetoPanel />}
          {activeTab === 'tecnico' && <ProcesoTecnicoPanel />}
      </div>

    </div></FeatureText>
  )
}

export function OpsDashboard() {
  return (
    <FeatureText><OpsFilterProvider>
      <DashboardContent />
    </OpsFilterProvider></FeatureText>
  )
}
