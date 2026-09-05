'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import type { TooltipProps } from 'recharts'

/**
 * One tooltip for every chart on the page.
 *
 * Recharts' default renders on a white card with its own type scale, which reads
 * as a foreign object on the dark theme and ignores the page's tokens. This uses
 * the surface and ink tokens so it belongs in both themes, and marks the series
 * with a colour swatch beside the label rather than colouring the text -- text
 * stays in ink, per the charting standard.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: number) => String(v),
  labelFormatter = (l: string) => l,
  only,
}: TooltipProps<number, string> & {
  valueFormatter?: (v: number) => string
  labelFormatter?: (l: string) => string
  /** Restrict to these dataKeys. Recharts has no prop for this -- a chart that
   *  draws 23 faint background lines would otherwise put all 23 in the tooltip
   *  and bury the series the reader is actually pointing at. */
  only?: string[]
}) {
  const tx = useProjectText()
  const rows = only
    ? (payload ?? []).filter((entry) => only.includes(String(entry.dataKey)))
    : (payload ?? [])

  if (!active || rows.length === 0) return null

  return (
    <div
      className="border border-border rounded-sm px-3 py-2 shadow-sm"
      style={{ background: 'var(--chart-bg)' }}
    >
      <p className="font-sans text-xs text-muted mb-1">{tx(labelFormatter(String(label)))}</p>
      <ul className="space-y-0.5">
        {rows.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 font-sans text-sm">
            <span
              aria-hidden
              className="inline-block w-2.5 h-2.5 rounded-[2px] shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-[var(--chart-label)]">{tx(String(entry.name ?? ''))}</span>
            <span className="ml-auto tabular-nums text-[var(--chart-label)] font-medium">
              {valueFormatter(Number(entry.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
