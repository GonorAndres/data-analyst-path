import { translations, type TranslationKey } from './translations'

export const metricKey = (id: string) => ({
  logo_churn_rate: 'logo_churn', revenue_churn_rate: 'revenue_churn',
  ltv_cac_ratio: 'ltv_cac', dau_mau_ratio: 'dau_mau', payback_months: 'payback',
  cac_payback_months: 'payback',
} as Record<string, string>)[id] ?? id

export function metricLabel(id: string, translate: (key: TranslationKey) => string, fallback = id) {
  const key = `kpi.${metricKey(id.toLowerCase())}` as TranslationKey
  return key in translations.en ? translate(key) : fallback.replaceAll('_', ' ')
}
