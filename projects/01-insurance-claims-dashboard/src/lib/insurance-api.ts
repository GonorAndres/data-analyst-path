// In dev: browser calls localhost:3051/api/insurance/... -> Next.js rewrites to localhost:2051/...
// In prod (Vercel): set NEXT_PUBLIC_INSURANCE_API_URL to the Cloud Run URL directly,
//   and the rewrite destination also uses INSURANCE_BACKEND_URL (server-side env var).
const API_BASE = process.env.NEXT_PUBLIC_INSURANCE_API_URL || '/api/insurance'

export async function insuranceFetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
