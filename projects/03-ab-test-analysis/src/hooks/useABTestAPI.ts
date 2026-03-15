'use client'
import useSWR from 'swr'
import { abtestFetcher } from '@/lib/abtest-api'

const swrConfig = { dedupingInterval: 60_000, errorRetryCount: 5 }

export function useOverview(qs: string) {
  return useSWR(`/api/v1/overview${qs}`, abtestFetcher, swrConfig)
}

export function useFrequentist(qs: string) {
  return useSWR(`/api/v1/frequentist${qs}`, abtestFetcher, swrConfig)
}

export function useBayesian(qs: string) {
  return useSWR(`/api/v1/bayesian${qs}`, abtestFetcher, swrConfig)
}

export function useSegments(qs: string) {
  return useSWR(`/api/v1/segments${qs}`, abtestFetcher, swrConfig)
}

export function usePower(qs: string) {
  return useSWR(`/api/v1/power${qs}`, abtestFetcher, swrConfig)
}

export function useSequential(qs: string) {
  return useSWR(`/api/v1/sequential${qs}`, abtestFetcher, swrConfig)
}

export function useFilters() {
  return useSWR('/api/v1/filters', abtestFetcher, { ...swrConfig, revalidateOnFocus: false })
}
