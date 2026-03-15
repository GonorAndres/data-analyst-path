export interface KPIMetric {
  id: string
  name: string
  value: number
  formatted: string
  change_mom: number
  change_yoy: number
  traffic_light: 'green' | 'yellow' | 'red'
  target: number | null
  sparkline: number[]
  category: 'revenue' | 'customer' | 'efficiency' | 'performance'
}

export interface OverviewResponse {
  health_score: number
  health_status: 'green' | 'yellow' | 'red'
  kpis: KPIMetric[]
  commentary: string
  period: { start: string; end: string }
  last_month: string
}

export interface WaterfallItem {
  name: string
  value: number
  type: 'start' | 'positive' | 'negative' | 'end'
}

export interface ARRTrendPoint {
  month: string
  arr: number
  target: number | null
}

export interface SegmentBreakdownPoint {
  month: string
  [segment: string]: string | number
}

export interface NRRTrendPoint {
  month: string
  nrr: number
}

export interface MRRMovement {
  month: string
  starting: number
  new: number
  expansion: number
  contraction: number
  churned: number
  ending: number
}

export interface RevenueResponse {
  waterfall: WaterfallItem[]
  arr_trend: ARRTrendPoint[]
  segment_breakdown: SegmentBreakdownPoint[]
  nrr_trend: NRRTrendPoint[]
  mrr_movements: MRRMovement[]
  commentary: string
}

export interface ChurnTrendPoint {
  month: string
  logo_churn: number
  revenue_churn: number
}

export interface NPSTrendPoint {
  month: string
  nps: number
  promoters: number
  passives: number
  detractors: number
}

export interface LorenzPoint {
  pct_customers: number
  pct_revenue: number
}

export interface SupportTicketPoint {
  month: string
  tickets: number
  resolution_hours: number
}

export interface CustomerResponse {
  churn_trend: ChurnTrendPoint[]
  nrr_trend: NRRTrendPoint[]
  nps_trend: NPSTrendPoint[]
  lorenz_curve: LorenzPoint[]
  support_tickets: SupportTicketPoint[]
  commentary: string
}

export interface ForecastPoint {
  month: string
  actual: number | null
  forecast: number | null
  lower_ci: number | null
  upper_ci: number | null
  target: number | null
}

export interface ForecastMetric {
  metric: string
  metric_label: string
  data: ForecastPoint[]
}

export interface ForecastResponse {
  forecasts: ForecastMetric[]
  commentary: string
}

export interface AnomalyItem {
  id: string
  metric: string
  month: string
  value: number
  expected: number
  z_score: number
  severity: 'critical' | 'warning' | 'info'
  description: string
}

export interface AnomalySummary {
  critical_count: number
  warning_count: number
  info_count: number
  total: number
}

export interface AnomalyResponse {
  summary: AnomalySummary
  anomalies: AnomalyItem[]
  commentary: string
}

export interface FiltersResponse {
  segments: string[]
  months: string[]
}
