'use client'
import { useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { useKPIFilters } from '@/context/KPIFilterContext'
import { useLanguage } from '@/context/LanguageContext'
import { useOverview } from '@/hooks/useKPIAPI'
import { KPICard } from '@/components/ui/KPICard'
import type { OverviewResponse, KPIMetric } from '@/types/kpi-types'
import type { TranslationKey } from '@/lib/translations'

const KPI_DIRECTION: Record<string, 'up' | 'down' | 'neutral'> = {
  mrr: 'up', arr: 'up', nrr: 'up',
  logo_churn: 'down', revenue_churn: 'down',
  nps: 'up', ltv_cac: 'up', cac: 'down',
  payback: 'down', rule_of_40: 'up', gross_margin: 'up', dau_mau: 'up',
}

function HealthGauge({ score, status }: { score: number; status: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, score, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent = Math.round(latest).toString()
      },
    })
    return controls.stop
  }, [score])

  const statusColor = status === 'green'
    ? 'var(--status-green)'
    : status === 'yellow'
      ? 'var(--status-yellow)'
      : 'var(--status-red)'

  // SVG ring gauge
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-card p-6 flex flex-col items-center justify-center"
    >
      <div className="relative w-40 h-40">
        <svg width="160" height="160" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={statusColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{
              transition: 'stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 8px ${statusColor})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            ref={ref}
            className="text-4xl font-light tabular-nums text-[var(--fg-primary)]"
          >
            0
          </span>
          <span className="text-xs text-[var(--fg-muted)] mt-1">/100</span>
        </div>
      </div>
    </motion.div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-8 w-28" />
          <div className="skeleton h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function OverviewPanel() {
  const { queryString } = useKPIFilters()
  const { t } = useLanguage()
  const { data, isLoading, error } = useOverview(queryString)

  const o = data as OverviewResponse | undefined

  const categories = [
    { key: 'revenue' as const, label: t('overview.category.revenue') },
    { key: 'customer' as const, label: t('overview.category.customer') },
    { key: 'efficiency' as const, label: t('overview.category.efficiency') },
    { key: 'performance' as const, label: t('overview.category.performance') },
  ]

  return (
    <div className="space-y-8">
      {isLoading && <SkeletonGrid />}
      {error && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-[var(--status-red)]">{t('error.load_failed')}</p>
        </div>
      )}

      {o && (
        <>
          {/* Health Score + Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HealthGauge score={o.health_score} status={o.health_status} />
            <div className="md:col-span-2 glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">
                {t('overview.health_score')}
              </h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">
                {o.period?.start} - {o.period?.end} | {o.last_month}
              </p>
              <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--fg-muted)] mb-2">
                  {t('overview.commentary')}
                </p>
                <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
                  {o.commentary}
                </p>
              </div>
            </div>
          </div>

          {/* KPI Grid by Category */}
          {categories.map((cat) => {
            const kpis = o.kpis.filter((k: KPIMetric) => k.category === cat.key)
            if (kpis.length === 0) return null
            return (
              <div key={cat.key}>
                <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--fg-muted)] mb-3">
                  {cat.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kpis.map((kpi: KPIMetric, i: number) => (
                    <KPICard
                      key={kpi.id}
                      metric={kpi}
                      delay={i * 0.08}
                      tooltip={t(`tooltip.${kpi.id}` as TranslationKey)}
                      direction={KPI_DIRECTION[kpi.id] ?? 'neutral'}
                      hintUp={t('tooltip.hint_up')}
                      hintDown={t('tooltip.hint_down')}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
