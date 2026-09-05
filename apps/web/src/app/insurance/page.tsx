import type { Metadata } from 'next'
import { InsuranceDashboard } from '@/features/insurance/components/insurance/InsuranceDashboard'

export const metadata: Metadata = {
  icons: { icon: '/insurance/favicon.svg' },
  title: 'Reserves and Claims — Andrés González Ortega',
  description: 'Development triangles, IBNR estimates, and combined ratios across insurance lines using CAS/NAIC data.',
}

export default function InsurancePage() {
  return <InsuranceDashboard />
}
