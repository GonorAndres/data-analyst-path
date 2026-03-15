'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface OpsFilters {
  agency: string
  complaint_type: string
  borough: string
  channel: string
  year_month: string
}

interface OpsFilterContextType {
  filters: OpsFilters
  setFilters: (f: Partial<OpsFilters>) => void
  resetFilters: () => void
  queryString: string
}

const defaults: OpsFilters = {
  agency: '',
  complaint_type: '',
  borough: '',
  channel: '',
  year_month: '',
}

const OpsFilterContext = createContext<OpsFilterContextType | null>(null)

export function OpsFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<OpsFilters>(defaults)

  function setFilters(partial: Partial<OpsFilters>) {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }

  function resetFilters() {
    setFiltersState(defaults)
  }

  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v)
  }
  const queryString = params.toString() ? `?${params.toString()}` : ''

  return (
    <OpsFilterContext.Provider value={{ filters, setFilters, resetFilters, queryString }}>
      {children}
    </OpsFilterContext.Provider>
  )
}

export function useOpsFilters() {
  const ctx = useContext(OpsFilterContext)
  if (!ctx) throw new Error('useOpsFilters debe usarse dentro de OpsFilterProvider')
  return ctx
}
