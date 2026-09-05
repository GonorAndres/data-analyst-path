'use client'
import { useEffect, useState } from 'react'
import { usePreferences } from '@/components/SitePreferences'
import { motion } from 'framer-motion'
import { FileDown, Loader2 } from 'lucide-react'
import { useKPIFilters } from '@/features/kpi/context/KPIFilterContext'
import { useLanguage } from '@/features/kpi/context/LanguageContext'
import { useOverview } from '@/features/kpi/hooks/useKPIAPI'
import type { OverviewResponse } from '@/features/kpi/types/kpi-types'

const SECTIONS = [
  { id: 'overview', key: 'report.section.overview' as const },
  { id: 'revenue', key: 'report.section.revenue' as const },
  { id: 'customers', key: 'report.section.customers' as const },
  { id: 'forecast', key: 'report.section.forecast' as const },
  { id: 'anomalies', key: 'report.section.anomalies' as const },
]

export function ReportPanel() {
  const { t: text } = usePreferences()
  const { filters, queryString } = useKPIFilters()
  const { language, t } = useLanguage()
  const { data: overviewData } = useOverview(queryString)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(false)
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(SECTIONS.map((s) => s.id))
  )
  const [reportLanguage, setReportLanguage] = useState(language)
  useEffect(() => setReportLanguage(language), [language])

  const o = overviewData && !('error' in overviewData) ? overviewData as OverviewResponse : undefined

  function toggleSection(id: string) {
    setSelectedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleGenerate() {
    setGenerationError(false)
    setGenerating(true)
    try {
      const params = new URLSearchParams()
      if (filters.segment) params.set('segment', filters.segment)
      if (filters.start_month) params.set('start_month', filters.start_month)
      if (filters.end_month) params.set('end_month', filters.end_month)
      params.set('lang', reportLanguage)
      params.set('sections', Array.from(selectedSections).join(','))

      const res = await fetch(`/api/kpi/api/v1/report/generate?${params.toString()}`)
      if (!res.ok || !res.headers.get('content-type')?.includes('application/pdf')) throw new Error('Report generation failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kpi-report-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setGenerationError(true)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-4">
          {t('report.config_title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div>
            <label htmlFor="kpi-report-language" className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              {t('report.language')}
            </label>
            <select
              id="kpi-report-language"
              value={reportLanguage}
              onChange={(e) => setReportLanguage(e.target.value as 'en' | 'es')}
              className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--fg-primary)]"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Sections */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              {t('report.sections')}
            </label>
            <div className="space-y-2">
              {SECTIONS.map((section) => (
                <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSections.has(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="rounded border-[var(--glass-border)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)] bg-[var(--glass-bg)]"
                  />
                  <span className="text-sm text-[var(--fg-secondary)]">{t(section.key)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      {o && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-4">
            {t('report.preview_title')}
          </h3>
          <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                  {t('overview.health_score')}
                </p>
                <p className="text-2xl font-light tabular-nums text-[var(--fg-primary)]">
                  {o.health_score}/100
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                  {text('Period', 'Período')}
                </p>
                <p className="text-sm text-[var(--fg-secondary)]">{o.period?.start} - {o.period?.end}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                  {t('overview.commentary')}
                </p>
                <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{o.commentary}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generate Button */}
      {generationError && <p role="alert" className="text-sm text-[var(--status-red)]">{text('The report could not be generated. Check the selected period and try again.', 'No se pudo generar el informe. Revisa el período seleccionado e inténtalo de nuevo.')}</p>}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <button
          onClick={handleGenerate}
          disabled={generating || selectedSections.size === 0}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
            bg-[var(--accent-cyan)] text-white hover:bg-[var(--accent-cyan)]/80
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors shadow-lg shadow-[var(--accent-cyan)]/20"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('report.generating')}
            </>
          ) : (
            <>
              <FileDown size={16} />
              {t('report.generate')}
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}
