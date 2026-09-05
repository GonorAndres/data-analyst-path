'use client'

import { AnalysisFigure } from '@/components/AnalysisFigure'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight: string
  children: React.ReactNode
  source?: React.ReactNode
  className?: string
}

export function ChartContainer(props: ChartContainerProps) {
  return <AnalysisFigure {...props} />
}
