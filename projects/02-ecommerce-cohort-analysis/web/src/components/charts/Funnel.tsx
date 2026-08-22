'use client'

import { formatExact, formatPercent } from '@/lib/format'
import type { FunnelStage } from '@/lib/filters'

/**
 * The repeat-purchase funnel, drawn as proportional bars rather than a tapering
 * polygon.
 *
 * A classic funnel shape encodes each stage's size as a trapezoid whose area is
 * not proportional to its value, and here the stages span three orders of
 * magnitude -- 93,358 down to 47. As trapezoids the last three stages are
 * invisible slivers. Bars on a shared baseline keep the comparison honest, and
 * the drop-off is stated in words next to each step because that number, not the
 * absolute count, is what the funnel is read for.
 */
export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.customers ?? 0

  return (
    <div className="h-full flex flex-col justify-center gap-3 px-5 py-2">
      {stages.map((s) => {
        const share = max > 0 ? (s.customers / max) * 100 : 0
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="font-sans text-sm text-[var(--chart-label)]">{s.label}</span>
              <span className="font-sans text-sm tabular-nums text-[var(--chart-label)]">
                {formatExact(s.customers)}
                <span className="text-muted ml-2 text-xs">{formatPercent(share, 1)}</span>
              </span>
            </div>
            <div className="h-3 rounded-sm bg-[var(--chart-grid)] overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{
                  // A minimum width so the 47-customer stage stays visible as a
                  // mark; the number beside it carries the actual value.
                  width: `${Math.max(share, 0.4)}%`,
                  background: 'var(--series-1)',
                }}
              />
            </div>
            {s.conversion !== null && (
              <p className="font-sans text-xs text-muted mt-1">
                {formatPercent(s.conversion, 1)} de quienes llegaron al paso anterior
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
