// In dev: browser calls localhost:3050/api/olist/... → Next.js rewrites to localhost:2050/...
// In prod (Vercel): set NEXT_PUBLIC_OLIST_API_URL to the Cloud Run URL directly,
//   and the rewrite destination also uses OLIST_BACKEND_URL (server-side env var).
const API_BASE = process.env.NEXT_PUBLIC_OLIST_API_URL || '/api/olist'

export async function olistFetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
