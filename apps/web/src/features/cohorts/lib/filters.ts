import type { Cohorts, Filters, Geography, Overview, Segments } from './types'

/**
 * The three filters, with the same semantics as the Streamlit app they replace.
 *
 * All three are subsets, which is what made the backend removable. Cohort months
 * are compared as `YYYY-MM` strings -- lexicographic order is chronological for
 * that format, and it is what `filters.py` did, so the two agree exactly.
 *
 * Each function takes the JSON blocks it needs rather than a whole bundle: the
 * pages load different files, so there is no single object that always exists.
 */

export function cohortInRange(cohort: string, f: Filters): boolean {
  return cohort >= f.cohortStart && cohort <= f.cohortEnd
}

/** Indices of cohorts passing both the date range and the size floor. */
export function visibleCohortRows(c: Cohorts, f: Filters): number[] {
  return c.cohorts
    .map((_, i) => i)
    .filter((i) => {
      if (!cohortInRange(c.cohorts[i], f)) return false
      // Month 0 is the cohort's size at acquisition -- the same column
      // apply_cohort_size_filter used.
      return (c.retention_counts[i]?.[0] ?? 0) >= f.minCohortSize
    })
}

export interface Kpis {
  customers: number
  revenue: number
  repeatRate: number
  avgLtv: number
}

/**
 * The four KPI cards.
 *
 * Summed from per-cohort components rather than read from `meta`, because the
 * cards respond to the date filter. With the filter wide open these reproduce
 * the Streamlit figures exactly: 93,358 customers, 3.0% repeat rate.
 */
export function computeKpis(overview: Overview, f: Filters): Kpis {
  let customers = 0
  let revenue = 0
  let repeat = 0

  for (const row of overview.by_cohort) {
    if (!cohortInRange(row.cohort, f)) continue
    customers += row.customers
    revenue += row.revenue
    repeat += row.repeat
  }

  return {
    customers,
    revenue,
    repeatRate: customers > 0 ? (repeat / customers) * 100 : 0,
    avgLtv: customers > 0 ? revenue / customers : 0,
  }
}

export interface FunnelStage {
  label: string
  customers: number
  /** Share of the stage above, which is the number the funnel is read for. */
  conversion: number | null
}

/**
 * The repeat-purchase funnel: how many customers reach a 2nd, 3rd, 4th order.
 *
 * Summed as thresholds and divided only at the end. Averaging per-cohort
 * conversion rates instead would weight a 200-customer cohort the same as a
 * 9,000-customer one and give a different, wrong answer.
 */
export function funnel(overview: Overview, f: Filters): FunnelStage[] {
  let c1 = 0
  let c2 = 0
  let c3 = 0
  let c4 = 0
  for (const row of overview.by_cohort) {
    if (!cohortInRange(row.cohort, f)) continue
    c1 += row.customers
    c2 += row.orders_2
    c3 += row.orders_3
    c4 += row.orders_4
  }
  const stages = [
    { label: '1ª compra', customers: c1 },
    { label: '2ª compra', customers: c2 },
    { label: '3ª compra', customers: c3 },
    { label: '4ª+ compra', customers: c4 },
  ]
  return stages.map((s, i) => ({
    ...s,
    conversion:
      i === 0 ? null : stages[i - 1].customers > 0 ? (s.customers / stages[i - 1].customers) * 100 : null,
  }))
}

export type RetentionMetric = 'customers' | 'revenue'

export interface RetentionRow {
  cohort: string
  size: number
  values: (number | null)[]
}

/**
 * Retention as percentages, only for the cohorts currently visible.
 *
 * `metric` switches numerator: headcount retained, or revenue retained. Both
 * divide by their own month-0 value, so both start at 100%. The cohort-size
 * filter always reads headcount, never revenue -- a size floor means customers.
 */
export function retentionPercent(
  c: Cohorts,
  f: Filters,
  metric: RetentionMetric = 'customers',
): RetentionRow[] {
  return visibleCohortRows(c, f).map((i) => {
    const counts = c.retention_counts[i]
    const series: (number | null)[] = metric === 'revenue' ? c.revenue[i] : counts
    const base = series[0] ?? 0
    return {
      cohort: c.cohorts[i],
      size: counts[0] || 0,
      // A cohort cannot be observed beyond the end of the dataset; those cells
      // are absent rather than zero, so the heatmap leaves them blank instead of
      // drawing them as total churn.
      values: series.map((v, j) => {
        if (!base) return null
        if (v === null) return null
        const laterActivity = series.slice(j).some((x) => (x ?? 0) > 0)
        if (j > 0 && v === 0 && !laterActivity) return null
        return (v / base) * 100
      }),
    }
  })
}

export interface CurvePoint {
  month: number
  mean: number
  ciLower: number
  ciUpper: number
  /** Cohorts actually observed at this month. Falls as months increase. */
  n: number
}

/**
 * The average retention curve with a 95% interval, over the first `months`.
 *
 * Averaged across *observed* cells only. This is the one place the rebuild
 * deliberately departs from the Streamlit figure: that app built its matrix with
 * `unstack(fill_value=0)`, so a cohort acquired in Aug 2018 counted as 0%
 * retention for months it had not lived through yet, pulling the tail of the
 * average toward zero. Censored cells are absent here, so the mean at month 12
 * is over the cohorts old enough to have a month 12 -- and `n` is returned so the
 * chart can say how many that is rather than implying all of them.
 *
 * The interval is a normal-approximation CI on the mean across cohorts (sd/sqrt n,
 * sample sd, matching pandas' default ddof=1). It describes spread between
 * cohorts, not sampling error within one.
 */
export function averageCurve(rows: RetentionRow[], months = 13): CurvePoint[] {
  const out: CurvePoint[] = []
  // From month 1, never month 0. Month 0 is 100% for every cohort by
  // construction, and including it costs the whole chart: retention past the
  // first month is under 1%, so a series anchored at 100 renders as a cliff and
  // then a flat line on the axis, with all the variation compressed into the
  // bottom pixel. The heatmap omits that column for the same reason.
  for (let m = 1; m < months; m++) {
    const vals = rows.map((r) => r.values[m]).filter((v): v is number => v !== null)
    const n = vals.length
    if (n === 0) continue
    const mean = vals.reduce((a, b) => a + b, 0) / n
    // A single cohort has no between-cohort spread to report; the interval
    // collapses to the point rather than dividing by zero.
    const sd = n > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0
    const half = n > 1 ? 1.96 * (sd / Math.sqrt(n)) : 0
    out.push({ month: m, mean, ciLower: Math.max(0, mean - half), ciUpper: mean + half, n })
  }
  return out
}

/**
 * Best and worst cohort by retention over months 1-6, the Streamlit ranking.
 *
 * Summed over the window rather than judged on month 1 alone, so a cohort that
 * starts weak and holds beats one that spikes once and vanishes. Cohorts missing
 * any of the six months are excluded -- a young cohort would otherwise "win"
 * worst place for not having existed long enough.
 */
export function bestWorstCohorts(rows: RetentionRow[]): { best: string; worst: string } | null {
  const scored = rows
    .filter((r) => r.values.slice(1, 7).every((v) => v !== null))
    .map((r) => ({
      cohort: r.cohort,
      // The explicit type argument is load-bearing: the array is
      // (number | null)[], so without it the accumulator is inferred nullable
      // even though the filter above has already ruled nulls out.
      score: r.values.slice(1, 7).reduce<number>((a, b) => a + (b ?? 0), 0),
    }))
  if (scored.length < 2) return null
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  return { best: sorted[0].cohort, worst: sorted[sorted.length - 1].cohort }
}

export function segmentsSelected(s: Segments, f: Filters) {
  if (f.segments.length === 0) return s.by_segment
  return s.by_segment.filter((x) => f.segments.includes(x.segment))
}

// ------------------------------------------------------------------ geography

export interface StateRow {
  state: string
  customers: number
  revenue: number
  repeatPct: number
  aov: number
  recency: number
  orders: number
  review: number | null
  deliveryDays: number | null
}

/**
 * Per-state metrics over the selected range, joining the two grains.
 *
 * Customer-side figures come from cohort-month rows, order-side figures from
 * order-month rows, and the same date range cuts both -- which is what the
 * Streamlit page's single slider did to its two dataframes. Every mean is
 * rebuilt from its own numerator and denominator, because summing pre-computed
 * means across months would weight a 30-order month like a 3,000-order one.
 */
export function statesInRange(g: Geography, f: Filters): StateRow[] {
  const acc = new Map<
    string,
    {
      customers: number
      revenue: number
      repeat: number
      aov: number
      recency: number
      orders: number
      rSum: number
      rN: number
      dSum: number
      dN: number
    }
  >()
  const blank = () => ({
    customers: 0,
    revenue: 0,
    repeat: 0,
    aov: 0,
    recency: 0,
    orders: 0,
    rSum: 0,
    rN: 0,
    dSum: 0,
    dN: 0,
  })

  for (const row of g.by_state_cohort) {
    if (!cohortInRange(row.cohort, f)) continue
    const a = acc.get(row.state) ?? blank()
    a.customers += row.customers
    a.revenue += row.revenue
    a.repeat += row.repeat
    a.aov += row.aov_sum
    a.recency += row.recency_sum
    acc.set(row.state, a)
  }

  for (const row of g.by_state_month) {
    if (!cohortInRange(row.month, f)) continue
    const a = acc.get(row.state) ?? blank()
    a.orders += row.orders
    a.rSum += row.review_sum
    a.rN += row.review_n
    a.dSum += row.delivery_sum
    a.dN += row.delivery_n
    acc.set(row.state, a)
  }

  return Array.from(acc.entries())
    .filter(([, a]) => a.customers > 0)
    .map(([state, a]) => ({
      state,
      customers: a.customers,
      revenue: a.revenue,
      repeatPct: (a.repeat / a.customers) * 100,
      aov: a.aov / a.customers,
      recency: a.recency / a.customers,
      orders: a.orders,
      review: a.rN > 0 ? a.rSum / a.rN : null,
      deliveryDays: a.dN > 0 ? a.dSum / a.dN : null,
    }))
    .sort((x, y) => y.customers - x.customers)
}

/** Retention curves for the given states, as percentages of each state's month 0. */
export function stateRetentionCurves(
  g: Geography,
  f: Filters,
  states: string[],
): { month: number; [state: string]: number | null }[] {
  const totals = new Map<string, number[]>()
  for (const row of g.retention_curves) {
    if (!states.includes(row.state) || !cohortInRange(row.cohort, f)) continue
    const arr = totals.get(row.state) ?? new Array(13).fill(0)
    arr[row.month] += row.customers
    totals.set(row.state, arr)
  }

  // From month 1, for the same reason averageCurve does: month 0 is 100% for
  // every state by construction, and anchoring the axis at 100 flattens three
  // sub-1% curves into one line on the floor.
  const months = Array.from({ length: 12 }, (_, m) => m + 1)
  return months.map((month) => {
    const point: { month: number; [state: string]: number | null } = { month }
    for (const state of states) {
      const arr = totals.get(state)
      const base = arr?.[0] ?? 0
      // Zero at a later month means nobody returned, which is a real 0% and must
      // plot as such. Only a missing state is null.
      point[state] = arr && base > 0 ? (arr[month] / base) * 100 : null
    }
    return point
  })
}

/** Pearson r plus the least-squares line, for the delivery-vs-retention scatter. */
export function linearFit(points: { x: number; y: number }[]): {
  r: number
  slope: number
  intercept: number
} | null {
  const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  const n = pts.length
  if (n < 3) return null
  const mx = pts.reduce((a, p) => a + p.x, 0) / n
  const my = pts.reduce((a, p) => a + p.y, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my)
    sxx += (p.x - mx) ** 2
    syy += (p.y - my) ** 2
  }
  if (sxx === 0 || syy === 0) return null
  const slope = sxy / sxx
  return { r: sxy / Math.sqrt(sxx * syy), slope, intercept: my - slope * mx }
}
