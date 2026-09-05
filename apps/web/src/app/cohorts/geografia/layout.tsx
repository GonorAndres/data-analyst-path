import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Geographic analysis — Olist',
  description:
    'Retention, delivery time, satisfaction, and the association between logistics and repeat purchases across Brazilian states.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
