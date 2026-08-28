// In dev: browser calls localhost:3051/api/insurance/... -> Next.js rewrites to localhost:2051/...
// In production: leave NEXT_PUBLIC_INSURANCE_API_URL unset. The relative default is
//   the point -- it resolves to the hub's /api/insurance Pages Function, which proxies
//   to Cloud Run server-side and keeps the origin out of the client bundle.
//   scripts/build-hub.mjs strips NEXT_PUBLIC_*_API_URL from the build env so an
//   absolute URL cannot be baked in by accident and quietly bypass that proxy.
const API_BASE = process.env.NEXT_PUBLIC_INSURANCE_API_URL || '/api/insurance'

export async function insuranceFetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
