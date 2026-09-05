'use client'
import { ChartState } from '@/components/ChartState'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight: string
  children: React.ReactNode
  className?: string
  loading?: boolean
  error?: unknown
  empty?: boolean
}

export function ChartContainer({ title, subtitle, insight, children, className = '', loading, error, empty }: ChartContainerProps) {
  return (
    <div className={`py-10 border-t border-border ${className}`}>
      {title && (
        <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-ink mb-2">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-sans text-sm text-muted mb-6 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {!loading && !error && !empty && <p className="font-sans text-base leading-snug text-ink max-w-2xl mb-8">
        {insight}
      </p>}
      <div className="w-full min-w-0 overflow-x-auto"><ChartState loading={loading} error={error} empty={empty}>{children}</ChartState></div>
    </div>
  )
}
