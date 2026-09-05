'use client'
import { useId } from 'react'
import { motion } from 'framer-motion'
import { usePreferences } from '@/components/SitePreferences'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import type { KPIMetric } from '@/features/kpi/types/kpi-types'
import { KPITooltip } from './KPITooltip'

interface KPICardProps {
  metric: KPIMetric
  delay?: number
  tooltip?: string
  direction?: 'up' | 'down' | 'neutral'
  hintUp?: string
  hintDown?: string
  comparison?: 'mom' | 'yoy'
}

function MiniSparkline({ data }: { data: number[] }) {
  const gradientId = useId()
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 28
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((v - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  })


  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="var(--accent-violet)" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const cls = status === 'green'
    ? 'status-dot status-dot-green'
    : status === 'yellow'
      ? 'status-dot status-dot-yellow'
      : 'status-dot status-dot-red'
  return <span className={cls} />
}

function ChangeBadge({ value, label, direction }: { value: number; label: string; direction: 'up' | 'down' | 'neutral' }) {
  if (!Number.isFinite(value)) return <span className="text-xs text-[var(--fg-muted)]">— {label}</span>
  const isPositive = value > 0
  const isNeutral = value === 0
  const favorable = direction === 'down' ? value < 0 : value > 0
  const color = isNeutral || direction === 'neutral'
    ? 'text-[var(--fg-muted)]'
    : favorable
      ? 'text-[var(--status-green)]'
      : 'text-[var(--status-red)]'
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={12} />
      {isPositive ? '+' : ''}{(value * 100).toFixed(1)}%
      <span className="text-[var(--fg-muted)] font-normal">{label}</span>
    </span>
  )
}

export function KPICard({ metric, delay = 0, tooltip, direction = 'neutral', hintUp, hintDown, comparison = 'mom' }: KPICardProps) {
  const { t } = usePreferences()

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      {/* Top row: name + status dot */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--fg-muted)]">
          {metric.name}
          {tooltip && <Info size={11} className="text-[var(--fg-muted)] opacity-40" />}
        </span>
        <StatusDot status={metric.traffic_light} />
      </div>

      {/* Large number */}
      <span
        className="text-3xl font-light tabular-nums text-[var(--fg-primary)] leading-none"
      >
        {Number.isFinite(metric.value) ? metric.formatted : '—'}
      </span>

      {/* Change badges + sparkline */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <ChangeBadge value={comparison === 'yoy' ? metric.change_yoy : metric.change_mom} label={comparison === 'yoy' ? t('YoY', 'Interanual') : t('MoM', 'Mensual')} direction={direction} />
        </div>
        <MiniSparkline data={metric.sparkline} />
      </div>
    </motion.div>
  )

  if (tooltip) {
    return (
      <KPITooltip content={tooltip} direction={direction} hintUp={hintUp!} hintDown={hintDown!}>
        {card}
      </KPITooltip>
    )
  }
  return card
}
