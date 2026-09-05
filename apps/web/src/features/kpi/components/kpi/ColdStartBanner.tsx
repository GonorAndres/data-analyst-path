'use client'
import { ServiceStatus } from '@/components/ServiceStatus'

export function ColdStartBanner() {
  return <ServiceStatus service="kpi" />
}
