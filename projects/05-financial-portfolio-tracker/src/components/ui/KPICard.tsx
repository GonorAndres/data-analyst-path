'use client'
import { useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { HelpCircle } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  delay?: number
  trend?: 'up' | 'down' | 'neutral'
  tooltip?: string
}

export function KPICard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  delay = 0,
  trend,
  tooltip,
}: KPICardProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.6,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent =
          prefix +
          latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
          suffix
      },
    })
    return controls.stop
  }, [value, prefix, suffix, decimals, delay])

  const trendColor =
    trend === 'up'
      ? 'text-gain'
      : trend === 'down'
        ? 'text-loss'
        : 'text-muted'

  const trendArrow =
    trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card glow-violet flex flex-col gap-1.5 p-4"
    >
      <div className="flex items-baseline gap-2">
        <span
          ref={ref}
          className={`font-mono text-2xl md:text-3xl font-bold leading-none tabular-nums ${trendColor}`}
        >
          {prefix}0{suffix}
        </span>
        {trendArrow && (
          <span className={`text-xs ${trendColor}`}>{trendArrow}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <p className="font-sans text-[11px] tracking-widest uppercase text-muted">
          {label}
        </p>
        {tooltip && (
          <div className="group relative">
            <HelpCircle className="w-3.5 h-3.5 text-muted-dim cursor-help transition-colors group-hover:text-accent" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg border p-2.5 text-xs leading-relaxed font-sans text-ink opacity-0 transition-opacity group-hover:opacity-100 z-50" style={{ background: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)' }}>
              {tooltip}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
