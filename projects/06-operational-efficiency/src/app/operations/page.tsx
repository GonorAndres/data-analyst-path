import type { Metadata } from 'next'
import { OpsDashboard } from '@/components/ops/OpsDashboard'

export const metadata: Metadata = {
  title: 'Centro de Operaciones NYC 311',
}

export default function OperationsPage() {
  return <OpsDashboard />
}
