'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number
  format?: (n: number) => string
  accentColor?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

function useCountUp(target: number, duration: number = 1200) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    let animationFrame: number

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(target * eased)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCurrent(target)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration, isInView])

  return { current, ref }
}

export function KPICard({
  label,
  value,
  format = (n) => n.toLocaleString('es-MX'),
  accentColor,
  trend,
}: KPICardProps) {
  const { current, ref } = useCountUp(value)

  return (
    <div className="border border-ops-border bg-ops-surface p-5">
      <p className="font-sans text-xs uppercase tracking-widest text-ops-text-muted mb-2">
        {label}
      </p>
      <motion.span
        ref={ref}
        className="block font-mono text-3xl tabular-nums"
        style={{ color: accentColor || 'var(--ops-text)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {format(current)}
      </motion.span>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-ops-green" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-ops-red" />
          )}
          <span
            className={`font-mono text-xs tabular-nums ${
              trend.direction === 'up' ? 'text-ops-green' : 'text-ops-red'
            }`}
          >
            {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
