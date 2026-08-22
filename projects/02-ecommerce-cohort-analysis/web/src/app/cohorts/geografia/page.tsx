'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/lib/data'
import { linearFit, stateRetentionCurves, statesInRange } from '@/lib/filters'
import { formatCurrency, formatExact, formatPercent } from '@/lib/format'
import { CohortFilterBar, useFilters } from '@/components/CohortShell'
import { ChartCard } from '@/components/ChartCard'
import { PageHeader } from '@/components/PageHeader'
import { KpiRow } from '@/components/KpiRow'
import {
  DeliveryScatter,
  MAX_COMPARED_STATES,
  StateRanking,
  StateRetentionCurves,
} from '@/components/charts/GeoCharts'

/** States carrying enough customers for a retention rate to mean anything --
 *  the same floor the pipeline applied when emitting the curves. */
const MIN_CUSTOMERS = 100

export default function GeografiaPage() {
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
        eyebrow="Geografía"
        title="Brasil no es un solo mercado"
        lede="Un país de dimensiones continentales con logística muy desigual. Si la entrega influye en que un cliente vuelva, la señal debería verse entre estados — y se ve, aunque no tan fuerte como sería cómodo."
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
          <KpiRow
            items={[
              {
                label: 'Estados cubiertos',
                value: String(view.states.length),
                accent: 'var(--series-1)',
                note: `${view.eligible.length} con 100+ clientes`,
              },
              {
                label: 'Mediana de recompra',
                value: formatPercent(view.median, 2),
                accent: 'var(--series-2)',
              },
              {
                label: 'Mejor estado',
                value: `${view.best.state} · ${view.best.repeatPct.toFixed(1)}%`,
                accent: 'var(--series-3)',
              },
              {
                label: 'Correlación entrega–recompra',
                value: view.fit ? `r = ${view.fit.r.toFixed(3)}` : '—',
                accent: 'var(--series-4)',
                note: `${view.eligible.length} estados`,
              },
            ]}
          />

          <ChartCard
            title="Recompra por estado"
            subtitle="Todos los estados, contra la mediana nacional"
            height={Math.max(320, view.states.length * 22)}
            tableColumns={[
              { key: 'state', label: 'Estado' },
              { key: 'customers', label: 'Clientes', align: 'right' },
              { key: 'repeat', label: 'Recompra', align: 'right' },
              { key: 'delivery', label: 'Entrega', align: 'right' },
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
                El rango va de {formatPercent(view.worst.repeatPct, 1)} ({view.worst.state}) a{' '}
                {formatPercent(view.best.repeatPct, 1)} ({view.best.state}) — pero los extremos son
                estados pequeños, donde unos pocos clientes mueven el porcentaje varios puntos. La
                lectura seria está en el gráfico de abajo, que pondera por tamaño.
              </>
            }
          >
            <StateRanking data={view.states} median={view.median} />
          </ChartCard>

          <fieldset className="border border-border dark:border-[#2a2a2a] bg-[var(--chart-bg)] rounded-sm px-4 py-3">
            <legend className="font-sans text-xs uppercase tracking-wider text-muted px-1">
              Comparar estados ({view.active.length}/{MAX_COMPARED_STATES})
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
                        : 'border-border dark:border-[#2a2a2a] text-muted hover:text-[var(--chart-label)]'
                    }`}
                  >
                    {s.state}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <ChartCard
            title="Curvas de retención por estado"
            subtitle="Porcentaje de los clientes de cada estado que reaparece, mes a mes"
            height={400}
            tableColumns={[
              { key: 'state', label: 'Estado' },
              { key: 'customers', label: 'Clientes', align: 'right' },
              { key: 'orders', label: 'Pedidos', align: 'right' },
              { key: 'aov', label: 'Ticket medio', align: 'right' },
              { key: 'review', label: 'Reseña', align: 'right' },
              { key: 'delivery', label: 'Entrega', align: 'right' },
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
                Hasta tres estados a la vez: es el máximo que la paleta distingue de forma fiable
                para cualquier par, incluida la visión con daltonismo. Las curvas caen todas al
                mismo sitio — ningún estado retiene de forma estructuralmente distinta, lo que
                apunta a que el problema no es regional.
              </>
            }
          >
            <StateRetentionCurves data={view.curves} states={view.active} />
          </ChartCard>

          <ChartCard
            title="Tiempo de entrega contra recompra"
            subtitle={
              view.fit
                ? `Un punto por estado, área proporcional al número de clientes · r = ${view.fit.r.toFixed(3)}`
                : 'Un punto por estado, área proporcional al número de clientes'
            }
            height={460}
            tableColumns={[
              { key: 'state', label: 'Estado' },
              { key: 'delivery', label: 'Entrega', align: 'right' },
              { key: 'repeat', label: 'Recompra', align: 'right' },
              { key: 'customers', label: 'Clientes', align: 'right' },
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
                  La correlación es{' '}
                  <strong className="text-[var(--chart-label)]">
                    r = {view.fit.r.toFixed(3)}
                  </strong>
                  {view.fit.r < -0.1
                    ? ' — negativa y en la dirección esperada: donde se entrega más rápido se recompra algo más. '
                    : ' — demasiado débil para sostener que la entrega explique la recompra. '}
                  Con {view.eligible.length} estados como unidades de observación esto es una
                  asociación descriptiva; no separa la logística de todo lo demás que distingue a
                  São Paulo del norte del país.
                </>
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
