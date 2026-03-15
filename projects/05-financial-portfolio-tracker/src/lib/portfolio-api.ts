const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/portfolio'

export async function portfolioFetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
