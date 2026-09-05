'use client'

import { useCallback, useSyncExternalStore } from 'react'

const EVENT = 'analyst:section'
function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener)
  window.addEventListener(EVENT, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(EVENT, listener)
  }
}

/** Bookmarkable sections without changing existing static route paths. */
export function useSection(defaultSection: string, validSections: readonly string[]): [string, (section: string) => void] {
  const section = useSyncExternalStore(subscribe, () => {
    const candidate = new URLSearchParams(window.location.search).get('section')
    return candidate && validSections.includes(candidate) ? candidate : defaultSection
  }, () => defaultSection)
  const select = useCallback((next: string) => {
    if (!validSections.includes(next)) return
    const url = new URL(window.location.href)
    if (next === defaultSection) url.searchParams.delete('section')
    else url.searchParams.set('section', next)
    if (url.href === window.location.href) return
    window.history.pushState(null, '', url.pathname + url.search + url.hash)
    window.dispatchEvent(new Event(EVENT))
  }, [defaultSection, validSections])
  return [section, select]
}
