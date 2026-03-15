'use client'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { usePower } from '@/hooks/useABTestAPI'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'

export function PowerCalculator() {
  const [baselineRate, setBaselineRate] = useState(0.12)
  const [mde, setMde] = useState(0.01)
  const [alpha, setAlpha] = useState(0.05)
  const [power, setPower] = useState(0.8)

  const qs = `?baseline_rate=${baselineRate}&mde=${mde}&alpha=${alpha}&power=${power}`
  const { data, error, isLoading } = usePower(qs)

  if (isLoading) return <p className="font-sans text-sm text-muted py-10">Calculating power analysis...</p>
  if (error || !data) return <p className="font-sans text-sm text-sig-negative py-10">Failed to load data.</p>

  const d = data as any

  return (
    <div>
      <ChartContainer
        title="Power & Sample Size Calculator"
        subtitle="How many users do you need to detect a given effect?"
        insight={`With a baseline rate of ${(baselineRate * 100).toFixed(1)}% and MDE of ${(mde * 100).toFixed(1)} pp, you need ${d.required_sample_size_per_group?.toLocaleString()} users per group. Current experiment has ${d.current_sample_size?.min?.toLocaleString()} per group -- ${d.is_adequate ? 'adequate' : 'insufficient'}.`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="font-sans text-xs text-muted block mb-1">Baseline Rate</label>
            <input
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
            <label className="font-sans text-xs text-muted block mb-1">MDE (pp)</label>
            <input
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
            <label className="font-sans text-xs text-muted block mb-1">Alpha</label>
            <input
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
            <label className="font-sans text-xs text-muted block mb-1">Power</label>
            <input
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-surface dark:bg-[#1a1a1a] rounded-lg">
          <div className="text-center">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">Required N (per group)</p>
            <p className="font-serif text-3xl font-bold tabular-nums">{d.required_sample_size_per_group?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">Current N (per group)</p>
            <p className="font-serif text-3xl font-bold tabular-nums">{d.current_sample_size?.min?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">Est. Runtime</p>
            <p className="font-serif text-3xl font-bold tabular-nums">{d.runtime_estimate_days ?? 'N/A'} days</p>
          </div>
        </div>
      </ChartContainer>

      <ChartContainer
        title="Power Curve"
        subtitle="How power varies with effect size at current sample size"
        insight={`At the current sample size, the minimum detectable effect (80% power) is approximately ${d.actual_mde ? (d.actual_mde * 100).toFixed(2) : 'N/A'} percentage points.`}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.power_curve} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="effect_size"
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v * 100).toFixed(1)}pp`}
                label={{ value: 'Effect Size (pp)', position: 'insideBottom', offset: -5, fill: 'var(--chart-tick)' }}
              />
              <YAxis
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                domain={[0, 1]}
                label={{ value: 'Power', angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)' }}
              />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label: number) => `Effect: ${(label * 100).toFixed(2)}pp`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <ReferenceLine y={0.8} stroke="var(--sig-neutral)" strokeDasharray="5 5" label={{ value: '80%', fill: 'var(--sig-neutral)' }} />
              <Line type="monotone" dataKey="power" stroke="var(--accent-indigo)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title="MDE Curve"
        subtitle="Detectable effect size vs. sample size"
        insight="Shows how increasing sample size allows detection of smaller effects."
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.mde_curve} margin={{ top: 10, right: 20, bottom: 10, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="effect_size"
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v * 100).toFixed(1)}pp`}
                label={{ value: 'Effect Size', position: 'insideBottom', offset: -5, fill: 'var(--chart-tick)' }}
              />
              <YAxis
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                label={{ value: 'Required N per Group', angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)' }}
              />
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(label: number) => `MDE: ${(label * 100).toFixed(1)}pp`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <Line type="monotone" dataKey="required_n" stroke="var(--treatment)" strokeWidth={2} dot={false} name="Required N" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  )
}
