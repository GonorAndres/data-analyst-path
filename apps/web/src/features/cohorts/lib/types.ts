/** Shapes emitted by data-pipeline/05_build_web_json.py. */

export interface Meta {
  orders: number
  customers: number
  date_start: string
  date_end: string
  repeat_rate: number
  total_revenue: number
  avg_ltv: number
  states: number
  generated_from: string
}

export interface Overview {
  monthly: { month: string; revenue: number; orders: number }[]
  /** Per cohort month, the components the KPI cards sum over the selected range. */
  by_cohort: {
    cohort: string
    customers: number
    revenue: number
    repeat: number
    /** Funnel stages as "reached at least N orders" counts. Thresholds rather
     *  than exact-N buckets, so they stay summable across a date range. */
    orders_2: number
    orders_3: number
    orders_4: number
  }[]
}

export interface Cohorts {
  /** Cohort labels, `YYYY-MM`, ascending. */
  cohorts: string[]
  months: number[]
  /** retention_counts[i][j] = customers from cohort i active in month j.
   *  Counts, not percentages -- the cohort-size filter needs month 0. */
  retention_counts: number[][]
  revenue: (number | null)[][]
}

export interface Segments {
  by_segment: {
    segment: string
    customers: number
    revenue: number
    avg_recency: number
    avg_orders: number
    avg_revenue: number
  }[]
  /** Binned recency x frequency grid. The raw scatter was 93,358 points. */
  scatter: {
    segment: string
    recency: number
    frequency: number
    count: number
    avg_revenue: number
  }[]
  ltv_curves: { segment: string; month: number; cumulative_revenue: number }[]
  /** Revenue concentration over the whole customer base. Not segment-filtered --
   *  concentration *within* a segment is a different statistic. */
  lorenz: {
    population: number[]
    revenue: number[]
    gini: number
    top20_share: number
    customers: number
  }
}

/**
 * Two grains, because the Streamlit page built one table from two frames cut on
 * two different axes: customer metrics on cohort_month, order metrics on
 * order_month. Sums rather than means throughout -- a mean cannot be
 * re-aggregated over a date range, so each mean ships as numerator + denominator.
 */
export interface Geography {
  by_state_cohort: {
    state: string
    cohort: string
    customers: number
    revenue: number
    repeat: number
    aov_sum: number
    recency_sum: number
    delivery_sum: number
    delivery_n: number
    review_sum: number
    review_n: number
  }[]
  by_state_month: {
    state: string
    month: string
    orders: number
    review_sum: number
    review_n: number
    delivery_sum: number
    delivery_n: number
  }[]
  /** (state x cohort x months-since) so the curves still answer to the cohort
   *  filter. States with >= 100 customers, first 12 months. */
  retention_curves: { state: string; cohort: string; month: number; customers: number }[]
}

/** A Kaplan-Meier curve sampled onto the shared weekly `days` grid. */
export interface SurvivalCurve {
  survival: number[]
  n: number
  events: number
  /** Days until S(t) reaches 0.5. Null for Olist: the curve plateaus near 0.95. */
  median: number | null
}

export interface Survival extends SurvivalCurve {
  days: number[]
  ci_lower: number[]
  ci_upper: number[]
  /** Segmented curves carry no bands -- four overlapping ribbons would obscure
   *  the comparison the split exists to make. */
  by_payment: (SurvivalCurve & { group: string })[]
  by_state: (SurvivalCurve & { group: string })[]
}

export interface Activation {
  features: {
    feature: string
    log2_odds: number
    odds_ratio: number
    ci_lower: number | null
    ci_upper: number
    p_value: number
    significant: boolean
  }[]
}

export interface CohortData {
  meta: Meta
  overview: Overview
  cohorts: Cohorts
  segments: Segments
  geography: Geography
  survival: Survival
  activation: Activation
}

/** The three global filters, mirroring the Streamlit sidebar. */
export interface Filters {
  cohortStart: string
  cohortEnd: string
  minCohortSize: number
  segments: string[]
}
