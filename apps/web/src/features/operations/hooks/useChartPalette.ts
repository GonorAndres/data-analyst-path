'use client'
import { useEffect, useState } from 'react'
import { usePreferences } from '@/components/SitePreferences'

/** Read interpolated chart colors after the site applies its theme class. */
export function useChartPalette() {
  const { theme } = usePreferences()
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevision(value => value + 1))
    return () => cancelAnimationFrame(frame)
  }, [theme])
  return revision
}
