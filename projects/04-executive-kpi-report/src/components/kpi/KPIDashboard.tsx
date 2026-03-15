'use client'
import { useState } from 'react'
import { KPIFilterProvider, useKPIFilters } from '@/context/KPIFilterContext'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { useFilters } from '@/hooks/useKPIAPI'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { TabNav } from '@/components/ui/TabNav'
import { OverviewPanel } from './OverviewPanel'
import { RevenuePanel } from './RevenuePanel'
import { CustomerPanel } from './CustomerPanel'
import { ForecastPanel } from './ForecastPanel'
import { AnomalyPanel } from './AnomalyPanel'
import { ReportPanel } from './ReportPanel'
import { IntroSection } from './IntroSection'
import { TechnicalProcess } from './TechnicalProcess'
import type { FiltersResponse } from '@/types/kpi-types'

function DashboardInner() {
  const [activeTab, setActiveTab] = useState('about')
  const { filters, setFilters, resetFilters } = useKPIFilters()
  const { data: filtersData } = useFilters()
  const { t } = useLanguage()

  const f = filtersData as FiltersResponse | undefined

  const TABS = [
    { id: 'about', label: t('nav.about') },
    { id: 'overview', label: t('nav.overview') },
    { id: 'revenue', label: t('nav.revenue') },
    { id: 'customers', label: t('nav.customers') },
    { id: 'forecast', label: t('nav.forecast') },
    { id: 'anomalies', label: t('nav.anomalies') },
    { id: 'report', label: t('nav.report') },
    { id: 'technical', label: t('nav.technical') },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--fg-muted)]">
            {t('header.portfolio')}
          </p>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-[var(--fg-primary)] mt-1">
            {t('header.title')}
          </h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            {t('header.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Filter Bar */}
        <div className="glass-card p-3 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--fg-muted)]">
            {t('filter.label')}
          </span>

          {f && (
            <>
              <select
                value={filters.segment}
                onChange={(e) => setFilters({ segment: e.target.value })}
                className="text-sm px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--fg-primary)] backdrop-blur"
              >
                <option value="">{t('filter.all_segments')}</option>
                {f.segments?.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filters.start_month}
                onChange={(e) => setFilters({ start_month: e.target.value })}
                className="text-sm px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--fg-primary)] backdrop-blur"
              >
                <option value="">{t('filter.start_month')}</option>
                {f.months?.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={filters.end_month}
                onChange={(e) => setFilters({ end_month: e.target.value })}
                className="text-sm px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--fg-primary)] backdrop-blur"
              >
                <option value="">{t('filter.end_month')}</option>
                {f.months?.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={filters.comparison}
                onChange={(e) => setFilters({ comparison: e.target.value })}
                className="text-sm px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--fg-primary)] backdrop-blur"
              >
                <option value="mom">{t('filter.mom')}</option>
                <option value="yoy">{t('filter.yoy')}</option>
              </select>
            </>
          )}

          <button
            onClick={resetFilters}
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent-cyan)] transition-colors underline underline-offset-2"
          >
            {t('filter.reset')}
          </button>
        </div>

        {/* Tab Navigation */}
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'about' && <IntroSection />}
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'revenue' && <RevenuePanel />}
        {activeTab === 'customers' && <CustomerPanel />}
        {activeTab === 'forecast' && <ForecastPanel />}
        {activeTab === 'anomalies' && <AnomalyPanel />}
        {activeTab === 'report' && <ReportPanel />}
        {activeTab === 'technical' && <TechnicalProcess />}

        {/* Footer */}
        <footer className="py-10 mt-10 border-t border-[var(--glass-border)]">
          <p className="text-xs text-[var(--fg-muted)] text-center">
            {t('footer.text')}
            {' · '}
            <button
              onClick={() => setActiveTab('technical')}
              className="underline underline-offset-2 hover:text-[var(--fg-secondary)] transition-colors"
            >
              {t('footer.dev_link')}
            </button>
          </p>
        </footer>
      </div>
    </div>
  )
}

export function KPIDashboard() {
  return (
    <LanguageProvider>
      <KPIFilterProvider>
        <DashboardInner />
      </KPIFilterProvider>
    </LanguageProvider>
  )
}
