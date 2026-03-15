import type { Metadata } from 'next'
import { PortfolioDashboard } from '@/components/portfolio/PortfolioDashboard'

export const metadata: Metadata = {
  title: 'Portfolio Tracker -- Financial Analytics Dashboard',
}

export default function PortfolioPage() {
  return <PortfolioDashboard />
}
