'use client'
import useSWR from 'swr'
import { portfolioFetcher } from '@/lib/portfolio-api'

const swrConfig = { dedupingInterval: 60_000, errorRetryCount: 3 }

export function useOverview(period: string) {
  return useSWR(`/api/v1/overview?period=${period}`, portfolioFetcher, swrConfig)
}

export function usePerformance(period: string) {
  return useSWR(`/api/v1/performance?period=${period}`, portfolioFetcher, swrConfig)
}

export function useRisk(period: string) {
  return useSWR(`/api/v1/risk?period=${period}`, portfolioFetcher, swrConfig)
}

export function useCorrelation(period: string) {
  return useSWR(`/api/v1/correlation?period=${period}`, portfolioFetcher, swrConfig)
}

export function useMonteCarlo(
  period: string,
  days: number,
  simulations: number,
  initialValue: number,
  target: number
) {
  const params = new URLSearchParams({
    period,
    days: String(days),
    simulations: String(simulations),
    initial_value: String(initialValue),
    target_return: String(target),
  })
  return useSWR(`/api/v1/montecarlo?${params}`, portfolioFetcher, swrConfig)
}

export function useFrontier(period: string) {
  return useSWR(`/api/v1/frontier?period=${period}`, portfolioFetcher, swrConfig)
}
