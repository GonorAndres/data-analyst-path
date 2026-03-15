'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const NOTEBOOKS = [
  {
    id: '01',
    label: '01 — Data Pipeline',
    description: 'Download, clean, and synthetic enrichment decisions',
    src: '/notebooks_html/01_data_pipeline.html',
  },
  {
    id: '02',
    label: '02 — Exploratory Analysis',
    description: 'Group balance, conversion patterns, Simpson\'s Paradox observation',
    src: '/notebooks_html/02_eda_exploratory.html',
  },
  {
    id: '03',
    label: '03 — Statistical Analysis',
    description: 'Frequentist, Bayesian, power analysis, sequential monitoring',
    src: '/notebooks_html/03_statistical_analysis.html',
  },
]

export function NotebookSection() {
  const [open, setOpen] = useState(false)
  const [activeNotebook, setActiveNotebook] = useState('01')

  const current = NOTEBOOKS.find((n) => n.id === activeNotebook)!

  return (
    <div className="border-t border-border dark:border-[#2a2a2a] mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 font-sans text-sm text-muted hover:text-ink dark:hover:text-[#F0EFEB] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs tracking-[0.2em] uppercase">Technical Process</span>
          <span className="font-sans text-xs text-muted">— Jupyter notebooks with full analysis walkthrough</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="pb-10">
          {/* Notebook tab selector */}
          <div className="flex flex-wrap gap-2 px-4 mb-4">
            {NOTEBOOKS.map((nb) => (
              <button
                key={nb.id}
                onClick={() => setActiveNotebook(nb.id)}
                className={`px-4 py-2 rounded font-sans text-xs tracking-wide transition-colors ${
                  activeNotebook === nb.id
                    ? 'bg-accent-indigo text-white dark:bg-[#818CF8]'
                    : 'bg-surface dark:bg-[#1a1a1a] text-muted hover:text-ink dark:hover:text-[#F0EFEB] border border-border dark:border-[#2a2a2a]'
                }`}
              >
                {nb.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="font-sans text-xs text-muted px-4 mb-4">
            {current.description}
          </p>

          {/* Notebook iframe */}
          <div className="px-4">
            <iframe
              key={current.src}
              src={current.src}
              className="w-full rounded border border-border dark:border-[#2a2a2a]"
              style={{ height: '80vh', minHeight: '600px' }}
              title={current.label}
            />
          </div>
        </div>
      )}
    </div>
  )
}
