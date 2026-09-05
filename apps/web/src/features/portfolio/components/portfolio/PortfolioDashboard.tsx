'use client'
import { useSection } from '@/hooks/useSection'
import { SectionNav } from '@/components/SectionNav'
import { usePreferences } from '@/components/SitePreferences'
import { PortfolioProvider, usePortfolio, Period } from '@/features/portfolio/context/PortfolioContext'
import { AboutPanel } from './AboutPanel'
import { OverviewPanel } from './OverviewPanel'
import { PerformancePanel } from './PerformancePanel'
import { RiskPanel } from './RiskPanel'
import { CorrelationPanel } from './CorrelationPanel'
import { MonteCarloPanel } from './MonteCarloPanel'
import { FrontierPanel } from './FrontierPanel'
import { MethodologyPanel } from './MethodologyPanel'

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'risk', label: 'Risk' },
  { id: 'correlation', label: 'Correlation' },
  { id: 'montecarlo', label: 'Monte Carlo' },
  { id: 'frontier', label: 'Frontier' },
  { id: 'methodology', label: 'Methodology' },
]

const PERIODS: Period[] = ['1y', '2y', '3y', '5y']

function PeriodSelector() {
  const { period, setPeriod } = usePortfolio()
  const { t } = usePreferences()

  return (
    <div className="flex flex-wrap items-center gap-1 glass-card p-1" role="group" aria-label={t('Analysis period', 'Periodo de análisis')}>
      {PERIODS.map((p) => (
        <button
          key={p}
          aria-pressed={period === p}
          aria-label={t(`${p.slice(0, -1)} years`, `${p.slice(0, -1)} años`)}
          onClick={() => setPeriod(p)}
          className={`
            px-3 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase rounded-lg transition-all
            ${period === p
              ? 'bg-accent text-white'
              : 'text-muted hover:text-ink'
            }
          `}
        >
          {t(p, p.replace('y', 'a'))}
        </button>
      ))}
    </div>
  )
}

function DashboardInner() {
  const [activeTab, setActiveTab] = useSection('about', TABS.map(tab => tab.id))
  const { t } = usePreferences()
  const labels = ['Contexto', 'Resumen', 'Rendimiento', 'Riesgo', 'Correlación', 'Monte Carlo', 'Frontera', 'Metodología']

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-ink mt-1">
            {t('Portfolio analytics', 'Analítica de portafolio')}
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            {t('Performance, risk and allocation decisions across asset classes.', 'Rendimiento, riesgo y decisiones de asignación entre clases de activos.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector />
        </div>
      </header>

      <div className="space-y-6">
        {/* Tab Navigation */}
        <SectionNav items={TABS.map((tab, i) => ({ id: tab.id, label: t(tab.label, labels[i]) }))} value={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'about' && <AboutPanel />}
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'performance' && <PerformancePanel />}
        {activeTab === 'risk' && <RiskPanel />}
        {activeTab === 'correlation' && <CorrelationPanel />}
        {activeTab === 'montecarlo' && <MonteCarloPanel />}
        {activeTab === 'frontier' && <FrontierPanel />}
        {activeTab === 'methodology' && <MethodologyPanel />}

      </div>
    </div>
  )
}

export function PortfolioDashboard() {
  return (
    <PortfolioProvider>
      <DashboardInner />
    </PortfolioProvider>
  )
}
