import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Technical evidence — Olist cohort analysis',
  description:
    'Four original Jupyter notebooks documenting data cleaning, exploration, retention, RFM, and lifetime value.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
