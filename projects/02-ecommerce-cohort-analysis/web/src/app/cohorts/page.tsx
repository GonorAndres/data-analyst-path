'use client'

import { useMemo } from 'react'
import { useData } from '@/lib/data'
// Imported rather than fetched: 0.2 KB, and it lets the heading and the dataset
// counts exist in the exported HTML instead of appearing only once the client
// fetch resolves. Written by the same pipeline as the rest.
import staticMeta from '@/data/meta.json'
import { computeKpis, funnel, retentionPercent, visibleCohortRows } from '@/lib/filters'
import { formatCohort, formatCurrency, formatExact, formatPercent } from '@/lib/format'
import { CohortFilterBar, useFilters } from '@/components/CohortShell'
import { KpiRow } from '@/components/KpiRow'
import { ChartCard } from '@/components/ChartCard'
import { RetentionHeatmap } from '@/components/charts/RetentionHeatmap'
import { AcquisitionTrend, RevenueTrend } from '@/components/charts/TrendCharts'
import { Funnel } from '@/components/charts/Funnel'

export default function CohortsPage() {
  const { filters } = useFilters()
  const state = useData(['overview', 'cohorts'] as const)

  const view = useMemo(() => {
    if (state.status !== 'ready') return null
    const { overview, cohorts } = state.data

    const rows = retentionPercent(cohorts, filters)
    const visible = visibleCohortRows(cohorts, filters)
    const kpis = computeKpis(overview, filters)
    const stages = funnel(overview, filters)

    const monthly = overview.monthly.filter(
      (m) => m.month >= filters.cohortStart && m.month <= filters.cohortEnd,
    )
    const peak = monthly.length > 0 ? monthly.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null

    const visibleCohorts = new Set(visible.map((i) => cohorts.cohorts[i]))
    const acquisition = overview.by_cohort
      .filter((c) => visibleCohorts.has(c.cohort))
      .map((c) => ({ cohort: c.cohort, customers: c.customers }))

    // Month-1 retention is the number the whole analysis turns on.
    const month1 = rows.map((r) => r.values[1]).filter((v): v is number => v !== null)
    const avgMonth1 = month1.length ? month1.reduce((a, b) => a + b, 0) / month1.length : null

    return { rows, kpis, stages, monthly, peak, acquisition, avgMonth1, visibleCount: visible.length }
  }, [state, filters])

  return (
    <>
      <header className="space-y-3">
        <p className="font-sans text-xs tracking-widest uppercase text-muted">
          Análisis de producto · Olist E-Commerce
        </p>
        <h1 className="font-serif text-4xl md:text-5xl leading-tight">
          Por qué sólo el 3% vuelve a comprar
        </h1>
        <p className="font-sans text-base text-muted max-w-2xl leading-relaxed">
          {formatExact(staticMeta.orders)} pedidos entregados y{' '}
          {formatExact(staticMeta.customers)} clientes del marketplace brasileño Olist, entre{' '}
          {formatCohort(staticMeta.date_start.slice(0, 7))} y{' '}
          {formatCohort(staticMeta.date_end.slice(0, 7))}. Casi nadie regresa — la pregunta es qué
          distingue a quienes sí.
        </p>
      </header>

      {state.status === 'error' && (
        <p className="font-sans text-sm text-muted border border-border dark:border-[#2a2a2a] rounded-sm px-4 py-3">
          No se pudieron cargar los datos: {state.message}
        </p>
      )}

      {!view && state.status !== 'error' && (
        <p className="font-sans text-sm text-muted">Cargando datos…</p>
      )}

      {view && (
        <>
          <CohortFilterBar />

          <KpiRow
            items={[
              {
                label: 'Clientes únicos',
                value: formatExact(view.kpis.customers),
                accent: 'var(--series-1)',
              },
              {
                label: 'Ingresos totales',
                value: formatCurrency(view.kpis.revenue),
                accent: 'var(--series-3)',
              },
              {
                label: 'Tasa de recompra',
                value: formatPercent(view.kpis.repeatRate),
                accent: 'var(--series-2)',
                note: 'de clientes con 2+ pedidos',
              },
              {
                label: 'LTV promedio',
                value: formatCurrency(view.kpis.avgLtv),
                accent: 'var(--series-4)',
              },
            ]}
          />

          <ChartCard
            title="Retención por cohorte"
            subtitle="Porcentaje de cada cohorte que vuelve a comprar, por mes desde la primera compra"
            height={420}
            tableColumns={[
              { key: 'cohort', label: 'Cohorte' },
              { key: 'size', label: 'Clientes', align: 'right' },
              { key: 'm1', label: 'Mes 1', align: 'right' },
              { key: 'm2', label: 'Mes 2', align: 'right' },
              { key: 'm3', label: 'Mes 3', align: 'right' },
              { key: 'm6', label: 'Mes 6', align: 'right' },
            ]}
            tableRows={view.rows.map((r) => ({
              cohort: formatCohort(r.cohort),
              size: formatExact(r.size),
              m1: formatPercent(r.values[1] ?? null, 2),
              m2: formatPercent(r.values[2] ?? null, 2),
              m3: formatPercent(r.values[3] ?? null, 2),
              m6: formatPercent(r.values[6] ?? null, 2),
            }))}
            insight={
              view.avgMonth1 !== null ? (
                <>
                  La retención del mes 1 promedia{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.avgMonth1, 2)}
                  </strong>{' '}
                  entre las {view.visibleCount} cohortes visibles. No es una curva que decae — es una
                  que nunca empieza: el marketplace adquiere bien y no vuelve a ver al cliente.
                </>
              ) : null
            }
          >
            <RetentionHeatmap rows={view.rows} />
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard
              title="Tendencia mensual de ingresos"
              subtitle="Ingresos totales por mes de compra"
              tableColumns={[
                { key: 'month', label: 'Mes' },
                { key: 'revenue', label: 'Ingresos', align: 'right' },
                { key: 'orders', label: 'Pedidos', align: 'right' },
              ]}
              tableRows={view.monthly.map((m) => ({
                month: formatCohort(m.month),
                revenue: formatCurrency(m.revenue),
                orders: formatExact(m.orders),
              }))}
              insight={
                view.peak ? (
                  <>
                    El pico llega en{' '}
                    <strong className="text-[var(--chart-label)]">
                      {formatCohort(view.peak.month)}
                    </strong>
                    . El crecimiento es de adquisición, no de repetición.
                  </>
                ) : null
              }
            >
              <RevenueTrend data={view.monthly} peak={view.peak} />
            </ChartCard>

            <ChartCard
              title="Clientes nuevos por cohorte"
              subtitle="Tamaño de cada cohorte en su mes de adquisición"
              tableColumns={[
                { key: 'cohort', label: 'Cohorte' },
                { key: 'customers', label: 'Clientes', align: 'right' },
              ]}
              tableRows={view.acquisition.map((a) => ({
                cohort: formatCohort(a.cohort),
                customers: formatExact(a.customers),
              }))}
              insight="Cada barra es una cohorte cuya retención se lee en el mapa de calor de arriba."
            >
              <AcquisitionTrend data={view.acquisition} />
            </ChartCard>
          </div>

          <ChartCard
            title="Funnel de recompra"
            subtitle="Cuántos clientes llegan a un segundo, tercer y cuarto pedido"
            height={280}
            tableColumns={[
              { key: 'stage', label: 'Etapa' },
              { key: 'customers', label: 'Clientes', align: 'right' },
              { key: 'conversion', label: 'Conversión', align: 'right' },
            ]}
            tableRows={view.stages.map((s) => ({
              stage: s.label,
              customers: formatExact(s.customers),
              conversion: s.conversion === null ? '—' : formatPercent(s.conversion, 1),
            }))}
            insight={
              view.stages[1]?.conversion !== null && view.stages[2]?.conversion != null ? (
                <>
                  La barrera está entera en el primer paso:{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.stages[1].conversion, 1)}
                  </strong>{' '}
                  llega a una segunda compra, pero de esos{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.stages[2].conversion, 1)}
                  </strong>{' '}
                  sigue a una tercera. Quien vuelve una vez ya se comporta como otro cliente —
                  ganar la segunda compra es el problema, no retener después.
                </>
              ) : null
            }
          >
            <Funnel stages={view.stages} />
          </ChartCard>
        </>
      )}
    </>
  )
}
