'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import { useMemo } from 'react'
import { useData } from '@/features/cohorts/lib/data'
// Imported rather than fetched: 0.2 KB, and it lets the heading and the dataset
// counts exist in the exported HTML instead of appearing only once the client
// fetch resolves. Written by the same pipeline as the rest.
import staticMeta from '@/features/cohorts/data/meta.json'
import { computeKpis, funnel, retentionPercent, visibleCohortRows } from '@/features/cohorts/lib/filters'
import { formatCohort, formatCurrency, formatExact, formatPercent } from '@/features/cohorts/lib/format'
import { CohortFilterBar, useFilters } from '@/features/cohorts/components/CohortShell'
import { KpiRow } from '@/features/cohorts/components/KpiRow'
import { ChartCard } from '@/features/cohorts/components/ChartCard'
import { RetentionHeatmap } from '@/features/cohorts/components/charts/RetentionHeatmap'
import { AcquisitionTrend, RevenueTrend } from '@/features/cohorts/components/charts/TrendCharts'
import { Funnel } from '@/features/cohorts/components/charts/Funnel'

export default function CohortsPage() {
  const tx = useProjectText()
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
          {tx("Análisis de producto · Olist E-Commerce")}</p>
        <h1 className="font-serif text-2xl md:text-3xl leading-tight">
          {tx("Por qué sólo el 3% vuelve a comprar")}</h1>
        <p className="font-sans text-base text-muted max-w-2xl leading-relaxed">
          {formatExact(staticMeta.orders)} {" " + tx("pedidos entregados y")}{' '}
          {formatExact(staticMeta.customers)} {" " + tx("clientes del marketplace brasileño Olist, entre")}{' '}
          {tx(formatCohort(staticMeta.date_start.slice(0, 7)))} {" " + tx("y")}{' '}
          {tx(formatCohort(staticMeta.date_end.slice(0, 7)))}{tx(". Casi nadie regresa — la pregunta es qué distingue a quienes sí.")}</p>
      </header>

      {state.status === 'error' && (
        <p className="font-sans text-sm text-muted border border-border rounded-sm px-4 py-3">
          {tx("No se pudieron cargar los datos:") + " "}{state.message}
        </p>
      )}

      {!view && state.status !== 'error' && (
        <p className="font-sans text-sm text-muted">{tx("Cargando datos…")}</p>
      )}

      {view && (
        <>
          <CohortFilterBar />

          <KpiRow
            items={[
              {
                label: tx("Clientes únicos"),
                value: formatExact(view.kpis.customers),
                accent: 'var(--series-1)',
              },
              {
                label: tx("Ingresos totales"),
                value: formatCurrency(view.kpis.revenue),
                accent: 'var(--series-3)',
              },
              {
                label: tx("Tasa de recompra"),
                value: formatPercent(view.kpis.repeatRate),
                accent: 'var(--series-2)',
                note: tx("de clientes con 2+ pedidos"),
              },
              {
                label: tx("LTV promedio"),
                value: formatCurrency(view.kpis.avgLtv),
                accent: 'var(--series-4)',
              },
            ]}
          />

          <ChartCard
            title={tx("Retención por cohorte")}
            subtitle={tx("Porcentaje de cada cohorte que vuelve a comprar, por mes desde la primera compra")}
            height={420}
            tableColumns={[
              { key: 'cohort', label: tx("Cohorte") },
              { key: 'size', label: tx("Clientes"), align: 'right' },
              { key: 'm1', label: 'Mes 1', align: 'right' },
              { key: 'm2', label: 'Mes 2', align: 'right' },
              { key: 'm3', label: 'Mes 3', align: 'right' },
              { key: 'm6', label: 'Mes 6', align: 'right' },
            ]}
            tableRows={view.rows.map((r) => ({
              cohort: tx(formatCohort(r.cohort)),
              size: formatExact(r.size),
              m1: formatPercent(r.values[1] ?? null, 2),
              m2: formatPercent(r.values[2] ?? null, 2),
              m3: formatPercent(r.values[3] ?? null, 2),
              m6: formatPercent(r.values[6] ?? null, 2),
            }))}
            insight={
              view.avgMonth1 !== null ? (
                <>
                  {tx("La retención del mes 1 promedia")}{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.avgMonth1, 2)}
                  </strong>{' '}
                  {tx("entre las") + " "}{view.visibleCount} {" " + tx("cohortes visibles. No es una curva que decae — es una que nunca empieza: el marketplace adquiere bien y no vuelve a ver al cliente.")}</>
              ) : null
            }
          >
            <RetentionHeatmap rows={view.rows} />
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard
              title={tx("Tendencia mensual de ingresos")}
              subtitle={tx("Ingresos totales por mes de compra")}
              tableColumns={[
                { key: 'month', label: tx("Mes") },
                { key: 'revenue', label: tx("Ingresos"), align: 'right' },
                { key: 'orders', label: tx("Pedidos"), align: 'right' },
              ]}
              tableRows={view.monthly.map((m) => ({
                month: tx(formatCohort(m.month)),
                revenue: formatCurrency(m.revenue),
                orders: formatExact(m.orders),
              }))}
              insight={
                view.peak ? (
                  <>
                    {tx("El pico llega en")}{' '}
                    <strong className="text-[var(--chart-label)]">
                      {tx(formatCohort(view.peak.month))}
                    </strong>
                    {tx(". El crecimiento es de adquisición, no de repetición.")}</>
                ) : null
              }
            >
              <RevenueTrend data={view.monthly} peak={view.peak} />
            </ChartCard>

            <ChartCard
              title={tx("Clientes nuevos por cohorte")}
              subtitle={tx("Tamaño de cada cohorte en su mes de adquisición")}
              tableColumns={[
                { key: 'cohort', label: tx("Cohorte") },
                { key: 'customers', label: tx("Clientes"), align: 'right' },
              ]}
              tableRows={view.acquisition.map((a) => ({
                cohort: tx(formatCohort(a.cohort)),
                customers: formatExact(a.customers),
              }))}
              insight={tx("Cada barra es una cohorte cuya retención se lee en el mapa de calor de arriba.")}
            >
              <AcquisitionTrend data={view.acquisition} />
            </ChartCard>
          </div>

          <ChartCard
            title={tx("Funnel de recompra")}
            subtitle={tx("Cuántos clientes llegan a un segundo, tercer y cuarto pedido")}
            height={280}
            tableColumns={[
              { key: 'stage', label: tx("Etapa") },
              { key: 'customers', label: tx("Clientes"), align: 'right' },
              { key: 'conversion', label: tx("Conversión"), align: 'right' },
            ]}
            tableRows={view.stages.map((s) => ({
              stage: s.label,
              customers: formatExact(s.customers),
              conversion: s.conversion === null ? '—' : formatPercent(s.conversion, 1),
            }))}
            insight={
              view.stages[1]?.conversion !== null && view.stages[2]?.conversion != null ? (
                <>
                  {tx("La barrera está entera en el primer paso:")}{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.stages[1].conversion, 1)}
                  </strong>{' '}
                  {tx("llega a una segunda compra, pero de esos")}{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.stages[2].conversion, 1)}
                  </strong>{' '}
                  {tx("sigue a una tercera. Quien vuelve una vez ya se comporta como otro cliente — ganar la segunda compra es el problema, no retener después.")}</>
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
