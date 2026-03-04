'use client'
import useSWR from 'swr'
import { olistFetcher } from '@/lib/olist-api'

export interface OlistFilters {
  category: string
  state: string
  paymentType: string
  yearStart: number
  yearEnd: number
}

function buildQuery(filters: OlistFilters): string {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.state) params.set('state', filters.state)
  if (filters.paymentType) params.set('payment_type', filters.paymentType)
  params.set('year_start', String(filters.yearStart))
  params.set('year_end', String(filters.yearEnd))
  return '?' + params.toString()
}

const SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
  errorRetryCount: 10,
  errorRetryInterval: 3000,
}

export function useCohortRetention(filters: OlistFilters) {
  return useSWR(`/api/v1/cohort-retention${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useLTVCurves(filters: OlistFilters) {
  return useSWR(`/api/v1/ltv-curves${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useGeoStates(filters: OlistFilters) {
  return useSWR(`/api/v1/geo-states${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useRFM(filters: OlistFilters) {
  return useSWR(`/api/v1/rfm${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useDeliveryReview(filters: OlistFilters) {
  return useSWR(`/api/v1/delivery-review${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useOlistKPIs(filters: OlistFilters) {
  return useSWR(`/api/v1/kpis${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useRevenueTrends(filters: OlistFilters) {
  return useSWR(`/api/v1/revenue-trends${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useCategoryBreakdown(filters: OlistFilters) {
  return useSWR(`/api/v1/category-breakdown${buildQuery(filters)}`, olistFetcher, SWR_CONFIG)
}

export function useOlistFilters() {
  return useSWR('/api/v1/filters', olistFetcher, { ...SWR_CONFIG, revalidateOnMount: true })
}
