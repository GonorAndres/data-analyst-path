// In dev: browser calls localhost:3050/api/olist/... → Next.js rewrites to localhost:2050/...
// In production: leave NEXT_PUBLIC_OLIST_API_URL unset. The relative default is
//   the point -- it resolves to the hub's /api/olist Pages Function, which proxies
//   to Cloud Run server-side and keeps the origin out of the client bundle.
//   scripts/build-hub.mjs strips NEXT_PUBLIC_*_API_URL from the build env so an
//   absolute URL cannot be baked in by accident and quietly bypass that proxy.
const API_BASE = process.env.NEXT_PUBLIC_OLIST_API_URL || '/api/olist'

export async function olistFetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
