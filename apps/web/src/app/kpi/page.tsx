import { KPIDashboard } from '@/features/kpi/components/kpi/KPIDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Executive KPI Report — Andrés González Ortega',
  description: 'Revenue, customer analytics, forecasting, and executive reporting.',
  icons: { icon: '/kpi/favicon.svg' },
}

export default function KPIPage() {
  return <KPIDashboard />
}
