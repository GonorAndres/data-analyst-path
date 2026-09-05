'use client'
import { useABText } from '@/features/abtest/lib/translations'
import { useSection } from '@/hooks/useSection'
import { SectionNav } from '@/components/SectionNav'
import { usePreferences } from '@/components/SitePreferences'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const NOTEBOOKS = [
  {
    id: '01',
    label: '01 — Data Pipeline',
    description: 'Download, clean and synthetic enrichment — every procedural decision documented',
    src: '/abtest/notebooks_html/01_data_pipeline.html',
  },
  {
    id: '02',
    label: '02 — Exploratory Analysis',
    description: 'Group balance, conversion patterns by segment, Simpson\'s Paradox observation',
    src: '/abtest/notebooks_html/02_eda_exploratory.html',
  },
  {
    id: '03',
    label: '03 — Statistical Analysis',
    description: 'Frequentist, Bayesian, power analysis, O\'Brien-Fleming sequential monitoring',
    src: '/abtest/notebooks_html/03_statistical_analysis.html',
  },
]

export default function NotebooksPage() {
  const tr = useABText()
  const { t } = usePreferences()
  const [active, setActive] = useSection('01', ['01', '02', '03'])
  const current = NOTEBOOKS.find((n) => n.id === active)!

  return (
    <div className="min-h-screen bg-paper dark:bg-[var(--bg)]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/abtest"
          className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-muted hover:text-ink dark:hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft size={14} />{tr("Back to Dashboard")}</Link>
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted">{t('A/B Test Lab', 'Laboratorio de pruebas A/B')}</p>
        <h1 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-ink dark:text-[var(--foreground)] mt-1">{tr("Technical Process")}</h1>
        <p className="font-sans text-sm text-muted mt-1">{tr("Jupyter notebooks — full analytical pipeline with procedural decisions")}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {['scipy.stats', 'Beta-Binomial', 'pyarrow', 'SWR', 'nbconvert'].map((tag) => (
            <span
              key={tag}
              className="font-sans text-xs px-2.5 py-1 rounded-full border border-border dark:border-[var(--border)] text-muted bg-surface dark:bg-[var(--surface)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        <div className="rule-line mb-6" />

        {/* Tab selector */}
        <SectionNav items={NOTEBOOKS.map(nb => ({ id: nb.id, label: tr(nb.label) }))} value={active} onChange={setActive} />

        {/* Description */}
        <p className="font-sans text-xs text-muted mb-4">{tr(current.description)}</p>
        <p className="text-sm text-muted mb-4">{t('Source notebooks retain their original language.', 'Los cuadernos originales conservan su idioma.')} <a href={current.src} target="_blank" rel="noopener noreferrer" className="underline">{t('Open notebook in a new tab', 'Abrir cuaderno en otra pestaña')}</a></p>

        {/* Notebook iframe */}
        <iframe
          key={current.src}
          src={current.src}
          className="w-full rounded border border-border dark:border-[var(--border)] bg-white"
          style={{ height: 'calc(100vh - 260px)', minHeight: '700px' }}
          title={tr(current.label)}
          sandbox="allow-scripts allow-same-origin"
        />

      </div>
    </div>
  )
}
