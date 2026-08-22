'use client'

import { RotateCcw } from 'lucide-react'
import type { Filters } from '@/lib/types'
import { formatCohort } from '@/lib/format'

/**
 * The three global filters, in one row above the charts.
 *
 * Same controls the Streamlit sidebar had, and the same semantics -- but placed
 * above the content rather than in a drawer, so what is being excluded is
 * visible at the same time as the numbers it changes.
 */
interface Props {
  filters: Filters
  cohorts: string[]
  segments: string[]
  defaults: Filters
  onChange: (next: Filters) => void
}

export function FilterBar({ filters, cohorts, segments, defaults, onChange }: Props) {
  const isDefault =
    filters.cohortStart === defaults.cohortStart &&
    filters.cohortEnd === defaults.cohortEnd &&
    filters.minCohortSize === defaults.minCohortSize &&
    filters.segments.length === 0

  const toggleSegment = (s: string) =>
    onChange({
      ...filters,
      segments: filters.segments.includes(s)
        ? filters.segments.filter((x) => x !== s)
        : [...filters.segments, s],
    })

  return (
    <div className="border border-border dark:border-[#2a2a2a] bg-[var(--chart-bg)] rounded-sm px-4 py-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-wider text-muted">Cohorte desde</span>
          <select
            value={filters.cohortStart}
            onChange={(e) => onChange({ ...filters, cohortStart: e.target.value })}
            className="font-sans text-sm bg-transparent border border-border dark:border-[#2a2a2a]
                       rounded-sm px-2 py-1.5 text-[var(--chart-label)]"
          >
            {cohorts.map((c) => (
              <option key={c} value={c}>
                {formatCohort(c)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-wider text-muted">hasta</span>
          <select
            value={filters.cohortEnd}
            onChange={(e) => onChange({ ...filters, cohortEnd: e.target.value })}
            className="font-sans text-sm bg-transparent border border-border dark:border-[#2a2a2a]
                       rounded-sm px-2 py-1.5 text-[var(--chart-label)]"
          >
            {cohorts.map((c) => (
              <option key={c} value={c}>
                {formatCohort(c)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[190px]">
          <span className="font-sans text-xs uppercase tracking-wider text-muted">
            Cohorte mínima: <span className="tabular-nums">{filters.minCohortSize}</span> clientes
          </span>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={filters.minCohortSize}
            onChange={(e) => onChange({ ...filters, minCohortSize: Number(e.target.value) })}
            className="accent-[var(--series-1)]"
          />
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="font-sans text-xs uppercase tracking-wider text-muted mb-1">
            Segmentos RFM
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {segments.map((s) => {
              const on = filters.segments.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSegment(s)}
                  className={`font-sans text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                    on
                      ? 'border-[var(--series-1)] text-[var(--chart-label)]'
                      : 'border-border dark:border-[#2a2a2a] text-muted hover:text-[var(--chart-label)]'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </fieldset>

        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(defaults)}
            className="ml-auto inline-flex items-center gap-1.5 font-sans text-xs text-muted
                       hover:text-[var(--chart-label)] transition-colors"
          >
            <RotateCcw size={13} aria-hidden />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
