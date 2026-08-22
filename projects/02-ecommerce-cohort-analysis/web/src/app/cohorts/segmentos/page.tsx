'use client'

import { useMemo } from 'react'
import { useData } from '@/lib/data'
import { segmentsSelected } from '@/lib/filters'
import { formatCurrency, formatExact, formatPercent } from '@/lib/format'
import { CohortFilterBar, useFilters } from '@/components/CohortShell'
import { ChartCard } from '@/components/ChartCard'
import { PageHeader } from '@/components/PageHeader'
import { KpiRow } from '@/components/KpiRow'
import {
  hueFor,
  LorenzCurve,
  LtvCurves,
  RfmMap,
  SegmentDistribution,
} from '@/components/charts/SegmentCharts'
import { ActivationPlot, isConclusive, labelFor } from '@/components/charts/ActivationPlot'

export default function SegmentosPage() {
  const { filters } = useFilters()
  const state = useData(['segments', 'activation'] as const)

  const view = useMemo(() => {
    if (state.status !== 'ready') return null
    const { segments, activation } = state.data

    const chosen = segmentsSelected(segments, filters)
    const names = new Set(chosen.map((s) => s.segment))
    const totalRevenue = segments.by_segment.reduce((a, s) => a + s.revenue, 0)
    const totalCustomers = segments.by_segment.reduce((a, s) => a + s.customers, 0)

    const profile = [...chosen]
      .sort((a, b) => b.revenue - a.revenue)
      .map((s) => ({ ...s, revenueShare: totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0 }))

    const champions = segments.by_segment.find((s) => s.segment === 'Alto Valor')
    const largest = [...segments.by_segment].sort((a, b) => b.customers - a.customers)[0]

    // Direction is only claimed where the interval excludes no-effect, so the
    // headline reads off `isConclusive`, not off the p-value alone.
    const conclusive = activation.features.filter(isConclusive)
    const strongest = [...conclusive].sort((a, b) => b.odds_ratio - a.odds_ratio)[0] ?? null
    const weakest = [...conclusive].sort((a, b) => a.odds_ratio - b.odds_ratio)[0] ?? null

    return {
      chosen,
      profile,
      champions,
      largest,
      totalCustomers,
      totalRevenue,
      strongest,
      weakest,
      conclusiveCount: conclusive.length,
      scatter: segments.scatter.filter((p) => names.has(p.segment)),
      ltv: segments.ltv_curves.filter((p) => names.has(p.segment)),
      lorenz: segments.lorenz,
    }
  }, [state, filters])

  return (
    <>
      <PageHeader
        eyebrow="Segmentos"
        title="Quiénes son los que sí vuelven"
        lede="RFM ordena a los clientes por recencia, frecuencia y monto. Con un 3% de recompra la frecuencia casi no varía, así que lo que la segmentación separa aquí es sobre todo recencia y monto de una única compra — y el segmento «Alto Valor» resulta demasiado pequeño para cargar el negocio."
      />

      <CohortFilterBar />

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
          <p className="font-sans text-sm text-muted -mt-3">
            El filtro de segmentos afecta a esta página; el rango de cohortes no, porque la
            segmentación RFM se calcula sobre el estado final de cada cliente y no por su mes de
            adquisición.
          </p>

          <KpiRow
            items={[
              {
                label: 'Segmentos visibles',
                value: `${view.chosen.length} de 7`,
                accent: 'var(--series-1)',
              },
              {
                label: 'Clientes',
                value: formatExact(view.chosen.reduce((a, s) => a + s.customers, 0)),
                accent: 'var(--series-3)',
              },
              {
                label: 'Ingresos',
                value: formatCurrency(view.chosen.reduce((a, s) => a + s.revenue, 0)),
                accent: 'var(--series-2)',
              },
              {
                label: 'Índice de Gini',
                value: view.lorenz.gini.toFixed(3),
                accent: 'var(--series-4)',
                note: 'concentración de ingresos',
              },
            ]}
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard
              title="Tamaño de cada segmento"
              subtitle="Clientes por segmento RFM"
              tableColumns={[
                { key: 'segment', label: 'Segmento' },
                { key: 'customers', label: 'Clientes', align: 'right' },
                { key: 'share', label: '% base', align: 'right' },
              ]}
              tableRows={view.chosen.map((s) => ({
                segment: s.segment,
                customers: formatExact(s.customers),
                share: formatPercent((s.customers / view.totalCustomers) * 100, 1),
              }))}
              insight={
                view.champions && view.largest ? (
                  <>
                    La distribución está invertida respecto a lo que RFM suele mostrar.{' '}
                    <strong className="text-[var(--chart-label)]">{view.largest.segment}</strong>{' '}
                    concentra el{' '}
                    {formatPercent((view.largest.customers / view.totalCustomers) * 100, 0)} de la
                    base y el{' '}
                    {formatPercent((view.largest.revenue / view.totalRevenue) * 100, 0)} de los
                    ingresos, mientras que &laquo;Alto Valor&raquo; —el segmento que en otros
                    negocios sostiene la facturación— son{' '}
                    <strong className="text-[var(--chart-label)]">
                      {formatExact(view.champions.customers)} clientes
                    </strong>{' '}
                    y el {formatPercent((view.champions.revenue / view.totalRevenue) * 100, 1)} del
                    total. No hay un núcleo fiel que proteger: hay que construirlo.
                  </>
                ) : null
              }
            >
              <SegmentDistribution data={view.chosen} />
            </ChartCard>

            <ChartCard
              title="Concentración de ingresos"
              subtitle={`Curva de Lorenz sobre los ${formatExact(view.lorenz.customers)} clientes · Gini ${view.lorenz.gini.toFixed(3)}`}
              tableColumns={[
                { key: 'pop', label: '% clientes', align: 'right' },
                { key: 'rev', label: '% ingresos', align: 'right' },
              ]}
              tableRows={[0, 20, 40, 60, 80, 90, 95, 100].map((pct) => {
                const i = Math.min(
                  view.lorenz.population.length - 1,
                  Math.round((pct / 100) * (view.lorenz.population.length - 1)),
                )
                return {
                  pop: `${pct}%`,
                  rev: formatPercent(view.lorenz.revenue[i] * 100, 1),
                }
              })}
              insight={
                <>
                  El 20% que más gasta concentra el{' '}
                  <strong className="text-[var(--chart-label)]">
                    {formatPercent(view.lorenz.top20_share, 0)}
                  </strong>{' '}
                  de los ingresos. Se calcula sobre toda la base, sin el filtro de segmentos: medir
                  la concentración <em>dentro</em> de un segmento sería otra estadística.
                </>
              }
            >
              <LorenzCurve data={view.lorenz} />
            </ChartCard>
          </div>

          <ChartCard
            title="Mapa RFM"
            subtitle="Recencia contra frecuencia; el área de cada marca es el número de clientes en esa celda. Ejes compartidos entre paneles."
            height={520}
            tableColumns={[
              { key: 'segment', label: 'Segmento' },
              { key: 'recency', label: 'Recencia media', align: 'right' },
              { key: 'orders', label: 'Pedidos medios', align: 'right' },
              { key: 'revenue', label: 'Ingreso medio', align: 'right' },
            ]}
            tableRows={view.chosen.map((s) => ({
              segment: s.segment,
              recency: `${s.avg_recency.toFixed(0)} días`,
              orders: s.avg_orders.toFixed(2),
              revenue: formatCurrency(s.avg_revenue),
            }))}
            insight={
              <>
                La masa está pegada a la línea de un solo pedido. Es la misma historia del funnel,
                vista de lado: la frecuencia casi no varía, así que lo que separa a los segmentos es
                sobre todo la recencia y el monto.
              </>
            }
          >
            <RfmMap data={view.scatter} />
          </ChartCard>

          <ChartCard
            title="Valor de vida por segmento"
            subtitle="Ingreso acumulado promedio por cliente desde su primera compra. Eje vertical compartido entre paneles."
            height={520}
            tableColumns={[
              { key: 'segment', label: 'Segmento' },
              { key: 'customers', label: 'Clientes', align: 'right' },
              { key: 'avg', label: 'Ingreso medio', align: 'right' },
              { key: 'share', label: '% ingresos', align: 'right' },
            ]}
            tableRows={view.profile.map((s) => ({
              segment: s.segment,
              customers: formatExact(s.customers),
              avg: formatCurrency(s.avg_revenue),
              share: formatPercent(s.revenueShare, 1),
            }))}
            insight={
              <>
                Varios paneles son un solo punto, y eso es el hallazgo, no un dato faltante: el
                ingreso acumulado de un cliente sólo cambia en un mes en que vuelve a comprar, así
                que los dos segmentos más grandes —unos 62,000 clientes, casi todos de una sola
                compra— no tienen curva que trazar. El LTV de este marketplace es, en la práctica,
                el valor de la primera compra. Sólo los segmentos pequeños y recurrentes acumulan
                algo con el tiempo, y el eje compartido muestra cuán poco.
              </>
            }
          >
            <LtvCurves data={view.ltv} />
          </ChartCard>

          <ChartCard
            title="Factores de activación"
            subtitle="Odds ratios de una regresión logística sobre la probabilidad de una segunda compra, con intervalos al 95%"
            height={520}
            tableColumns={[
              { key: 'feature', label: 'Variable' },
              { key: 'or', label: 'Odds ratio', align: 'right' },
              { key: 'ci', label: 'IC 95%', align: 'right' },
              { key: 'p', label: 'p', align: 'right' },
            ]}
            tableRows={
              state.status === 'ready'
                ? [...state.data.activation.features]
                    .sort((a, b) => b.odds_ratio - a.odds_ratio)
                    .map((f) => ({
                      feature: labelFor(f.feature),
                      or: f.odds_ratio.toFixed(2),
                      ci:
                        f.ci_lower === null
                          ? '—'
                          : `${(2 ** f.ci_lower).toFixed(2)} – ${(2 ** f.ci_upper).toFixed(2)}`,
                      p: f.p_value < 0.001 ? '< 0.001' : f.p_value.toFixed(3),
                    }))
                : []
            }
            insight={
              view.strongest && view.weakest ? (
                <>
                  De 15 variables, {view.conclusiveCount} tienen un intervalo que no cruza el cero.
                  La más asociada con volver es{' '}
                  <strong className="text-[var(--chart-label)]">
                    {labelFor(view.strongest.feature)}
                  </strong>{' '}
                  (OR {view.strongest.odds_ratio.toFixed(2)}); la más asociada con no volver es{' '}
                  <strong className="text-[var(--chart-label)]">
                    {labelFor(view.weakest.feature)}
                  </strong>{' '}
                  (OR {view.weakest.odds_ratio.toFixed(2)}). Son asociaciones sobre datos
                  observacionales — describen a quién conviene buscar, no qué palanca mover.
                </>
              ) : null
            }
          >
            {state.status === 'ready' && (
              <ActivationPlot features={state.data.activation.features} />
            )}
          </ChartCard>

          <div className="border border-border dark:border-[#2a2a2a] bg-[var(--chart-bg)] rounded-sm px-5 py-4">
            <h2 className="font-serif text-lg text-[var(--chart-label)] mb-2">Qué haría con esto</h2>
            <ul className="font-sans text-sm text-muted leading-relaxed space-y-1.5 list-disc pl-5">
              <li>
                Tratar la segunda compra como el único objetivo de retención. Todo lo demás en el
                funnel convierte razonablemente; ese paso no.
              </li>
              <li>
                Concentrar el esfuerzo en el 20% que ya aporta el{' '}
                {formatPercent(view.lorenz.top20_share, 0)} de los ingresos, en vez de repartirlo
                sobre una base donde el cliente mediano nunca vuelve.
              </li>
              <li>
                Usar las variables del primer pedido — valor, reseña, categoría — para decidir a
                quién contactar, ya que son las únicas señales disponibles antes de que el cliente
                desaparezca.
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  )
}
