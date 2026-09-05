'use client'
import { ChartState } from '@/components/ChartState'
import { useABText } from '@/features/abtest/lib/translations'
import { usePreferences } from '@/components/SitePreferences'
import { ChartContainer } from '@/features/abtest/components/ui/ChartContainer'
import { usePower } from '@/features/abtest/hooks/useABTestAPI'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'

export function PowerCalculator() {
  const tr = useABText()
  const { t } = usePreferences()
  const [baselineRate, setBaselineRate] = useState(0.12)
  const [mde, setMde] = useState(0.01)
  const [alpha, setAlpha] = useState(0.05)
  const [power, setPower] = useState(0.8)

  const qs = `?baseline_rate=${baselineRate}&mde=${mde}&alpha=${alpha}&power=${power}`
  const { data, error, isLoading } = usePower(qs)

  const d = data as any

  return (
    <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="font-sans text-xs text-muted block mb-1">{tr("Baseline Rate")}</label>
            <input
              aria-label={tr('Baseline Rate')}
              type="range"
              min={0.01}
              max={0.5}
              step={0.01}
              value={baselineRate}
              onChange={(e) => setBaselineRate(Number(e.target.value))}
              className="w-full"
            />
            <span className="font-sans text-sm font-semibold tabular-nums">{(baselineRate * 100).toFixed(0)}%</span>
          </div>
          <div>
            <label className="font-sans text-xs text-muted block mb-1">{tr("MDE (pp)")}</label>
            <input
              aria-label={tr('MDE (pp)')}
              type="range"
              min={0.001}
              max={0.05}
              step={0.001}
              value={mde}
              onChange={(e) => setMde(Number(e.target.value))}
              className="w-full"
            />
            <span className="font-sans text-sm font-semibold tabular-nums">{(mde * 100).toFixed(1)}pp</span>
          </div>
          <div>
            <label className="font-sans text-xs text-muted block mb-1">{tr("Alpha")}</label>
            <input
              aria-label={tr('Alpha')}
              type="range"
              min={0.01}
              max={0.1}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-full"
            />
            <span className="font-sans text-sm font-semibold tabular-nums">{alpha}</span>
          </div>
          <div>
            <label className="font-sans text-xs text-muted block mb-1">{tr("Power")}</label>
            <input
              aria-label={tr('Power')}
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="w-full"
            />
            <span className="font-sans text-sm font-semibold tabular-nums">{(power * 100).toFixed(0)}%</span>
          </div>
        </div>

      <ChartState loading={isLoading} error={error} empty={!data} />
      {!isLoading && !error && d && <>
      <ChartContainer
        title={tr("Power & Sample Size Calculator")}
        subtitle={tr("How many users do you need to detect a given effect?")}
        insight={`${tr('Baseline Rate')}: ${(baselineRate * 100).toFixed(1)}%. MDE: ${(mde * 100).toFixed(1)} pp. ${tr('Required N (per group)')}: ${d.required_sample_size_per_group?.toLocaleString()}. ${tr('Current N (per group)')}: ${d.current_sample_size?.min?.toLocaleString()} (${d.is_adequate ? t('adequate', 'suficiente') : t('insufficient', 'insuficiente')}).`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-surface dark:bg-[var(--surface)] rounded-lg">
          <div className="text-center">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">{tr("Required N (per group)")}</p>
            <p className="font-sans text-3xl font-bold tabular-nums">{d.required_sample_size_per_group?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">{tr("Current N (per group)")}</p>
            <p className="font-sans text-3xl font-bold tabular-nums">{d.current_sample_size?.min?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">{tr("Est. Runtime")}</p>
            <p className="font-sans text-3xl font-bold tabular-nums">{d.runtime_estimate_days ?? '—'} {tr('days')}</p>
          </div>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Power Curve")}
        subtitle={tr("How power varies with effect size at current sample size")}
        insight={`${t('Minimum detectable effect at 80% power', 'Efecto mínimo detectable con potencia del 80%')}: ${d.actual_mde != null ? (d.actual_mde * 100).toFixed(2) : '—'} pp.`}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.power_curve} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="effect_size"
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v * 100).toFixed(1)}pp`}
                label={{ value: tr("Effect Size (pp)"), position: 'insideBottom', offset: -5, fill: 'var(--chart-tick)' }}
              />
              <YAxis
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                domain={[0, 1]}
                label={{ value: tr("Power"), angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)' }}
              />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label: number) => `${tr('Effect')}: ${(label * 100).toFixed(2)}pp`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <ReferenceLine y={0.8} stroke="var(--sig-neutral)" strokeDasharray="5 5" label={{ value: '80%', fill: 'var(--sig-neutral)' }} />
              <Line type="monotone" dataKey="power" stroke="var(--accent-indigo)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("MDE Curve")}
        subtitle={tr("Detectable effect size vs. sample size")}
        insight={tr("Shows how increasing sample size allows detection of smaller effects.")}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.mde_curve} margin={{ top: 10, right: 20, bottom: 10, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="effect_size"
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v * 100).toFixed(1)}pp`}
                label={{ value: tr("Effect Size"), position: 'insideBottom', offset: -5, fill: 'var(--chart-tick)' }}
              />
              <YAxis
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                label={{ value: tr("Required N per Group"), angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)' }}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(label: number) => `MDE: ${(label * 100).toFixed(1)}pp`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <Line type="monotone" dataKey="required_n" stroke="var(--treatment)" strokeWidth={2} dot={false} name={tr("Required N")} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
      </>}
    </div>
  )
}
