'use client'
import { useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_OLIST_API_URL || '/api/olist'

export function BackendWarmup() {
  useEffect(() => {
    fetch(`${API_BASE}/health`).catch(() => {
      // Silent — backend may be sleeping on Cloud Run, this just wakes it up.
      // We don't need the response, only the side effect of triggering the container.
    })
  }, [])

  return null
}
