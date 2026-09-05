'use client'

import { AnalysisFigure } from '@/components/AnalysisFigure'
import { FeatureText } from '@/features/portfolio/FeatureText'

interface ChartContainerProps {
  title: string
  subtitle?: string
  loading?: boolean
  children: React.ReactNode
  source?: React.ReactNode
  className?: string
}

export function ChartContainer(props: ChartContainerProps) {
  return <FeatureText><AnalysisFigure {...props} headingLevel={3} /></FeatureText>
}
