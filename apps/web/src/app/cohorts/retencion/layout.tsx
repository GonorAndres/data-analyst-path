import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cohort retention — Olist',
  description:
    'Retention heatmaps, average curves with confidence intervals, cohort comparisons, and Kaplan–Meier survival.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
