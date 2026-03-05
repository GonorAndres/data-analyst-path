import type { Metadata } from 'next'
import { InsuranceDashboard } from '@/components/insurance/InsuranceDashboard'

export const metadata: Metadata = {
  title: 'Reservas y Siniestralidad — Andres Gonzalez Ortega',
  description: 'Triangulos de desarrollo, estimacion IBNR y ratios combinados para lineas de negocio de seguros. Datos CAS/NAIC.',
}

export default function InsurancePage() {
  return <InsuranceDashboard />
}
