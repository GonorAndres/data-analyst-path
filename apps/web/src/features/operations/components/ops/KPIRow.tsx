'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { usePreferences } from '@/components/SitePreferences'

interface KPICardProps {
  label: string
  value: string
  sublabel?: string
  accent?: string
}

function KPICard({ label, value, sublabel, accent = 'text-ops-blue' }: KPICardProps) {
  return (
    <FeatureText><div className="glass-card p-4">
      <div className="font-sans text-xs font-medium text-ops-text-muted mb-2">
        {label}
      </div>
      <div className={`font-mono text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
      {sublabel && (
        <div className="font-sans text-xs text-ops-text-muted mt-1">{sublabel}</div>
      )}
    </div></FeatureText>
  )
}

interface KPIRowProps {
  data: {
    total_requests?: number
    avg_resolution_days?: number
    sla_compliance_rate?: number
    close_rate?: number
    primary_channel?: string
    open_requests?: number
  }
}

export function KPIRow({ data }: KPIRowProps) {
  const { locale, t } = usePreferences()
  const format = (value: number | undefined, digits = 0, suffix = '') => typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) + suffix : '—'
  if (!data) return null

  const cards: KPICardProps[] = [
    {
      label: 'Total Solicitudes',
      value: format(data.total_requests),
      accent: 'text-ops-blue',
    },
    {
      label: 'Resolucion Promedio',
      value: format(data.avg_resolution_days, 1, t(' days', ' días')),
      accent: 'text-ops-cyan',
    },
    {
      label: 'Cumplimiento SLA',
      value: format(data.sla_compliance_rate, 1, '%'),
      accent:
        (data.sla_compliance_rate ?? 0) >= 85
          ? 'text-ops-green'
          : (data.sla_compliance_rate ?? 0) >= 70
            ? 'text-ops-amber'
            : 'text-ops-red',
    },
    {
      label: 'Tasa de Cierre',
      value: format(data.close_rate, 1, '%'),
      accent: 'text-ops-green',
    },
    {
      label: 'Canal Principal',
      value: data.primary_channel ?? '—',
      accent: 'text-ops-purple',
    },
  ]

  if (data.open_requests !== undefined) {
    cards.push({
      label: 'Solicitudes Abiertas',
      value: format(data.open_requests),
      accent: 'text-ops-amber',
    })
  }

  return (
    <FeatureText><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div></FeatureText>
  )
}
