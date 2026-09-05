'use client'

import { usePreferences } from './SitePreferences'

export function SectionNav({ items, value, onChange }: {
  items: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  const { t } = usePreferences()
  return (
    <nav className="section-nav" aria-label={t('Analysis sections', 'Secciones del análisis')}>
      {items.map(item => (
        <button key={item.id} type="button" aria-current={item.id === value ? 'page' : undefined}
          className="section-link" onClick={() => onChange(item.id)}>{item.label}</button>
      ))}
    </nav>
  )
}
