'use client'
import { useABText } from '@/features/abtest/lib/translations'
import { useSection } from '@/hooks/useSection'
import { SectionNav } from '@/components/SectionNav'
import { usePreferences } from '@/components/SitePreferences'
import { ChartState } from '@/components/ChartState'
import { ABTestFilterProvider, useABTestFilters } from '@/features/abtest/context/ABTestFilterContext'
import { useOverview, useFilters } from '@/features/abtest/hooks/useABTestAPI'
import { VerdictCard } from './VerdictCard'
import { KPIRow } from './KPIRow'
import { FrequentistPanel } from './FrequentistPanel'
import { BayesianPanel } from './BayesianPanel'
import { SegmentExplorer } from './SegmentExplorer'
import { PowerCalculator } from './PowerCalculator'
import { SequentialChart } from './SequentialChart'
import { IntroSection } from './IntroSection'
import Link from 'next/link'

function DashboardInner() {
  const tr = useABText()
  const { t } = usePreferences()
  const [activeTab, setActiveTab] = useSection('overview', ['overview', 'frequentist', 'bayesian', 'segments', 'power', 'sequential'])
  const TABS = [
    { id: 'overview', label: t('Overview', 'Resumen') },
    { id: 'frequentist', label: t('Frequentist', 'Frecuentista') },
    { id: 'bayesian', label: t('Bayesian', 'Bayesiano') },
    { id: 'segments', label: t('Segments', 'Segmentos') },
    { id: 'power', label: t('Power & design', 'Potencia y diseño') },
    { id: 'sequential', label: t('Sequential', 'Secuencial') },
  ]
  const { filters, setFilters, resetFilters, queryString } = useABTestFilters()
  const { data: filtersData } = useFilters()
  const { data: overviewData, isLoading, error } = useOverview(queryString)

  const f = filtersData as any
  const payload = overviewData as any
  const o = payload?.error ? undefined : payload

  return (
    <div className="min-h-screen bg-paper dark:bg-[var(--bg)]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-ink dark:text-[var(--foreground)] mt-1">
            {t('A/B Test Lab', 'Laboratorio de pruebas A/B')}
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            {t('E-commerce landing page conversion experiment', 'Experimento de conversión en una página de comercio electrónico')}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        {/* Rule line */}
        <div className="rule-line mb-6" />

        {/* Introduction & Context */}
        <IntroSection />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <p className="font-sans text-xs tracking-widest uppercase text-muted self-center mr-2">{tr("Filter")}</p>
          {f && (
            <>
              <select
                aria-label={t('Device', 'Dispositivo')}
                value={filters.device_type}
                onChange={(e) => setFilters({ device_type: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[var(--border)] rounded bg-paper dark:bg-[var(--surface)] text-ink dark:text-[var(--foreground)]"
              >
                <option value="">{tr("All Devices")}</option>
                {f.device_types?.map((d: string) => <option key={d} value={d}>{tr(d)}</option>)}
              </select>
              <select
                aria-label={t('Country', 'País')}
                value={filters.country}
                onChange={(e) => setFilters({ country: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[var(--border)] rounded bg-paper dark:bg-[var(--surface)] text-ink dark:text-[var(--foreground)]"
              >
                <option value="">{tr("All Countries")}</option>
                {f.countries?.map((c: string) => <option key={c} value={c}>{tr(c)}</option>)}
              </select>
              <select
                aria-label={t('User segment', 'Segmento de usuarios')}
                value={filters.user_segment}
                onChange={(e) => setFilters({ user_segment: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[var(--border)] rounded bg-paper dark:bg-[var(--surface)] text-ink dark:text-[var(--foreground)]"
              >
                <option value="">{tr("All Segments")}</option>
                {f.user_segments?.map((s: string) => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
              <select
                aria-label={t('Traffic source', 'Fuente de tráfico')}
                value={filters.traffic_source}
                onChange={(e) => setFilters({ traffic_source: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[var(--border)] rounded bg-paper dark:bg-[var(--surface)] text-ink dark:text-[var(--foreground)]"
              >
                <option value="">{tr("All Sources")}</option>
                {f.traffic_sources?.map((s: string) => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
              <button
                onClick={resetFilters}
                className="font-sans text-xs text-muted hover:text-ink dark:hover:text-[var(--foreground)] underline"
              >{tr("Reset")}</button>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <SectionNav items={TABS} value={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <ChartState loading={isLoading} error={error || (payload?.error && !String(payload.error).startsWith("No data") ? payload.error : undefined)} empty={!o} />
            {!isLoading && !error && o && (
              <>
                <VerdictCard
                  verdict={o.verdict}
                  pValue={o.p_value}
                  lift={o.lift_pct}
                  power={o.power}
                />
                <KPIRow data={o} />

                {/* Revenue Impact Projection */}
                <div className="py-8 border-t border-border dark:border-[var(--border)]">
                  <h2 className="font-sans text-2xl tracking-tight text-ink dark:text-[var(--foreground)] mb-4">{tr("Revenue Impact Projection")}</h2>
                  <p className="font-sans text-sm text-muted mb-4">{tr("If shipped to 1M users, expected revenue change based on observed treatment effect.")}</p>
                  <div className="p-4 bg-surface dark:bg-[var(--surface)] rounded-lg">
                    <p className="font-sans text-base">{tr("Revenue per user: Control")}{' '}<strong className="tabular-nums">{Number.isFinite(o.revenue_control_mean) ? `$${o.revenue_control_mean.toFixed(2)}` : '—'}</strong>{' '}{tr("vs Treatment")}{' '}<strong className="tabular-nums">{Number.isFinite(o.revenue_treatment_mean) ? `$${o.revenue_treatment_mean.toFixed(2)}` : '—'}</strong>
                    </p>
                    <p className="font-sans text-base mt-2">
                      {tr('Projected impact (1M users):')}{' '}
                      <strong className={`tabular-nums ${o.revenue_lift >= 0 ? 'text-sig-positive' : 'text-sig-negative'}`}>
                        {Number.isFinite(o.revenue_lift) ? `${o.revenue_lift >= 0 ? '+' : ''}$${(o.revenue_lift * 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Test Health */}
                <div className="py-8 border-t border-border dark:border-[var(--border)]">
                  <h2 className="font-sans text-2xl tracking-tight text-ink dark:text-[var(--foreground)] mb-4">{tr("Test Health Checks")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface dark:bg-[var(--surface)] rounded-lg">
                      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">{tr("Sample Ratio Mismatch")}</p>
                      <p className={`font-sans font-semibold ${o.srm_test?.is_balanced ? 'text-sig-positive' : 'text-sig-negative'}`}>
                        {o.srm_test?.is_balanced == null ? '—' : o.srm_test.is_balanced ? tr("Balanced") : tr("Imbalanced")} (p={o.srm_test?.p_value?.toFixed(4) ?? '—'})
                      </p>
                    </div>
                    <div className="p-4 bg-surface dark:bg-[var(--surface)] rounded-lg">
                      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">{tr("Sample Size")}</p>
                      <p className="font-sans font-semibold tabular-nums">
                        {tr('Control:')} {o.n_control?.toLocaleString() ?? '—'} {tr('| Treatment:')} {o.n_treatment?.toLocaleString() ?? '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'frequentist' && <FrequentistPanel />}
        {activeTab === 'bayesian' && <BayesianPanel />}
        {activeTab === 'segments' && <SegmentExplorer />}
        {activeTab === 'power' && <PowerCalculator />}
        {activeTab === 'sequential' && <SequentialChart />}

        <p className="py-6 text-sm text-muted"><Link href="/abtest/notebooks" className="underline underline-offset-2">{t('Methodology and notebooks', 'Metodología y cuadernos')}</Link></p>
      </div>
    </div>
  )
}

export function ABTestDashboard() {
  return (
    <ABTestFilterProvider>
      <DashboardInner />
    </ABTestFilterProvider>
  )
}
