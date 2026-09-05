'use client'

import { useSyncExternalStore } from 'react'

const EVENT = 'analyst:section'
function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener)
  window.addEventListener(EVENT, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(EVENT, listener)
  }
}

export type CaseView = 'story' | 'explore' | 'methods'
export function useCaseView(nested = false): [CaseView, (view: CaseView) => void] {
  const view = useSyncExternalStore(subscribe, () => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'methods') return 'methods'
    if (params.get('view') === 'explore' || params.has('section') || nested) return 'explore'
    return 'story'
  }, () => nested ? 'explore' : 'story')
  function select(next: CaseView) {
    const url = new URL(window.location.href)
    url.searchParams.delete('section')
    if (next === 'story') url.searchParams.delete('view')
    else url.searchParams.set('view', next)
    url.hash = ''
    if (url.href === window.location.href) return
    window.history.pushState(null, '', url.pathname + url.search)
    window.dispatchEvent(new Event(EVENT))
    requestAnimationFrame(() => {
      const navigation = document.querySelector<HTMLElement>('.case-view-nav')
      navigation?.scrollIntoView({ block: 'start' })
      navigation?.querySelector<HTMLElement>('[aria-current="page"]')?.focus({ preventScroll: true })
    })
  }
  return [view, select]
}
