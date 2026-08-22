'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import staticMeta from '@/data/meta.json'
import { useData } from '@/lib/data'
import type { Filters } from '@/lib/types'
import { FilterBar } from '@/components/FilterBar'

/**
 * Shared chrome for the six /cohorts pages: the nav, and the filter state the
 * pages read.
 *
 * The filters live here rather than in each page because this is a client-side
 * router over a static export -- moving between pages does not reload the
 * document, so state held in a layout survives navigation. That reproduces what
 * Streamlit's `session_state` did across its sidebar pages: narrow the cohort
 * range on the overview, open the geography page, and the range is still narrowed.
 *
 * A hard reload resets to the defaults, which is also what Streamlit did.
 */

export const PAGES = [
  { href: '/cohorts', label: 'Resumen' },
  { href: '/cohorts/retencion', label: 'Retención' },
  { href: '/cohorts/segmentos', label: 'Segmentos' },
  { href: '/cohorts/geografia', label: 'Geografía' },
  { href: '/cohorts/metodologia', label: 'Metodología' },
  { href: '/cohorts/notebooks', label: 'Proceso técnico' },
] as const

/**
 * The default range comes from the statically imported meta, which is why it is
 * correct on the very first render rather than after a fetch: the dataset's first
 * and last month are exactly the first and last cohort (2016-09 to 2018-08), so
 * seeding from `meta` and seeding from `cohorts.json` give the same two strings.
 * The pipeline writes both files, so they cannot drift apart silently.
 */
const DEFAULTS: Filters = {
  cohortStart: staticMeta.date_start.slice(0, 7),
  cohortEnd: staticMeta.date_end.slice(0, 7),
  minCohortSize: 50,
  segments: [],
}

interface FilterContext {
  filters: Filters
  setFilters: (next: Filters) => void
  defaults: Filters
}

const Ctx = createContext<FilterContext | null>(null)

export function useFilters(): FilterContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useFilters must be used inside CohortShell')
  return ctx
}

export function CohortShell({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULTS)
  const value = useMemo(() => ({ filters, setFilters, defaults: DEFAULTS }), [filters])

  return (
    <Ctx.Provider value={value}>
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <CohortNav />
          {children}
          <footer className="border-t border-border dark:border-[#2a2a2a] pt-4 font-sans text-xs text-muted">
            Análisis de Cohortes · Olist E-Commerce · Andrés González Ortega ·{' '}
            {new Intl.NumberFormat('es-MX').format(staticMeta.orders)} pedidos entregados ·{' '}
            {staticMeta.date_start.slice(0, 7)} a {staticMeta.date_end.slice(0, 7)}
          </footer>
        </div>
      </main>
    </Ctx.Provider>
  )
}

function CohortNav() {
  const pathname = usePathname()
  // Pages are exported with trailingSlash, so the live pathname is `/cohorts/`
  // while the hrefs are written without it. Comparing raw strings would leave
  // every tab looking inactive.
  const current = pathname.replace(/\/$/, '') || '/cohorts'

  return (
    <nav aria-label="Secciones del análisis" className="border-b border-border dark:border-[#2a2a2a]">
      <ul className="flex flex-wrap -mb-px">
        {PAGES.map((p) => {
          const active = current === p.href
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-block font-sans text-sm px-3 py-2.5 border-b-2 transition-colors ${
                  active
                    ? 'border-[var(--series-1)] text-[var(--chart-label)]'
                    : 'border-transparent text-muted hover:text-[var(--chart-label)]'
                }`}
              >
                {p.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * The filter row, rendered by the pages that have something to filter.
 *
 * Not rendered by the shell, because the methodology and notebook pages have no
 * numbers on them -- a filter bar there would imply it changes something.
 */
export function CohortFilterBar() {
  const { filters, setFilters, defaults } = useFilters()
  const state = useData(['cohorts', 'segments'] as const)

  // The controls need the cohort list and segment names to populate. Until they
  // arrive the bar is absent rather than empty: a select with no options that
  // then gains 23 is worse than one that appears complete.
  if (state.status !== 'ready') return null

  return (
    <FilterBar
      filters={filters}
      defaults={defaults}
      cohorts={state.data.cohorts.cohorts}
      segments={state.data.segments.by_segment.map((s) => s.segment)}
      onChange={setFilters}
    />
  )
}
