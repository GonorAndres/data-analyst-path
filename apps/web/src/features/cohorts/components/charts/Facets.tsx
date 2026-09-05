'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

/**
 * Small multiples: one panel per series, on shared scales.
 *
 * This exists because of a measured limit, not a preference. Running the
 * palette validator over every *pair* of the seven categorical hues -- not just
 * neighbouring pairs -- fails: `#4F46E5` against `#7C3AED` is ΔE 7.5 to normal
 * vision and 1.3 under protanopia, and `#7C3AED` against `#2563EB` is ΔE 0.4
 * under deuteranopia. Adjacent-pair separation, which the palette was chosen for,
 * only governs a chart where a reader compares neighbours in a legend order. It
 * says nothing about a chart with seven lines on it, where any two can be the
 * pair someone is trying to tell apart.
 *
 * Replacing the palette does not fix this: even Okabe-Ito, designed for colour
 * vision deficiency, only clears all-pairs separation with a WARN. Seven
 * simultaneously distinguishable hues is close to the ceiling of what colour can
 * do. So the fix is structural -- one hue per panel means no two hues ever have
 * to be told apart, and the panel heading carries identity instead of colour.
 *
 * It is also the better chart. Seven near-flat LTV curves on one axis is a
 * spaghetti plot; seven translucent scatter clouds hide exactly the regions they
 * are meant to show.
 *
 * The scales must be shared, or the panels compare nothing -- each `children`
 * chart is expected to be handed explicit, identical domains by its caller.
 */
export function FacetGrid({
  panels,
  height = 150,
  columns = 3,
}: {
  panels: { key: string; label: string; sublabel?: string; hue?: string; chart: React.ReactNode }[]
  height?: number
  columns?: 2 | 3
}) {
  const tx = useProjectText()
  return (
    <div
      className={`h-full overflow-y-auto grid gap-x-4 gap-y-3 px-3 pb-2 ${
        columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {panels.map((p) => (
        <figure key={p.key} className="min-w-0">
          <figcaption className="flex items-baseline gap-2 mb-0.5">
            {p.hue && (
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ background: p.hue }}
              />
            )}
            <span className="font-sans text-xs font-medium text-[var(--chart-label)] truncate">
              {tx(p.label)}
            </span>
            {p.sublabel && (
              <span className="font-sans text-[11px] text-muted tabular-nums ml-auto shrink-0">
                {p.sublabel}
              </span>
            )}
          </figcaption>
          <div style={{ height }}>{p.chart}</div>
        </figure>
      ))}
    </div>
  )
}
