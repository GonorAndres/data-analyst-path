import type { Metadata } from 'next'
import { ABTestDashboard } from '@/features/abtest/components/abtest/ABTestDashboard'

export const metadata: Metadata = {
  icons: { icon: '/abtest/favicon.svg' },
  title: 'A/B Test Lab -- E-Commerce Conversion Experiment',
}

export default function ABTestPage() {
  return <ABTestDashboard />
}
