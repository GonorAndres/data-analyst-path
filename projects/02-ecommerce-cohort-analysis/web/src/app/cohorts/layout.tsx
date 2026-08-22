import { CohortShell } from '@/components/CohortShell'

/**
 * Wraps every /cohorts page in the nav and the shared filter state.
 *
 * A server component holding a client shell, so each route below can still
 * export its own `metadata` -- a `'use client'` layout cannot.
 */
export default function CohortsLayout({ children }: { children: React.ReactNode }) {
  return <CohortShell>{children}</CohortShell>
}
