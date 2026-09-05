'use client'

import { AnalysisFigure } from '@/components/AnalysisFigure'
import { FeatureText } from '@/features/portfolio/FeatureText'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  insight?: string
  children: React.ReactNode
  source?: React.ReactNode
  className?: string
}

export function ChartContainer(props: ChartContainerProps) {
  return <FeatureText><AnalysisFigure {...props} insight={props.insight && <FeatureText>{props.insight}</FeatureText>} /></FeatureText>
}
