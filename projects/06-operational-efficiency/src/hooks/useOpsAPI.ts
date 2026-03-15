'use client'
import useSWR from 'swr'
import { opsFetcher } from '@/lib/ops-api'

const swrConfig = { dedupingInterval: 60_000, errorRetryCount: 5 }

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useOpsOverview(qs: string) {
  return useSWR<any>(`/api/v1/overview${qs}`, opsFetcher, swrConfig)
}

export function useOpsBotleneck(qs: string) {
  return useSWR<any>(`/api/v1/bottleneck${qs}`, opsFetcher, swrConfig)
}

export function useOpsDepartments(qs: string) {
  return useSWR<any>(`/api/v1/departments${qs}`, opsFetcher, swrConfig)
}

export function useOpsGeographic(qs: string) {
  return useSWR<any>(`/api/v1/geographic${qs}`, opsFetcher, swrConfig)
}

export function useOpsTrends(qs: string) {
  return useSWR<any>(`/api/v1/trends${qs}`, opsFetcher, swrConfig)
}

export function useOpsPareto(qs: string) {
  return useSWR<any>(`/api/v1/pareto${qs}`, opsFetcher, swrConfig)
}

export function useOpsFilters() {
  return useSWR<any>('/api/v1/filters', opsFetcher, { ...swrConfig, revalidateOnFocus: false })
}
