'use client'
import { useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import type { KPIMetric } from '@/types/kpi-types'
import { KPITooltip } from './KPITooltip'

interface KPICardProps {
  metric: KPIMetric
  delay?: number
  tooltip?: string
  direction?: 'up' | 'down' | 'neutral'
  hintUp?: string
  hintDown?: string
}

function MiniSparkline({ data }: { data: number[] }) {
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

  const gradientId = `spark-${Math.random().toString(36).slice(2)}`

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

function ChangeBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0
  const isNeutral = value === 0
  const color = isNeutral
    ? 'text-[var(--fg-muted)]'
    : isPositive
      ? 'text-[var(--status-green)]'
      : 'text-[var(--status-red)]'
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={12} />
      {isPositive ? '+' : ''}{value.toFixed(1)}%
      <span className="text-[var(--fg-muted)] font-normal">{label}</span>
    </span>
  )
}

export function KPICard({ metric, delay = 0, tooltip, direction = 'neutral', hintUp, hintDown }: KPICardProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, metric.value, {
      duration: 1.4,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent = metric.formatted.includes('$')
          ? '$' + latest.toLocaleString('en-US', { maximumFractionDigits: 0 })
          : metric.formatted.includes('%')
            ? latest.toFixed(1) + '%'
            : metric.formatted.includes('x')
              ? latest.toFixed(1) + 'x'
              : latest.toFixed(0)
      },
    })
    return controls.stop
  }, [metric.value, metric.formatted, delay])

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
        ref={ref}
        className="text-3xl font-light tabular-nums text-[var(--fg-primary)] leading-none"
      >
        {metric.formatted}
      </span>

      {/* Change badges + sparkline */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <ChangeBadge value={metric.change_mom} label="MoM" />
          {metric.change_yoy !== 0 && (
            <ChangeBadge value={metric.change_yoy} label="YoY" />
          )}
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
