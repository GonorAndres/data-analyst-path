'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import { useMemo, useState } from 'react'
import { useData } from '@/features/cohorts/lib/data'
import { linearFit, stateRetentionCurves, statesInRange } from '@/features/cohorts/lib/filters'
import { formatCurrency, formatExact, formatPercent } from '@/features/cohorts/lib/format'
import { CohortFilterBar, useFilters } from '@/features/cohorts/components/CohortShell'
import { ChartCard } from '@/features/cohorts/components/ChartCard'
import { PageHeader } from '@/features/cohorts/components/PageHeader'
import { KpiRow } from '@/features/cohorts/components/KpiRow'
import {
  DeliveryScatter,
  MAX_COMPARED_STATES,
  StateRanking,
  StateRetentionCurves,
} from '@/features/cohorts/components/charts/GeoCharts'

/** States carrying enough customers for a retention rate to mean anything --
 *  the same floor the pipeline applied when emitting the curves. */
const MIN_CUSTOMERS = 100

export default function GeografiaPage() {
  const tx = useProjectText()
  const { filters } = useFilters()
  const state = useData(['geography'] as const)
  const [selected, setSelected] = useState<string[] | null>(null)

  const view = useMemo(() => {
    if (state.status !== 'ready') return null
    const states = statesInRange(state.data.geography, filters)
    if (states.length === 0) return null

    const eligible = states.filter((s) => s.customers >= MIN_CUSTOMERS)
    const ranked = [...states].sort((a, b) => b.repeatPct - a.repeatPct)

    // The median over every state, not just the selected ones -- it is the
    // national reference the ranking is read against, so narrowing the selection
    // must not move the line.
    const rates = [...states].map((s) => s.repeatPct).sort((a, b) => a - b)
    const mid = Math.floor(rates.length / 2)
    const median =
      rates.length % 2 === 0 ? (rates[mid - 1] + rates[mid]) / 2 : rates[mid]

    const fit = linearFit(
      eligible
        .filter((s) => s.deliveryDays !== null)
        .map((s) => ({ x: s.deliveryDays as number, y: s.repeatPct })),
    )

    const defaultStates = states.slice(0, MAX_COMPARED_STATES).map((s) => s.state)
    const active = (selected ?? defaultStates).filter((s) =>
      states.some((x) => x.state === s),
    )
    const curveStates = active.length > 0 ? active : defaultStates

    return {
      states,
      eligible,
      median,
      fit,
      best: ranked[0],
      worst: ranked[ranked.length - 1],
      defaultStates,
      active: curveStates,
      table: states.filter((s) => curveStates.includes(s.state)),
      curves: stateRetentionCurves(state.data.geography, filters, curveStates),
    }
  }, [state, filters, selected])

  const toggle = (code: string) =>
    setSelected((prev) => {
      const base = prev ?? view?.defaultStates ?? []
      if (base.includes(code)) return base.filter((c) => c !== code)
      // Drops the oldest rather than refusing the click: a capped multi-select
      // that silently ignores you reads as broken.
      return [...base, code].slice(-MAX_COMPARED_STATES)
    })

  return (
    <>
      <PageHeader
        eyebrow={tx("Geografía")}
        title={tx("Brasil no es un solo mercado")}
        lede={tx("Un país de dimensiones continentales con logística muy desigual. Si la entrega influye en que un cliente vuelva, la señal debería verse entre estados — y se ve, aunque no tan fuerte como sería cómodo.")}
      />

      <CohortFilterBar />

      {state.status === 'error' && (
        <p className="font-sans text-sm text-muted border border-border rounded-sm px-4 py-3">
          {tx("No se pudieron cargar los datos:") + " "}{state.message}
        </p>
      )}
      {state.status === 'loading' && (
        <p className="font-sans text-sm text-muted">{tx("Cargando datos…")}</p>
      )}

      {!view && state.status === 'ready' && (
        <>
          <CohortFilterBar />
          <p className="rounded-md border border-border p-4 text-muted" role="status">{tx('Sin datos para los filtros seleccionados')}</p>
        </>
      )}

      {view && (
        <>
          <KpiRow
            items={[
              {
                label: tx("Estados cubiertos"),
                value: String(view.states.length),
                accent: 'var(--series-1)',
                note: ("" + (view.eligible.length) + " " + tx("con 100+ clientes")),
              },
              {
                label: tx("Mediana de recompra"),
                value: formatPercent(view.median, 2),
                accent: 'var(--series-2)',
              },
              {
                label: tx("Mejor estado"),
                value: `${view.best.state} · ${view.best.repeatPct.toFixed(1)}%`,
                accent: 'var(--series-3)',
              },
              {
                label: tx("Correlación entrega–recompra"),
                value: view.fit ? `r = ${view.fit.r.toFixed(3)}` : '—',
                accent: 'var(--series-4)',
                note: ("" + (view.eligible.length) + " " + tx("estados")),
              },
            ]}
          />

          <ChartCard
            title={tx("Recompra por estado")}
            subtitle={tx("Todos los estados, contra la mediana nacional")}
            height={Math.max(320, view.states.length * 22)}
            tableColumns={[
              { key: 'state', label: tx("Estado") },
              { key: 'customers', label: tx("Clientes"), align: 'right' },
              { key: 'repeat', label: tx("Recompra"), align: 'right' },
              { key: 'delivery', label: tx("Entrega"), align: 'right' },
            ]}
            tableRows={[...view.states]
              .sort((a, b) => b.repeatPct - a.repeatPct)
              .map((s) => ({
                state: s.state,
                customers: formatExact(s.customers),
                repeat: formatPercent(s.repeatPct, 2),
                delivery: s.deliveryDays === null ? '—' : `${s.deliveryDays.toFixed(1)} d`,
              }))}
            insight={
              <>
                {tx("El rango va de") + " "}{formatPercent(view.worst.repeatPct, 1)} ({view.worst.state}{tx(") a")}{' '}
                {formatPercent(view.best.repeatPct, 1)} ({view.best.state}{tx(") — pero los extremos son estados pequeños, donde unos pocos clientes mueven el porcentaje varios puntos. La lectura seria está en el gráfico de abajo, que pondera por tamaño.")}</>
            }
          >
            <StateRanking data={view.states} median={view.median} />
          </ChartCard>

          <fieldset className="border border-border bg-[var(--chart-bg)] rounded-sm px-4 py-3">
            <legend className="font-sans text-xs uppercase tracking-wider text-muted px-1">
              {tx("Comparar estados (")}{view.active.length}/{MAX_COMPARED_STATES})
            </legend>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {view.states.map((s) => {
                const on = view.active.includes(s.state)
                return (
                  <button
                    key={s.state}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.state)}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                      on
                        ? 'border-[var(--series-1)] text-[var(--chart-label)]'
                        : 'border-border text-muted hover:text-[var(--chart-label)]'
                    }`}
                  >
                    {s.state}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <ChartCard
            title={tx("Curvas de retención por estado")}
            subtitle={tx("Porcentaje de los clientes de cada estado que reaparece, mes a mes")}
            height={400}
            tableColumns={[
              { key: 'state', label: tx("Estado") },
              { key: 'customers', label: tx("Clientes"), align: 'right' },
              { key: 'orders', label: tx("Pedidos"), align: 'right' },
              { key: 'aov', label: tx("Ticket medio"), align: 'right' },
              { key: 'review', label: tx("Reseña"), align: 'right' },
              { key: 'delivery', label: tx("Entrega"), align: 'right' },
            ]}
            tableRows={view.table.map((s) => ({
              state: s.state,
              customers: formatExact(s.customers),
              orders: formatExact(s.orders),
              aov: formatCurrency(s.aov),
              review: s.review === null ? '—' : s.review.toFixed(2),
              delivery: s.deliveryDays === null ? '—' : `${s.deliveryDays.toFixed(1)} d`,
            }))}
            insight={
              <>
                {tx("Hasta tres estados a la vez: es el máximo que la paleta distingue de forma fiable para cualquier par, incluida la visión con daltonismo. Las curvas caen todas al mismo sitio — ningún estado retiene de forma estructuralmente distinta, lo que apunta a que el problema no es regional.")}</>
            }
          >
            <StateRetentionCurves data={view.curves} states={view.active} />
          </ChartCard>

          <ChartCard
            title={tx("Tiempo de entrega contra recompra")}
            subtitle={
              view.fit
                ? (tx("Un punto por estado, área proporcional al número de clientes · r =") + " " + (view.fit.r.toFixed(3)) + "")
                : tx("Un punto por estado, área proporcional al número de clientes")
            }
            height={460}
            tableColumns={[
              { key: 'state', label: tx("Estado") },
              { key: 'delivery', label: tx("Entrega"), align: 'right' },
              { key: 'repeat', label: tx("Recompra"), align: 'right' },
              { key: 'customers', label: tx("Clientes"), align: 'right' },
            ]}
            tableRows={[...view.eligible]
              .sort((a, b) => (a.deliveryDays ?? 0) - (b.deliveryDays ?? 0))
              .map((s) => ({
                state: s.state,
                delivery: s.deliveryDays === null ? '—' : `${s.deliveryDays.toFixed(1)} d`,
                repeat: formatPercent(s.repeatPct, 2),
                customers: formatExact(s.customers),
              }))}
            insight={
              view.fit ? (
                <>
                  {tx("La correlación es")}{' '}
                  <strong className="text-[var(--chart-label)]">
                    r = {view.fit.r.toFixed(3)}
                  </strong>
                  {view.fit.r < -0.1
                    ? tx(" — negativa y en la dirección esperada: donde se entrega más rápido se recompra algo más. ")
                    : tx(" — demasiado débil para sostener que la entrega explique la recompra. ")}
                  {tx("Con") + " "}{view.eligible.length} {" " + tx("estados como unidades de observación esto es una asociación descriptiva; no separa la logística de todo lo demás que distingue a São Paulo del norte del país.")}</>
              ) : null
            }
          >
            <DeliveryScatter data={view.eligible} fit={view.fit} />
          </ChartCard>
        </>
      )}
    </>
  )
}
