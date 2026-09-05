'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import { useId } from 'react'

/** Section heading and its framing sentence, shared by the five inner pages. */
export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede: string
}) {
  const tx = useProjectText()
  return (
    <header className="space-y-2">
      <p className="font-sans text-xs tracking-widest uppercase text-muted">{tx(eyebrow)}</p>
      <h1 className="font-serif text-3xl md:text-4xl leading-tight">{tx(title)}</h1>
      <p className="font-sans text-base text-muted max-w-2xl leading-relaxed">{tx(lede)}</p>
    </header>
  )
}

/**
 * A one-of-N control, as a radio group rather than a row of buttons.
 *
 * The options are mutually exclusive views of the same chart, which is what a
 * radio group means to a screen reader; a set of independent buttons would not
 * say that the choice is exclusive, nor which one is currently taken.
 */
export function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const name = useId()
  const tx = useProjectText()

  return (
    <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <legend className="sr-only">{tx(label)}</legend>
      <span aria-hidden className="font-sans text-xs uppercase tracking-wider text-muted">
        {tx(label)}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o.value
          return (
            <label
              key={o.value}
              className={`font-sans text-xs px-3 py-1.5 rounded-sm border cursor-pointer transition-colors ${
                on
                  ? 'border-[var(--series-1)] text-[var(--chart-label)]'
                  : 'border-border text-muted hover:text-[var(--chart-label)]'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {tx(o.label)}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
