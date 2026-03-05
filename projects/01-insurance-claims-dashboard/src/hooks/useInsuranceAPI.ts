'use client'
import useSWR from 'swr'
import { insuranceFetcher } from '@/lib/insurance-api'

export interface InsuranceFilters {
  lob: string
  company: string
  yearStart: number
  yearEnd: number
}

function buildQuery(filters: InsuranceFilters): string {
  const params = new URLSearchParams()
  if (filters.lob) params.set('lob', filters.lob)
  if (filters.company) params.set('company', filters.company)
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

export function useInsuranceKPIs(filters: InsuranceFilters) {
  return useSWR(`/api/v1/kpis${buildQuery(filters)}`, insuranceFetcher, SWR_CONFIG)
}

export function useLossTriangle(filters: InsuranceFilters, type: 'incurred' | 'paid' = 'incurred', method: 'cl' | 'bf' = 'cl') {
  return useSWR(`/api/v1/loss-triangle${buildQuery(filters)}&type=${type}&method=${method}`, insuranceFetcher, SWR_CONFIG)
}

export function useCLvsBF(filters: InsuranceFilters, type: 'incurred' | 'paid' = 'paid') {
  return useSWR(`/api/v1/cl-vs-bf${buildQuery(filters)}&type=${type}`, insuranceFetcher, SWR_CONFIG)
}

export function useFrequencySeverity(filters: InsuranceFilters) {
  return useSWR(`/api/v1/frequency-severity${buildQuery(filters)}`, insuranceFetcher, SWR_CONFIG)
}

export function useLossRatios(filters: InsuranceFilters) {
  return useSWR(`/api/v1/loss-ratios${buildQuery(filters)}`, insuranceFetcher, SWR_CONFIG)
}

export function useCombinedRatio(filters: InsuranceFilters) {
  return useSWR(`/api/v1/combined-ratio${buildQuery(filters)}`, insuranceFetcher, SWR_CONFIG)
}

export function useClaimDistribution(filters: InsuranceFilters) {
  return useSWR(`/api/v1/claim-distribution${buildQuery(filters)}`, insuranceFetcher, SWR_CONFIG)
}

export function useInsuranceFilters() {
  return useSWR('/api/v1/filters', insuranceFetcher, { ...SWR_CONFIG, revalidateOnMount: true })
}
