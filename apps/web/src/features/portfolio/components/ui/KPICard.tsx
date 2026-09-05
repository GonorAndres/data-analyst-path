'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { usePreferences } from '@/components/SitePreferences'

interface KPICardProps {
  label: string
  value: number | null | undefined
  prefix?: string
  suffix?: string
  decimals?: number
  delay?: number
  trend?: 'up' | 'down' | 'neutral'
  tooltip?: string
}

export function KPICard({ label, value, prefix = '', suffix = '', decimals = 2, trend, tooltip }: KPICardProps) {
  const { locale, t } = usePreferences()
  const available = typeof value === 'number' && Number.isFinite(value)
  const color = !available ? 'text-muted' : trend === 'up' ? 'text-gain' : trend === 'down' ? 'text-loss' : 'text-ink'
  return <FeatureText><div className="glass-card flex flex-col gap-2 p-4">
    <p className="text-xs font-medium text-muted">{label}</p>
    <p className={`font-mono text-2xl font-semibold tabular-nums ${color}`}>
      {available ? prefix + new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}).format(value as number) + suffix : '—'}
    </p>
    {!available && <span className="text-xs text-muted">{t('Not available', 'No disponible')}</span>}
    {tooltip && <details className="text-xs text-muted"><summary className="cursor-pointer">{t('About this metric', 'Acerca de esta métrica')}</summary><p className="mt-2 leading-relaxed">{tooltip}</p></details>}
  </div></FeatureText>
}
