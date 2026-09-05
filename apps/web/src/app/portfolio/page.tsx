import type { Metadata } from 'next'
import { PortfolioDashboard } from '@/features/portfolio/components/portfolio/PortfolioDashboard'

export const metadata: Metadata = {
  icons: { icon: '/portfolio/favicon.svg' },
  title: 'Portfolio Tracker -- Financial Analytics Dashboard',
}

export default function PortfolioPage() {
  return <PortfolioDashboard />
}
