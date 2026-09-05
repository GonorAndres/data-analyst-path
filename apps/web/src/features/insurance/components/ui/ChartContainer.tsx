'use client'

import { AnalysisFigure } from '@/components/AnalysisFigure'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight: string
  children: React.ReactNode
  source?: React.ReactNode
  className?: string
  loading?: boolean
  error?: unknown
  empty?: boolean
}

export function ChartContainer(props: ChartContainerProps) {
  return <AnalysisFigure {...props} scrollable />
}
