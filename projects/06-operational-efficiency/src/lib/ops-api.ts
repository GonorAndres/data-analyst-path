const API_BASE = process.env.NEXT_PUBLIC_OPS_API_URL || '/api/ops'

export async function opsFetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`Error de API: ${res.status}`)
  return res.json()
}
