'use client'

/**
 * The four headline figures.
 *
 * These are hero numbers, not charts: each is a single value whose job is to be
 * read, so a chart form would add ink without adding information. The coloured
 * rule carries no data -- it is a card accent, which is why the value itself
 * stays in ink.
 */
interface Kpi {
  label: string
  value: string
  accent: string
  note?: string
}

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((k) => (
        <div
          key={k.label}
          className="border border-border bg-[var(--chart-bg)] rounded-sm px-4 py-3"
        >
          <span aria-hidden className="block h-0.5 w-8 mb-2.5" style={{ background: k.accent }} />
          <dt className="font-sans text-xs uppercase tracking-wider text-muted">{k.label}</dt>
          <dd className="font-serif text-3xl mt-1 tabular-nums text-[var(--chart-label)]">
            {k.value}
          </dd>
          {k.note && <p className="font-sans text-xs text-muted mt-1">{k.note}</p>}
        </div>
      ))}
    </dl>
  )
}
