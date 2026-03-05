import type { Metadata } from 'next'
import { OlistDashboard } from '@/components/olist/OlistDashboard'

export const metadata: Metadata = {
  title: 'Olist E-Commerce — Andrés González Ortega',
  description: 'Análisis de cohortes, retención de clientes y LTV en el marketplace de e-commerce más grande de Brasil.',
}

export default function OlistPage() {
  return <OlistDashboard />
}
