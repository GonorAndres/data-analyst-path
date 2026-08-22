'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/lib/data'
import {
  averageCurve,
  bestWorstCohorts,
  retentionPercent,
  type RetentionMetric,
} from '@/lib/filters'
import { formatCohort, formatExact, formatPercent } from '@/lib/format'
import { CohortFilterBar, useFilters } from '@/components/CohortShell'
import { ChartCard } from '@/components/ChartCard'
import { PageHeader, Segmented } from '@/components/PageHeader'
import { RetentionHeatmap } from '@/components/charts/RetentionHeatmap'
import { AverageRetentionCurve, CohortComparison } from '@/components/charts/RetentionCurves'
import { SegmentedSurvival, SurvivalChart } from '@/components/charts/SurvivalCurve'

type SurvivalSplit = 'none' | 'payment' | 'state'
type CompareMode = 'extremes' | 'selected'

/** The comparison chart caps coloured lines at three -- see CohortComparison for
 *  the pair-separation measurements that set the number. */
const MAX_SELECTED_COHORTS = 3

export default function RetencionPage() {
  const { filters } = useFilters()
  const state = useData(['cohorts', 'survival'] as const)
  const [metric, setMetric] = useState<RetentionMetric>('customers')
  const [split, setSplit] = useState<SurvivalSplit>('none')
  const [compare, setCompare] = useState<CompareMode>('extremes')
  const [selected, setSelected] = useState<string[]>([])

  const view = useMemo(() => {
    if (state.status !== 'ready') return null
    const rows = retentionPercent(state.data.cohorts, filters, metric)
    return { rows, curve: averageCurve(rows), extremes: bestWorstCohorts(rows) }
  }, [state, filters, metric])

  /**
   * The survival table, whose columns depend on the split.
   *
   * Built here rather than inline so both branches produce the same row shape --
   * as two inline branches TypeScript infers a union whose members each carry the
   * other's keys as `undefined`, which no table can accept.
   */
  const survivalTable = useMemo(() => {
    if (state.status !== 'ready') return { columns: [], rows: [] }
    const s = state.data.survival
    const groups = split === 'payment' ? s.by_payment : split === 'state' ? s.by_state : null

    // Every fourth grid point: 4-weekly steps read as a table, weekly does not.
    const sampled = s.days.map((day, i) => ({ day, i })).filter(({ i }) => i % 4 === 0)

    if (!groups) {
      return {
        columns: [
          { key: 'day', label: 'Día' },
          { key: 's', label: 'S(t)', align: 'right' as const },
          { key: 'ci', label: 'IC 95%', align: 'right' as const },
        ],
        rows: sampled.map(({ day, i }) => ({
          day,
          s: formatPercent(s.survival[i] * 100, 2),
          ci: `${(s.ci_lower[i] * 100).toFixed(2)} – ${(s.ci_upper[i] * 100).toFixed(2)}%`,
        })) as Record<string, string | number>[],
      }
    }

    return {
      columns: [
        { key: 'day', label: 'Día' },
        ...groups.map((g) => ({ key: g.group, label: g.group, align: 'right' as const })),
      ],
      rows: sampled.map(({ day, i }) => ({
        day,
        ...Object.fromEntries(groups.map((g) => [g.group, formatPercent(g.survival[i] * 100, 2)])),
      })) as Record<string, string | number>[],
    }
  }, [state, split])

  /** The comparison table, whose columns follow the mode for the same reason
   *  `survivalTable` exists: two inline branches infer an unusable union. */
  const comparisonTable = useMemo(() => {
    if (!view) return { columns: [], rows: [] }
    const byCohort = new Map(view.rows.map((r) => [r.cohort, r]))
    const shown =
      compare === 'extremes'
        ? view.extremes
          ? [
              { key: 'best', label: `Mejor · ${formatCohort(view.extremes.best)}`, cohort: view.extremes.best },
              { key: 'worst', label: `Peor · ${formatCohort(view.extremes.worst)}`, cohort: view.extremes.worst },
            ]
          : []
        : selected
            .slice(0, MAX_SELECTED_COHORTS)
            .map((c) => ({ key: c, label: formatCohort(c), cohort: c }))

    return {
      columns: [
        { key: 'month', label: 'Mes' },
        ...shown.map((s) => ({ key: s.key, label: s.label, align: 'right' as const })),
        { key: 'mean', label: 'Promedio', align: 'right' as const },
      ],
      rows: view.curve.map((p) => ({
        month: p.month,
        ...Object.fromEntries(
          shown.map((s) => [s.key, formatPercent(byCohort.get(s.cohort)?.values[p.month] ?? null, 2)]),
        ),
        mean: formatPercent(p.mean, 2),
      })) as Record<string, string | number>[],
    }
  }, [view, compare, selected])

  const unit = metric === 'customers' ? 'clientes' : 'ingresos'

  const toggleSelected = (cohort: string) => {
    setCompare('selected')
    setSelected((prev) =>
      prev.includes(cohort)
        ? prev.filter((c) => c !== cohort)
        : // Drops the oldest rather than refusing the click: a capped
          // multi-select that silently ignores you reads as broken.
          [...prev, cohort].slice(-MAX_SELECTED_COHORTS),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Retención"
        title="Qué tan rápido desaparece una cohorte"
        lede="Cada cohorte agrupa a los clientes por el mes de su primera compra. Seguirlas mes a mes separa el efecto de la antigüedad del efecto del calendario: si la retención de todas cae igual de rápido, el problema es el producto, no el momento."
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

      {view && state.status === 'ready' && (
        <>
          <Segmented
            label="Métrica de retención"
            value={metric}
            onChange={(v) => setMetric(v as RetentionMetric)}
            options={[
              { value: 'customers', label: 'Por clientes' },
              { value: 'revenue', label: 'Por ingresos' },
            ]}
          />

          <ChartCard
            title={`Mapa de calor de retención — por ${unit}`}
            subtitle={`Porcentaje de ${unit} de cada cohorte que reaparece en cada mes posterior`}
            height={460}
            tableColumns={[
              { key: 'cohort', label: 'Cohorte' },
              { key: 'size', label: 'Clientes', align: 'right' },
              ...[1, 2, 3, 4, 5, 6].map((m) => ({
                key: `m${m}`,
                label: `Mes ${m}`,
                align: 'right' as const,
              })),
            ]}
            tableRows={view.rows.map((r) => ({
              cohort: formatCohort(r.cohort),
              size: formatExact(r.size),
              ...Object.fromEntries(
                [1, 2, 3, 4, 5, 6].map((m) => [`m${m}`, formatPercent(r.values[m] ?? null, 2)]),
              ),
            }))}
            insight={
              <>
                Las celdas vacías no son ceros: son meses que la cohorte todavía no ha vivido. Una
                cohorte de {formatCohort(filters.cohortEnd)} no puede tener un mes 12 en un dataset
                que termina ahí, y pintarla como 0% de retención sería inventar una caída.
              </>
            }
          >
            <RetentionHeatmap rows={view.rows} />
          </ChartCard>

          <ChartCard
            title="Curva promedio de retención"
            subtitle="Promedio de las cohortes visibles con intervalo de confianza al 95%, sobre las cohortes individuales"
            height={400}
            tableColumns={[
              { key: 'month', label: 'Mes' },
              { key: 'mean', label: 'Promedio', align: 'right' },
              { key: 'ci', label: 'IC 95%', align: 'right' },
              { key: 'n', label: 'Cohortes', align: 'right' },
            ]}
            tableRows={view.curve.map((p) => ({
              month: p.month,
              mean: formatPercent(p.mean, 2),
              ci: `${p.ciLower.toFixed(2)} – ${p.ciUpper.toFixed(2)}%`,
              n: p.n,
            }))}
            insight={
              <>
                La columna <em>Cohortes</em> de la tabla cae conforme avanza el mes: el promedio del
                mes 12 se calcula sobre las cohortes con edad suficiente para tenerlo, no sobre
                todas. El intervalo mide la dispersión <em>entre</em> cohortes — dice si todas se
                comportan igual, no cuánto error muestral tiene una sola.
              </>
            }
          >
            <AverageRetentionCurve curve={view.curve} rows={view.rows} />
          </ChartCard>

          <Segmented
            label="Comparar"
            value={compare}
            onChange={(v) => setCompare(v as CompareMode)}
            options={[
              { value: 'extremes', label: 'Mejor vs peor' },
              { value: 'selected', label: `Cohortes elegidas (${selected.length}/${MAX_SELECTED_COHORTS})` },
            ]}
          />

          {view.extremes && (
            <ChartCard
              title={compare === 'extremes' ? 'Mejor contra peor cohorte' : 'Cohortes elegidas'}
              subtitle={
                compare === 'extremes'
                  ? 'Retención acumulada de los meses 1 a 6, contra el promedio'
                  : `Hasta ${MAX_SELECTED_COHORTS} cohortes contra el promedio`
              }
              height={400}
              tableColumns={comparisonTable.columns}
              tableRows={comparisonTable.rows}
              insight={
                <>
                  Sólo compiten las cohortes con los seis meses completos. Sin esa condición la peor
                  cohorte siempre sería la más reciente, que no ha tenido tiempo de retener a nadie —
                  un artefacto del corte del dataset, no un hallazgo.
                </>
              }
            >
              <CohortComparison
                rows={view.rows}
                curve={view.curve}
                best={compare === 'extremes' ? view.extremes.best : null}
                worst={compare === 'extremes' ? view.extremes.worst : null}
                selected={selected}
              />
            </ChartCard>
          )}

          <fieldset className="border border-border dark:border-[#2a2a2a] bg-[var(--chart-bg)] rounded-sm px-4 py-3">
            <legend className="font-sans text-xs uppercase tracking-wider text-muted px-1">
              Elegir cohortes ({selected.length}/{MAX_SELECTED_COHORTS})
            </legend>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {view.rows.map((r) => {
                const on = selected.includes(r.cohort)
                return (
                  <button
                    key={r.cohort}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSelected(r.cohort)}
                    className={`font-sans text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                      on
                        ? 'border-[var(--series-1)] text-[var(--chart-label)]'
                        : 'border-border dark:border-[#2a2a2a] text-muted hover:text-[var(--chart-label)]'
                    }`}
                  >
                    {formatCohort(r.cohort)}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Segmented
            label="Supervivencia — segmentar por"
            value={split}
            onChange={(v) => setSplit(v as SurvivalSplit)}
            options={[
              { value: 'none', label: 'Sin segmentar' },
              { value: 'payment', label: 'Medio de pago' },
              { value: 'state', label: 'Estado' },
            ]}
          />

          <ChartCard
            title="Curva de supervivencia Kaplan-Meier"
            subtitle="Probabilidad de que un cliente aún NO haya hecho su segunda compra"
            height={420}
            tableColumns={survivalTable.columns}
            tableRows={survivalTable.rows}
            insight={
              <>
                La curva cae {formatPercent((1 - state.data.survival.survival.at(-1)!) * 100, 1)} en
                dos años y nunca llega al 50%, así que la mediana de supervivencia no existe — con
                ~97% de compradores únicos, el evento que mediría casi nunca ocurre. Lo que sí se
                lee es el <em>ritmo</em>: se pierde 1.23 pp en el primer trimestre y alrededor de
                0.6 pp en cada trimestre siguiente. La recompra se desacelera al doble, pero{' '}
                <strong className="text-[var(--chart-label)]">no se detiene</strong>: sigue
                ocurriendo a lo largo de los dos años. Es lo contrario de lo que solía afirmar la
                versión anterior de este tablero, que daba la probabilidad de retorno por nula
                después de seis meses; la curva no dice eso. El ensanchamiento del intervalo a
                partir del día 540 es el conjunto en riesgo adelgazándose, no una recaída.
              </>
            }
          >
            {split === 'none' ? (
              <SurvivalChart data={state.data.survival} />
            ) : (
              <SegmentedSurvival
                days={state.data.survival.days}
                overall={state.data.survival.survival}
                groups={
                  split === 'payment'
                    ? state.data.survival.by_payment
                    : state.data.survival.by_state
                }
              />
            )}
          </ChartCard>
        </>
      )}
    </>
  )
}
