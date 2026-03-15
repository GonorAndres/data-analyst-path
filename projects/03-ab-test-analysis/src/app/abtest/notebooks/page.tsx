'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const NOTEBOOKS = [
  {
    id: '01',
    label: '01 — Data Pipeline',
    description: 'Download, clean and synthetic enrichment — every procedural decision documented',
    src: '/notebooks_html/01_data_pipeline.html',
  },
  {
    id: '02',
    label: '02 — Exploratory Analysis',
    description: 'Group balance, conversion patterns by segment, Simpson\'s Paradox observation',
    src: '/notebooks_html/02_eda_exploratory.html',
  },
  {
    id: '03',
    label: '03 — Statistical Analysis',
    description: 'Frequentist, Bayesian, power analysis, O\'Brien-Fleming sequential monitoring',
    src: '/notebooks_html/03_statistical_analysis.html',
  },
]

export default function NotebooksPage() {
  const [active, setActive] = useState('01')
  const current = NOTEBOOKS.find((n) => n.id === active)!

  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414]">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <Link
          href="/abtest"
          className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-muted hover:text-ink dark:hover:text-[#F0EFEB] transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted">A/B Test Lab</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink dark:text-[#F0EFEB] mt-1">
          Technical Process
        </h1>
        <p className="font-sans text-sm text-muted mt-1">
          Jupyter notebooks — full analytical pipeline with procedural decisions
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {['scipy.stats', 'Beta-Binomial', 'pyarrow', 'SWR', 'nbconvert'].map((tag) => (
            <span
              key={tag}
              className="font-sans text-xs px-2.5 py-1 rounded-full border border-border dark:border-[#2a2a2a] text-muted bg-surface dark:bg-[#1a1a1a]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        <div className="rule-line mb-6" />

        {/* Tab selector */}
        <div className="flex flex-wrap gap-2 mb-2">
          {NOTEBOOKS.map((nb) => (
            <button
              key={nb.id}
              onClick={() => setActive(nb.id)}
              className={`px-4 py-2 rounded font-sans text-sm tracking-wide transition-colors ${
                active === nb.id
                  ? 'bg-accent-indigo text-white dark:bg-[#818CF8]'
                  : 'bg-surface dark:bg-[#1a1a1a] text-muted hover:text-ink dark:hover:text-[#F0EFEB] border border-border dark:border-[#2a2a2a]'
              }`}
            >
              {nb.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="font-sans text-xs text-muted mb-4">{current.description}</p>

        {/* Notebook iframe */}
        <iframe
          key={current.src}
          src={current.src}
          className="w-full rounded border border-border dark:border-[#2a2a2a] bg-white"
          style={{ height: 'calc(100vh - 260px)', minHeight: '700px' }}
          title={current.label}
          sandbox="allow-scripts allow-same-origin"
        />

        <footer className="py-8 border-t border-border dark:border-[#2a2a2a] mt-6">
          <p className="font-sans text-xs text-muted text-center">
            A/B Test Lab | Andrés González Ortega | Data: Udacity E-Commerce A/B Test (enriched with synthetic columns)
          </p>
        </footer>
      </div>
    </div>
  )
}
