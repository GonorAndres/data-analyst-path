import type { Metadata } from 'next'
import { ABTestDashboard } from '@/components/abtest/ABTestDashboard'

export const metadata: Metadata = {
  title: 'A/B Test Lab -- E-Commerce Conversion Experiment',
}

export default function ABTestPage() {
  return <ABTestDashboard />
}
