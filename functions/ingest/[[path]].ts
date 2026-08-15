/**
 * Same-origin proxy to PostHog.
 *
 * Every dashboard used to call `us.i.posthog.com` directly, which content
 * blockers drop on sight -- taking with it both the events and the lazily
 * loaded session-replay recorder. Served from the site's own origin, the
 * requests look like any other first-party traffic.
 *
 * PostHog splits its traffic across two hosts and both have to be reachable
 * through this one path:
 *
 *   /ingest/static/*  ->  us-assets.i.posthog.com   (array.js, recorder bundle)
 *   /ingest/*         ->  us.i.posthog.com          (capture, flags, decide)
 *
 * The layouts set `api_host: '/ingest'` -- relative, not the absolute canonical
 * host the snippet reference shows. A relative value resolves against whatever
 * origin is serving the page, so preview deployments on *.pages.dev proxy
 * through themselves instead of making a cross-origin request to production,
 * which this Function grants no CORS for and which would silently drop every
 * preview event. `ui_host` still points at the real dashboard so toolbar links
 * work.
 */

import { forwardHeaders, passthroughHeaders } from '../_shared'

const ASSET_HOST = 'https://us-assets.i.posthog.com'
const API_HOST = 'https://us.i.posthog.com'

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context

  const segments = (params.path as string[] | undefined) ?? []
  const isAsset = segments[0] === 'static'
  const target = new URL(`${isAsset ? ASSET_HOST : API_HOST}/${segments.join('/')}`)
  target.search = new URL(request.url).search

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  const upstream = await fetch(target, {
    method: request.method,
    headers: forwardHeaders(request),
    body: hasBody ? request.body : undefined,
  })

  const headers = passthroughHeaders(upstream)
  if (isAsset) {
    // array.js and the recorder are versioned by PostHog and safe to hold.
    headers.set('cache-control', 'public, max-age=3600')
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}
