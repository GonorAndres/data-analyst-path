'use client'
import { useState } from 'react'
import { ABTestFilterProvider, useABTestFilters } from '@/context/ABTestFilterContext'
import { useOverview, useFilters } from '@/hooks/useABTestAPI'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TabNav } from '@/components/ui/TabNav'
import { VerdictCard } from './VerdictCard'
import { KPIRow } from './KPIRow'
import { FrequentistPanel } from './FrequentistPanel'
import { BayesianPanel } from './BayesianPanel'
import { SegmentExplorer } from './SegmentExplorer'
import { PowerCalculator } from './PowerCalculator'
import { SequentialChart } from './SequentialChart'
import { IntroSection } from './IntroSection'

const TABS = [
  { id: 'overview', label: 'Executive Overview' },
  { id: 'frequentist', label: 'Frequentist' },
  { id: 'bayesian', label: 'Bayesian' },
  { id: 'segments', label: 'Segments' },
  { id: 'power', label: 'Power & Design' },
  { id: 'sequential', label: 'Sequential' },
]

function DashboardInner() {
  const [activeTab, setActiveTab] = useState('overview')
  const { filters, setFilters, resetFilters, queryString } = useABTestFilters()
  const { data: filtersData } = useFilters()
  const { data: overviewData, isLoading, error } = useOverview(queryString)

  const f = filtersData as any
  const o = overviewData as any

  return (
    <div className="min-h-screen bg-paper dark:bg-[#141414]">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted">Data Analyst Portfolio</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink dark:text-[#F0EFEB] mt-1">
            A/B Test Lab
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            E-Commerce Landing Page Conversion Experiment
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-6xl mx-auto px-4">
        {/* Rule line */}
        <div className="rule-line mb-6" />

        {/* Introduction & Context */}
        <IntroSection />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <p className="font-sans text-xs tracking-widest uppercase text-muted self-center mr-2">Filter</p>
          {f && (
            <>
              <select
                value={filters.device_type}
                onChange={(e) => setFilters({ device_type: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[#2a2a2a] rounded bg-paper dark:bg-[#1a1a1a] text-ink dark:text-[#F0EFEB]"
              >
                <option value="">All Devices</option>
                {f.device_types?.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={filters.country}
                onChange={(e) => setFilters({ country: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[#2a2a2a] rounded bg-paper dark:bg-[#1a1a1a] text-ink dark:text-[#F0EFEB]"
              >
                <option value="">All Countries</option>
                {f.countries?.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filters.user_segment}
                onChange={(e) => setFilters({ user_segment: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[#2a2a2a] rounded bg-paper dark:bg-[#1a1a1a] text-ink dark:text-[#F0EFEB]"
              >
                <option value="">All Segments</option>
                {f.user_segments?.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filters.traffic_source}
                onChange={(e) => setFilters({ traffic_source: e.target.value })}
                className="font-sans text-sm px-3 py-1.5 border border-border dark:border-[#2a2a2a] rounded bg-paper dark:bg-[#1a1a1a] text-ink dark:text-[#F0EFEB]"
              >
                <option value="">All Sources</option>
                {f.traffic_sources?.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={resetFilters}
                className="font-sans text-xs text-muted hover:text-ink dark:hover:text-[#F0EFEB] underline"
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {isLoading && <p className="font-sans text-sm text-muted py-10">Loading experiment results...</p>}
            {error && <p className="font-sans text-sm text-sig-negative py-10">Failed to load experiment data.</p>}
            {o && (
              <>
                <VerdictCard
                  verdict={o.verdict}
                  pValue={o.p_value}
                  lift={o.lift_pct}
                  power={o.power}
                />
                <KPIRow data={o} />

                {/* Revenue Impact Projection */}
                <div className="py-8 border-t border-border dark:border-[#2a2a2a]">
                  <h2 className="font-serif text-2xl tracking-tight text-ink dark:text-[#F0EFEB] mb-4">
                    Revenue Impact Projection
                  </h2>
                  <p className="font-sans text-sm text-muted mb-4">
                    If shipped to 1M users, expected revenue change based on observed treatment effect.
                  </p>
                  <div className="p-4 bg-surface dark:bg-[#1a1a1a] rounded-lg">
                    <p className="font-sans text-base">
                      Revenue per user: Control <strong className="tabular-nums">${o.revenue_control_mean?.toFixed(2)}</strong> vs Treatment <strong className="tabular-nums">${o.revenue_treatment_mean?.toFixed(2)}</strong>
                    </p>
                    <p className="font-sans text-base mt-2">
                      Projected impact (1M users):{' '}
                      <strong className={`tabular-nums ${o.revenue_lift >= 0 ? 'text-sig-positive' : 'text-sig-negative'}`}>
                        {o.revenue_lift >= 0 ? '+' : ''}${(o.revenue_lift * 1_000_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Test Health */}
                <div className="py-8 border-t border-border dark:border-[#2a2a2a]">
                  <h2 className="font-serif text-2xl tracking-tight text-ink dark:text-[#F0EFEB] mb-4">
                    Test Health Checks
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface dark:bg-[#1a1a1a] rounded-lg">
                      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Sample Ratio Mismatch</p>
                      <p className={`font-sans font-semibold ${o.srm_test?.is_balanced ? 'text-sig-positive' : 'text-sig-negative'}`}>
                        {o.srm_test?.is_balanced ? 'Balanced' : 'Imbalanced'} (p={o.srm_test?.p_value?.toFixed(4)})
                      </p>
                    </div>
                    <div className="p-4 bg-surface dark:bg-[#1a1a1a] rounded-lg">
                      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Sample Size</p>
                      <p className="font-sans font-semibold tabular-nums">
                        Control: {o.n_control?.toLocaleString()} | Treatment: {o.n_treatment?.toLocaleString()}
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

        {/* Footer */}
        <footer className="py-10 border-t border-border dark:border-[#2a2a2a] mt-10">
          <p className="font-sans text-xs text-muted text-center">
            A/B Test Lab | Andres Gonzalez Ortega | Data: Udacity E-Commerce A/B Test (enriched with synthetic columns)
          </p>
        </footer>
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
