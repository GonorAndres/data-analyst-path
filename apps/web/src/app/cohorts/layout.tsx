import { CohortShell } from '@/features/cohorts/components/CohortShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer Retention — Olist E-Commerce',
  description: 'Customer retention, cohorts, RFM segmentation, and customer lifetime value.',
  icons: { icon: '/cohorts/favicon.svg' },
}

/**
 * Wraps every /cohorts page in the nav and the shared filter state.
 *
 * A server component holding a client shell, so each route below can still
 * export its own `metadata` -- a `'use client'` layout cannot.
 */
export default function CohortsLayout({ children }: { children: React.ReactNode }) {
  return <CohortShell>{children}</CohortShell>
}
