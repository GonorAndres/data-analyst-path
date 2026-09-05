/** A successful response without observations is an empty result, not a chart. */
export function hasSeries(payload: unknown, key: string): boolean {
  if (!payload || typeof payload !== 'object') return false
  const rows = (payload as Record<string, unknown>)[key]
  return Array.isArray(rows) && rows.length > 0
}
