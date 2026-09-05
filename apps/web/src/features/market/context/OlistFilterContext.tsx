'use client'
import { createContext, useContext, useState } from 'react'

interface OlistFilterContextValue {
  category: string
  setCategory: (v: string) => void
  state: string
  setState: (v: string) => void
  paymentType: string
  setPaymentType: (v: string) => void
  yearStart: number
  setYearStart: (v: number) => void
  yearEnd: number
  setYearEnd: (v: number) => void
}

const OlistFilterContext = createContext<OlistFilterContextValue>({
  category: '',
  setCategory: () => {},
  state: '',
  setState: () => {},
  paymentType: '',
  setPaymentType: () => {},
  yearStart: 2016,
  setYearStart: () => {},
  yearEnd: 2018,
  setYearEnd: () => {},
})

export function OlistFilterProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState('')
  const [state, setState] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [yearStart, setYearStart] = useState(2016)
  const [yearEnd, setYearEnd] = useState(2018)

  return (
    <OlistFilterContext.Provider value={{ category, setCategory, state, setState, paymentType, setPaymentType, yearStart, setYearStart, yearEnd, setYearEnd }}>
      {children}
    </OlistFilterContext.Provider>
  )
}

export function useOlistFilter() {
  return useContext(OlistFilterContext)
}
