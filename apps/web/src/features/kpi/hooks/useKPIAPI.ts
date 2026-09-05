'use client'
import useSWR from 'swr'
import { kpiFetcher } from '@/features/kpi/lib/kpi-api'
import type {
  OverviewResponse,
  RevenueResponse,
  CustomerResponse,
  ForecastResponse,
  AnomalyResponse,
  FiltersResponse,
} from '@/features/kpi/types/kpi-types'

const swrConfig = { dedupingInterval: 60_000, errorRetryCount: 5 }

export function useOverview(qs: string) {
  return useSWR<OverviewResponse>(`/api/kpi/api/v1/overview${qs}`, kpiFetcher, swrConfig)
}

export function useRevenue(qs: string) {
  return useSWR<RevenueResponse>(`/api/kpi/api/v1/revenue${qs}`, kpiFetcher, swrConfig)
}

export function useCustomers(qs: string) {
  return useSWR<CustomerResponse>(`/api/kpi/api/v1/customers${qs}`, kpiFetcher, swrConfig)
}

export function useForecast(qs: string) {
  return useSWR<ForecastResponse>(`/api/kpi/api/v1/forecast${qs}`, kpiFetcher, swrConfig)
}

export function useAnomalies(qs: string) {
  return useSWR<AnomalyResponse>(`/api/kpi/api/v1/anomalies${qs}`, kpiFetcher, swrConfig)
}

export function useFilters() {
  return useSWR<FiltersResponse>('/api/kpi/api/v1/filters', kpiFetcher, { ...swrConfig, revalidateOnFocus: false })
}
