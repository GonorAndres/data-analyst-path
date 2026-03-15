'use client'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { KPITooltip } from './KPITooltip'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ title, subtitle, insight, description, children, className = '' }: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card p-6 ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-[var(--fg-primary)]">{title}</h3>
          {description && (
            <KPITooltip content={description} direction="neutral" hintUp="" hintDown="">
              <Info size={14} className="text-[var(--fg-muted)] opacity-50 cursor-default" />
            </KPITooltip>
          )}
        </div>
      )}
      {subtitle && (
        <p className="text-sm text-[var(--fg-muted)] mb-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {insight && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20">
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
            {insight}
          </p>
        </div>
      )}
      <div className="w-full">{children}</div>
    </motion.div>
  )
}
