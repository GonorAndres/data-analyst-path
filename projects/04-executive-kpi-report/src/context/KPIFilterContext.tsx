'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface KPIFilters {
  segment: string
  start_month: string
  end_month: string
  comparison: string
}

interface KPIFilterContextType {
  filters: KPIFilters
  setFilters: (f: Partial<KPIFilters>) => void
  resetFilters: () => void
  queryString: string
}

const defaults: KPIFilters = {
  segment: '',
  start_month: '',
  end_month: '',
  comparison: 'mom',
}

const KPIFilterContext = createContext<KPIFilterContextType | null>(null)

export function KPIFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<KPIFilters>(defaults)

  function setFilters(partial: Partial<KPIFilters>) {
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
    <KPIFilterContext.Provider value={{ filters, setFilters, resetFilters, queryString }}>
      {children}
    </KPIFilterContext.Provider>
  )
}

export function useKPIFilters() {
  const ctx = useContext(KPIFilterContext)
  if (!ctx) throw new Error('useKPIFilters must be used inside KPIFilterProvider')
  return ctx
}
