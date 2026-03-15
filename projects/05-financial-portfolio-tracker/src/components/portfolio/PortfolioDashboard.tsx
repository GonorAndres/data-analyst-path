'use client'
import { useState } from 'react'
import { PortfolioProvider, usePortfolio, Period } from '@/context/PortfolioContext'
import { TabNav } from '@/components/ui/TabNav'
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

  return (
    <div className="flex items-center gap-1 glass-card p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`
            px-3 py-1.5 font-mono text-xs font-semibold tracking-wide uppercase rounded-lg transition-all
            ${period === p
              ? 'bg-accent text-black'
              : 'text-muted hover:text-ink'
            }
          `}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function DashboardInner() {
  const [activeTab, setActiveTab] = useState('about')

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-muted-dim">
            Data Analyst Portfolio
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-ink mt-1">
            Portfolio Tracker
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            Multi-Asset Portfolio Analytics & Optimization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        {/* Tab Navigation */}
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'about' && <AboutPanel />}
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'performance' && <PerformancePanel />}
        {activeTab === 'risk' && <RiskPanel />}
        {activeTab === 'correlation' && <CorrelationPanel />}
        {activeTab === 'montecarlo' && <MonteCarloPanel />}
        {activeTab === 'frontier' && <FrontierPanel />}
        {activeTab === 'methodology' && <MethodologyPanel />}

        {/* Footer */}
        <footer className="py-10 border-t border-white/[0.06] mt-10">
          <p className="font-sans text-xs text-muted-dim text-center">
            Portfolio Tracker | Andres Gonzalez Ortega | Data: Yahoo Finance (yfinance)
          </p>
        </footer>
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
