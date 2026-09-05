import type { Metadata } from 'next'
import { OpsDashboard } from '@/features/operations/components/ops/OpsDashboard'

export const metadata: Metadata = {
  icons: { icon: '/operations/favicon.svg' },
  title: 'Centro de Operaciones NYC 311',
}

export default function OperationsPage() {
  return <OpsDashboard />
}
