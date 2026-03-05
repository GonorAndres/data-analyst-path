'use client'
import { createContext, useContext, useState } from 'react'

interface InsuranceFilterContextValue {
  lob: string
  setLob: (v: string) => void
  company: string
  setCompany: (v: string) => void
  yearStart: number
  setYearStart: (v: number) => void
  yearEnd: number
  setYearEnd: (v: number) => void
}

const InsuranceFilterContext = createContext<InsuranceFilterContextValue>({
  lob: '',
  setLob: () => {},
  company: '',
  setCompany: () => {},
  yearStart: 1988,
  setYearStart: () => {},
  yearEnd: 1997,
  setYearEnd: () => {},
})

export function InsuranceFilterProvider({ children }: { children: React.ReactNode }) {
  const [lob, setLob] = useState('')
  const [company, setCompany] = useState('')
  const [yearStart, setYearStart] = useState(1988)
  const [yearEnd, setYearEnd] = useState(1997)

  return (
    <InsuranceFilterContext.Provider value={{ lob, setLob, company, setCompany, yearStart, setYearStart, yearEnd, setYearEnd }}>
      {children}
    </InsuranceFilterContext.Provider>
  )
}

export function useInsuranceFilter() {
  return useContext(InsuranceFilterContext)
}
