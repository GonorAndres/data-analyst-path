/**
 * Same-origin proxy from the merged dashboard site to the consolidated FastAPI
 * service on Cloud Run.
 *
 * The six dashboards each fetch a relative `/api/<service>/...` path -- that is
 * what `src/lib/*-api.ts` falls back to when NEXT_PUBLIC_*_API_URL is unset,
 * and a couple of components hardcode it outright. On Vercel a Next.js
 * `rewrites()` rule served those paths; a static export has no server, so this
 * Function takes over. Keeping the calls same-origin is why no CORS
 * configuration changed anywhere in the backend.
 *
 *   /api/insurance/api/v1/kpis  ->  ${ORIGIN}/insurance/api/v1/kpis
 *
 * The service segment is checked against a fixed list rather than forwarded
 * blindly, so this cannot be used as an open proxy to arbitrary paths on the
 * origin.
 */

import { passthroughHeaders } from '../_shared'

interface Env {
  API_ORIGIN?: string
}

const DEFAULT_ORIGIN = 'https://da-portfolio-api-451451662791.us-central1.run.app'

// The sub-applications mounted by backend/main.py. Anything else is a 404 here
// rather than a request to the origin.
const SERVICES = new Set(['insurance', 'olist', 'abtest', 'kpi', 'portfolio', 'ops'])

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context

  // Read-only dashboards: everything they do is a GET, and the backend's own
  // CORS config allows only GET. Rejecting the rest here keeps the proxy from
  // being a wider surface than the thing it fronts.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
  }

  const segments = (params.path as string[] | undefined) ?? []
  const [service, ...rest] = segments

  if (!service || !SERVICES.has(service)) {
    return Response.json(
      { error: 'unknown service', service: service ?? null, known: [...SERVICES] },
      { status: 404 },
    )
  }

  const origin = env.API_ORIGIN ?? DEFAULT_ORIGIN
  const target = new URL(`${origin}/${service}/${rest.join('/')}`)
  target.search = new URL(request.url).search

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: { accept: request.headers.get('accept') ?? 'application/json' },
    })
  } catch (cause) {
    // Cloud Run runs at min-instances=0, so a cold start can exceed the
    // dashboards' patience. They already render a ColdStartBanner on failure;
    // 504 is the status that tells them to keep retrying rather than give up.
    return Response.json(
      { error: 'upstream unreachable', service, detail: String(cause) },
      { status: 504 },
    )
  }

  const headers = passthroughHeaders(upstream)
  if (upstream.ok) {
    // Responses are derived from static parquet files that only change on
    // redeploy, so an edge cache costs nothing and hides most cold starts.
    headers.set('cache-control', 'public, max-age=60, s-maxage=300')
  } else {
    // Never cache a failure. Cloud Run runs at min-instances=0, so the first
    // request after an idle period can fail purely from a cold start -- and the
    // ColdStartBanner's job is to poll /health until it recovers. A cached 5xx
    // would answer every one of those polls from the browser cache and leave
    // the banner up on a backend that came back seconds later.
    headers.set('cache-control', 'no-store')
  }
  headers.delete('access-control-allow-origin') // same-origin now; no CORS needed

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}
