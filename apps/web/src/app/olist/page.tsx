import type { Metadata } from 'next'
import { OlistDashboard } from '@/features/market/components/olist/OlistDashboard'

export const metadata: Metadata = {
  title: 'Olist E-Commerce — Andrés González Ortega',
  description: 'Marketplace revenue, customer retention, and lifetime value in the Brazilian Olist marketplace.',
}

export default function OlistPage() {
  return <OlistDashboard />
}
