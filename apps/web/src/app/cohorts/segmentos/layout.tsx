import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer segments — Olist',
  description:
    'RFM customer segments, recency and frequency, lifetime value, activation factors, and revenue concentration.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
