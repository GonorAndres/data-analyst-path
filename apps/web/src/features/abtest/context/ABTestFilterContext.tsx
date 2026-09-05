'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface ABTestFilters {
  device_type: string
  browser: string
  country: string
  user_segment: string
  traffic_source: string
}

interface ABTestFilterContextType {
  filters: ABTestFilters
  setFilters: (f: Partial<ABTestFilters>) => void
  resetFilters: () => void
  queryString: string
}

const defaults: ABTestFilters = {
  device_type: '',
  browser: '',
  country: '',
  user_segment: '',
  traffic_source: '',
}

const ABTestFilterContext = createContext<ABTestFilterContextType | null>(null)

export function ABTestFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<ABTestFilters>(defaults)

  function setFilters(partial: Partial<ABTestFilters>) {
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
    <ABTestFilterContext.Provider value={{ filters, setFilters, resetFilters, queryString }}>
      {children}
    </ABTestFilterContext.Provider>
  )
}

export function useABTestFilters() {
  const ctx = useContext(ABTestFilterContext)
  if (!ctx) throw new Error('useABTestFilters must be used inside ABTestFilterProvider')
  return ctx
}
