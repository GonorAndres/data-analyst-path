'use client'
import { motion } from 'framer-motion'

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col gap-1"
    >
      <span
        className="font-sans text-xl md:text-2xl leading-none tabular-nums"
        style={{ color: valueColor || undefined }}
      >
        {Number.isFinite(value) ? `${prefix}${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}` : '—'}
      </span>
      <p className="font-sans text-xs tracking-widest uppercase text-muted">{label}</p>
    </motion.div>
  )
}
