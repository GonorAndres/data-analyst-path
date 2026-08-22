'use client'

import { useEffect, useState } from 'react'
import type {
  Activation,
  Cohorts,
  Geography,
  Meta,
  Overview,
  Segments,
  Survival,
} from './types'

/**
 * Loads the JSON files that back this dashboard, per page rather than all at once.
 *
 * They are fetched at runtime rather than imported at build time on purpose:
 * `geography.json` alone is 240 KB, and importing it would inline all of it into
 * the JS bundle, where it costs parse time on every visit and cannot be cached
 * separately from the code.
 *
 * Each page asks for the files it draws. That matters most for geography, which
 * is 87% of the total payload and is read by exactly one of the six pages -- the
 * first version of this hook fetched all seven files upfront, so every visitor to
 * the overview paid for the state-level data whether or not they ever opened it.
 *
 * Responses are memoised across navigations in a module-level cache. The pages
 * are client-side routes over a static export, so moving between them does not
 * reload the document and a second visit costs nothing.
 */

interface FileMap {
  meta: Meta
  overview: Overview
  cohorts: Cohorts
  segments: Segments
  geography: Geography
  survival: Survival
  activation: Activation
}

export type FileName = keyof FileMap

/** In-flight and settled requests, keyed by file. Promises, not values, so two
 *  components mounting in the same tick share one request. */
const cache = new Map<FileName, Promise<unknown>>()

function load(name: FileName): Promise<unknown> {
  const hit = cache.get(name)
  if (hit) return hit

  // The path is relative to the app's own slug, because seven apps share this
  // origin -- see the public/ rule in the repo's CLAUDE.md.
  const request = fetch(`/cohorts/data/${name}.json`).then((res) => {
    if (!res.ok) throw new Error(`${name}.json -> ${res.status}`)
    return res.json()
  })

  // A failed fetch is not cached: leaving a rejected promise in the map would
  // make a transient network error permanent for the rest of the session.
  request.catch(() => cache.delete(name))
  cache.set(name, request)
  return request
}

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T }

/**
 * Fetches the named files and returns them keyed by name.
 *
 * `names` is read on the first render only. Every caller passes a literal array,
 * so re-reading it would restart the fetch on each render for no benefit -- and
 * with a mutable dependency it would loop.
 */
export function useData<K extends FileName>(names: readonly K[]): LoadState<Pick<FileMap, K>> {
  const [state, setState] = useState<LoadState<Pick<FileMap, K>>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    Promise.all(names.map(async (name) => [name, await load(name)] as const))
      .then((entries) => {
        if (cancelled) return
        setState({ status: 'ready', data: Object.fromEntries(entries) as Pick<FileMap, K> })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: String(err) })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
