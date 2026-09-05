// The full same-origin URL is also the SWR cache identity.
// Never strip the service prefix: sibling modules share one browser runtime.
export async function portfolioFetcher<T>(path: string): Promise<T> {
  if (!path.startsWith('/api/portfolio/')) throw new Error('Unexpected API service')
  const response = await fetch(path)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}
