'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

export type Period = '1y' | '2y' | '3y' | '5y'

interface PortfolioContextType {
  period: Period
  setPeriod: (p: Period) => void
}

const PortfolioContext = createContext<PortfolioContextType | null>(null)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('3y')

  return (
    <PortfolioContext.Provider value={{ period, setPeriod }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider')
  return ctx
}
