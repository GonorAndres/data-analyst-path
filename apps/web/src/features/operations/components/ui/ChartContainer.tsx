'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { ReactNode } from 'react'

interface ChartContainerProps {
  title: string
  subtitle?: string
  loading?: boolean
  children: ReactNode
  className?: string
}

export function ChartContainer({ title, subtitle, loading, children, className = '' }: ChartContainerProps) {
  return (
    <FeatureText><div className={`glass-card ${className}`}>
      <div className="px-5 pt-4 pb-2">
        <h3 className="font-sans text-lg font-semibold text-ops-text">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-xs text-ops-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-5 pb-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-ops-surface-hover animate-pulse" />
            <div className="h-40 bg-ops-surface-hover animate-pulse" />
            <div className="h-4 w-2/3 bg-ops-surface-hover animate-pulse" />
          </div>
        ) : (
          children
        )}
      </div>
    </div></FeatureText>
  )
}
