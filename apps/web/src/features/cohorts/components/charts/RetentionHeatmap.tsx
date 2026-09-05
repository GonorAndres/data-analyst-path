'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import { useState } from 'react'
import { formatCohort, formatExact } from '@/features/cohorts/lib/format'

/**
 * Cohort retention, drawn as a grid rather than with a chart library.
 *
 * A heatmap is a magnitude encoding on two categorical axes, which is exactly a
 * table of coloured cells -- Recharts has no such mark, and forcing one out of a
 * scatter costs more than it returns.
 *
 * The ramp is sequential: one hue, light to dark, monotonic in lightness. Cells
 * are separated by a 2px surface gap so adjacent values stay distinguishable
 * where the ramp is shallow, and each cell carries its own hover tooltip.
 *
 * Month 0 is omitted. It is 100% for every cohort by construction, so a column
 * of identical dark cells would dominate the ramp and compress the range that
 * actually varies.
 */
interface Row {
  cohort: string
  size: number
  values: (number | null)[]
}

const RAMP = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)', 'var(--heat-5)']

/** Retention past month 0 is single-digit here, so the breaks are tuned to that
 *  range; a linear 0-100 scale would render the whole grid as one flat colour. */
const BREAKS = [0.5, 1.5, 3, 5, 8]

function colorFor(v: number | null): string {
  if (v === null) return 'transparent'
  let i = 0
  while (i < BREAKS.length && v >= BREAKS[i]) i++
  return RAMP[i]
}

export function RetentionHeatmap({ rows, maxMonths = 12 }: { rows: Row[]; maxMonths?: number }) {
  const tx = useProjectText()
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)

  if (rows.length === 0) {
    return (
      <p className="font-sans text-sm text-muted p-6">
        {tx("Ningún cohorte cumple los filtros actuales. Baja el tamaño mínimo de cohorte.")}</p>
    )
  }

  const months = Array.from({ length: maxMonths }, (_, i) => i + 1)

  return (
    <div className="h-full overflow-auto px-3 pb-1">
      <div className="max-w-full overflow-x-auto"><table className="border-separate" style={{ borderSpacing: 2 }}>
        <caption className="sr-only">
          {tx("Porcentaje de clientes de cada cohorte que vuelve a comprar en los meses siguientes")}</caption>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              {tx("Cohorte")}</th>
            <th
              scope="col"
              className="font-sans text-[11px] font-normal text-muted text-right pr-2 sticky left-0"
              style={{ background: 'var(--chart-bg)' }}
            >
              n
            </th>
            {months.map((m) => (
              <th
                key={m}
                scope="col"
                className="font-sans text-[11px] font-normal text-muted w-9 text-center"
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row.cohort}>
              <th
                scope="row"
                className="font-sans text-[11px] font-normal text-muted whitespace-nowrap pr-2 text-right sticky left-0"
                style={{ background: 'var(--chart-bg)' }}
              >
                {tx(formatCohort(row.cohort))}
              </th>
              <td className="font-sans text-[11px] text-muted tabular-nums text-right pr-2">
                {formatExact(row.size)}
              </td>
              {months.map((m, c) => {
                const v = row.values[m] ?? null
                const isHover = hover?.r === r && hover?.c === c
                return (
                  <td
                    key={m}
                    className="relative w-9 h-7 rounded-[2px] text-center align-middle"
                    style={{
                      background: colorFor(v),
                      // A ring rather than a border: a border would shift the
                      // cell and make the grid jitter on hover.
                      boxShadow: isHover ? '0 0 0 2px var(--chart-label)' : undefined,
                    }}
                    onMouseEnter={() => setHover({ r, c })}
                    onMouseLeave={() => setHover(null)}
                  >
                    {v !== null && v >= 3 && (
                      <span className="font-sans text-[10px] tabular-nums text-[var(--heat-0)]">
                        {v.toFixed(1)}
                      </span>
                    )}
                    {isHover && v !== null && (
                      <div
                        role="tooltip"
                        className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap
                                   border border-border rounded-sm px-2 py-1 shadow-sm"
                        style={{ background: 'var(--chart-bg)' }}
                      >
                        <span className="font-sans text-xs text-[var(--chart-label)]">
                          {tx(formatCohort(row.cohort))} {" " + tx("· mes") + " "}{m} ·{' '}
                          <strong className="tabular-nums">{v.toFixed(2)}%</strong>
                        </span>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table></div>

      <div className="flex items-center gap-2 mt-3 pl-1">
        <span className="font-sans text-[11px] text-muted">{tx("menor retención")}</span>
        {RAMP.map((c) => (
          <span
            key={c}
            aria-hidden
            className="inline-block w-6 h-3 rounded-[2px]"
            style={{ background: c }}
          />
        ))}
        <span className="font-sans text-[11px] text-muted">{tx("mayor")}</span>
      </div>
    </div>
  )
}
