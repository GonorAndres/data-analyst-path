'use client'
import { useABText } from '@/features/abtest/lib/translations'
import { KPICard } from '@/features/abtest/components/ui/KPICard'

interface KPIRowProps {
  data: {
    n_control: number
    n_treatment: number
    conv_rate_control: number
    conv_rate_treatment: number
    lift_pct: number
    revenue_control_mean: number
    revenue_treatment_mean: number
    power: number | null
  }
}

export function KPIRow({ data }: KPIRowProps) {
  const tr = useABText()
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-b border-border dark:border-[var(--border)]">
      <KPICard
        label={tr("Control Conversion")}
        value={data.conv_rate_control * 100}
        suffix="%"
        decimals={2}
        delay={0}
        valueColor="var(--control)"
      />
      <KPICard
        label={tr("Treatment Conversion")}
        value={data.conv_rate_treatment * 100}
        suffix="%"
        decimals={2}
        delay={0.1}
        valueColor="var(--treatment)"
      />
      <KPICard
        label={tr("Relative Lift")}
        value={data.lift_pct}
        suffix="%"
        decimals={2}
        delay={0.2}
        valueColor={data.lift_pct >= 0 ? 'var(--sig-positive)' : 'var(--sig-negative)'}
      />
      <KPICard
        label={tr("Statistical Power")}
        value={data.power == null ? Number.NaN : data.power * 100}
        suffix="%"
        decimals={1}
        delay={0.3}
      />
    </div>
  )
}
