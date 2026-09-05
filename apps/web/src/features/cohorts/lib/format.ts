/** Number formatting. The dataset is Brazilian, the audience Spanish-speaking. */

const es = new Intl.NumberFormat('es-MX')

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '--'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(0)}k`
  return es.format(Math.round(n))
}

/** Full precision, for tables and tooltips where the exact figure matters. */
export function formatExact(n: number): string {
  return Number.isFinite(n) ? es.format(Math.round(n)) : '--'
}

export function formatCurrency(n: number): string {
  return `R$ ${formatNumber(n)}`
}

export function formatPercent(n: number | null, digits = 1): string {
  return n === null || !Number.isFinite(n) ? '--' : `${n.toFixed(digits)}%`
}

/** `2017-03` -> `mar 2017`, for axis ticks where the raw key is too wide. */
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function formatCohort(cohort: string): string {
  const [y, m] = cohort.split('-')
  const idx = Number(m) - 1
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : cohort
}

/**
 * Axis-tick percentage, with precision chosen from the magnitude.
 *
 * Retention past month 0 is under 1% here, and a fixed 0-decimal tick renders
 * the whole axis as "1%, 1%, 0%, 0%, 0%" -- five labels for five different
 * values. Two decimals below 1, one below 10, none above.
 */
export function formatPercentTick(value: number): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const abs = Math.abs(n)
  return `${n.toFixed(abs < 1 ? 2 : abs < 10 ? 1 : 0)}%`
}
