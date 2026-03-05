'use client'
import { useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'

interface KPICardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  delay?: number
  valueColor?: string
}

export function KPICard({ label, value, prefix = '', suffix = '', decimals = 0, delay = 0, valueColor }: KPICardProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.6,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent = prefix + latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix
      },
    })
    return controls.stop
  }, [value, prefix, suffix, decimals, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col gap-1"
    >
      <span
        ref={ref}
        className="font-serif text-4xl md:text-5xl leading-none tabular-nums"
        style={{ color: valueColor || undefined }}
      >
        {prefix}0{suffix}
      </span>
      <p className="font-sans text-xs tracking-widest uppercase text-muted">{label}</p>
    </motion.div>
  )
}
