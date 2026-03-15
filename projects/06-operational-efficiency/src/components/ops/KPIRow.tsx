'use client'

interface KPICardProps {
  label: string
  value: string
  sublabel?: string
  accent?: string
}

function KPICard({ label, value, sublabel, accent = 'text-ops-blue' }: KPICardProps) {
  return (
    <div className="bg-ops-surface border border-ops-border p-4">
      <div className="font-sans text-xs text-ops-text-muted uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className={`font-mono text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
      {sublabel && (
        <div className="font-sans text-xs text-ops-text-muted mt-1">{sublabel}</div>
      )}
    </div>
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
  if (!data) return null

  const cards: KPICardProps[] = [
    {
      label: 'Total Solicitudes',
      value: (data.total_requests ?? 0).toLocaleString('es-MX'),
      accent: 'text-ops-blue',
    },
    {
      label: 'Resolucion Promedio',
      value: `${(data.avg_resolution_days ?? 0).toFixed(1)} dias`,
      accent: 'text-ops-cyan',
    },
    {
      label: 'Cumplimiento SLA',
      value: `${(data.sla_compliance_rate ?? 0).toFixed(1)}%`,
      accent:
        (data.sla_compliance_rate ?? 0) >= 85
          ? 'text-ops-green'
          : (data.sla_compliance_rate ?? 0) >= 70
            ? 'text-ops-amber'
            : 'text-ops-red',
    },
    {
      label: 'Tasa de Cierre',
      value: `${(data.close_rate ?? 0).toFixed(1)}%`,
      accent: 'text-ops-green',
    },
    {
      label: 'Canal Principal',
      value: data.primary_channel ?? 'N/A',
      accent: 'text-ops-purple',
    },
  ]

  if (data.open_requests !== undefined) {
    cards.push({
      label: 'Solicitudes Abiertas',
      value: data.open_requests.toLocaleString('es-MX'),
      accent: 'text-ops-amber',
    })
  }

  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  )
}
