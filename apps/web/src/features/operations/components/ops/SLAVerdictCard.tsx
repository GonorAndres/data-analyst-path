'use client'
import { FeatureText } from '@/features/portfolio/FeatureText'
import { usePreferences } from '@/components/SitePreferences'

interface SLAVerdictCardProps {
  verdict: string
  complianceRate: number | null
  totalRequests: number | null
  avgResolution: number | null
}

function getVerdictStyle(verdict: string) {
  const v = verdict.toUpperCase()
  if (v === 'CUMPLE') {
    return {
      color: 'text-ops-green',
      bg: 'bg-ops-green/10',
      border: 'border-ops-green/30',
      glow: 'drop-shadow(0 0 12px rgba(111,207,151,0.25))',
      pill: 'bg-ops-green/20 text-ops-green border-ops-green/40',
    }
  }
  if (v === 'EN RIESGO') {
    return {
      color: 'text-ops-amber',
      bg: 'bg-ops-amber/10',
      border: 'border-ops-amber/30',
      glow: 'drop-shadow(0 0 12px rgba(242,201,76,0.25))',
      pill: 'bg-ops-amber/20 text-ops-amber border-ops-amber/40',
    }
  }
  return {
    color: 'text-ops-red',
    bg: 'bg-ops-red/10',
    border: 'border-ops-red/30',
    glow: 'drop-shadow(0 0 12px rgba(235,87,87,0.25))',
    pill: 'bg-ops-red/20 text-ops-red border-ops-red/40',
  }
}

export function SLAVerdictCard({
  verdict,
  complianceRate,
  totalRequests,
  avgResolution,
}: SLAVerdictCardProps) {
  const style = getVerdictStyle(verdict)
  const { locale, t } = usePreferences()
  const available = complianceRate !== null && Number.isFinite(complianceRate)

  return (
    <FeatureText><div
      className={`w-full border ${available ? `${style.border} ${style.bg}` : 'border-ops-border bg-ops-surface'} p-5 rounded-xl`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Verdict badge */}
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs uppercase tracking-wider text-ops-text-muted">
            Veredicto SLA
          </span>
          <span
            className={`px-3 py-1 text-sm font-mono font-bold uppercase tracking-wide border ${style.pill}`}
          >
            {available ? verdict : t('Not available', 'No disponible')}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ops-text tabular-nums">
              {available ? `${complianceRate!.toFixed(1)}%` : '—'}
            </div>
            <div className="font-sans text-xs text-ops-text-muted">Cumplimiento</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ops-text tabular-nums">
              {totalRequests === null ? '—' : totalRequests.toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
            </div>
            <div className="font-sans text-xs text-ops-text-muted">Solicitudes</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ops-text tabular-nums">
              {avgResolution === null ? '—' : `${avgResolution.toFixed(1)}d`}
            </div>
            <div className="font-sans text-xs text-ops-text-muted">Resolucion Prom.</div>
          </div>
        </div>
      </div>
    </div></FeatureText>
  )
}
