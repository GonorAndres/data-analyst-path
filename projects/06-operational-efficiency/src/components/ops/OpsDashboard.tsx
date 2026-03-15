'use client'
import { useState } from 'react'
import { OpsFilterProvider, useOpsFilters } from '@/context/OpsFilterContext'
import { useOpsOverview, useOpsFilters as useOpsFilterOptions } from '@/hooks/useOpsAPI'
import { TabNav } from '@/components/ui/TabNav'
import { SLAVerdictCard } from './SLAVerdictCard'
import { KPIRow } from './KPIRow'
import { ProcessFlowPanel } from './ProcessFlowPanel'
import { DepartmentPanel } from './DepartmentPanel'
import { GeographicPanel } from './GeographicPanel'
import { TrendsPanel } from './TrendsPanel'
import { ParetoPanel } from './ParetoPanel'
import { ProcesoTecnicoPanel } from './ProcesoTecnicoPanel'
import { IntroPanel } from './IntroPanel'
import { ColdStartBanner } from './ColdStartBanner'

const TABS = [
  { key: 'contexto', label: 'Contexto' },
  { key: 'resumen', label: 'Resumen Ejecutivo' },
  { key: 'procesos', label: 'Flujo de Procesos' },
  { key: 'agencias', label: 'Rendimiento por Agencia' },
  { key: 'geografico', label: 'Analisis Geografico' },
  { key: 'tendencias', label: 'Tendencias y Estacionalidad' },
  { key: 'pareto', label: 'Pareto y Prioridades' },
  { key: 'tecnico', label: 'Proceso Tecnico' },
]

function FilterBar() {
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
    <div className="flex flex-wrap items-center gap-3 py-3 px-1">
      <select
        className={selectClass}
        value={filters.agency}
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
    </div>
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
      <div className="border border-ops-red/50 bg-ops-red/5 p-6">
        <p className="font-sans text-sm text-ops-red">Error al cargar el resumen ejecutivo.</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-ops-surface animate-pulse border border-ops-border" />
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-ops-surface animate-pulse border border-ops-border" />
          ))}
        </div>
      </div>
    )
  }

  const verdict = data.sla_verdict ?? 'N/A'
  const complianceRate = data.sla_compliance_rate ?? 0
  const totalRequests = data.total_requests ?? 0
  const avgResolution = data.avg_resolution_days ?? 0
  const topComplaints: TopComplaintItem[] = data.top_complaint_types ?? []

  return (
    <div className="space-y-4">
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
    </div>
  )
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('contexto')

  return (
    <div className="min-h-screen bg-ops-bg">
      <ColdStartBanner />
      {/* Brass accent strip */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-ops-blue to-transparent" />

      {/* Header */}
      <header className="border-b border-ops-border bg-ops-surface px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex items-baseline justify-between">
          <div>
            <h1 className="font-sans text-lg font-bold text-ops-text tracking-tight">
              Centro de Operaciones NYC 311
            </h1>
            <p className="font-sans text-xs text-ops-text-muted mt-0.5">
              Analisis de eficiencia operacional -- Solicitudes 2024
            </p>
          </div>
          <span className="font-mono text-[10px] text-ops-text-muted tracking-wider opacity-60">
            OPS // P06
          </span>
        </div>
      </header>

      {/* Filter bar */}
      <div className="border-b border-ops-border bg-ops-bg px-6">
        <div className="max-w-[1400px] mx-auto">
          <FilterBar />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-ops-border bg-ops-bg px-6">
        <div className="max-w-[1400px] mx-auto">
          <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Panel content */}
      <main className="px-6 py-6">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'contexto' && <IntroPanel />}
          {activeTab === 'resumen' && <ResumenPanel />}
          {activeTab === 'procesos' && <ProcessFlowPanel />}
          {activeTab === 'agencias' && <DepartmentPanel />}
          {activeTab === 'geografico' && <GeographicPanel />}
          {activeTab === 'tendencias' && <TrendsPanel />}
          {activeTab === 'pareto' && <ParetoPanel />}
          {activeTab === 'tecnico' && <ProcesoTecnicoPanel />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ops-border px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <p className="font-sans text-xs text-ops-text-muted">
            Andres Gonzalez Ortega -- Proyecto de Eficiencia Operacional
          </p>
          <p className="font-sans text-xs text-ops-text-muted">
            Datos: NYC Open Data 311 Service Requests
          </p>
        </div>
      </footer>
    </div>
  )
}

export function OpsDashboard() {
  return (
    <OpsFilterProvider>
      <DashboardContent />
    </OpsFilterProvider>
  )
}
