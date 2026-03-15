'use client'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { useSegments } from '@/hooks/useABTestAPI'
import { useABTestFilters } from '@/context/ABTestFilterContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ErrorBar, Legend,
} from 'recharts'
import { useState } from 'react'

export function SegmentExplorer() {
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useSegments(queryString)
  const [activeDimension, setActiveDimension] = useState('device_type')

  if (isLoading) return <p className="font-sans text-sm text-muted py-10">Loading segment analysis...</p>
  if (error || !data) return <p className="font-sans text-sm text-sig-negative py-10">Failed to load data.</p>

  const d = data as any
  const dimensions = Object.keys(d.segments || {})
  const segmentData = (d.segments?.[activeDimension] || []).map((s: any) => ({
    ...s,
    liftColor: s.p_value < 0.05
      ? (s.lift_pct > 0 ? 'var(--sig-positive)' : 'var(--sig-negative)')
      : 'var(--sig-neutral)',
  }))

  return (
    <div>
      <ChartContainer
        title="Segment Deep Dive"
        subtitle="Treatment effect by segment -- look for heterogeneous effects"
        insight={d.simpsons_paradox?.detected
          ? `Simpson's Paradox detected: the aggregate result may contradict segment-level results. Check the user_segment dimension for details.`
          : 'No Simpson\'s Paradox detected -- aggregate and segment-level results are directionally consistent.'}
      >
        <div className="flex gap-2 mb-6 flex-wrap">
          {dimensions.map((dim: string) => (
            <button
              key={dim}
              onClick={() => setActiveDimension(dim)}
              className={`px-3 py-1.5 rounded font-sans text-xs tracking-wide transition-colors ${
                activeDimension === dim
                  ? 'bg-accent-indigo text-white dark:bg-[#818CF8]'
                  : 'bg-surface dark:bg-[#2a2a2a] text-muted hover:text-ink dark:hover:text-[#F0EFEB]'
              }`}
            >
              {dim.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} layout="vertical" margin={{ left: 100, right: 40, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                type="number"
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
              />
              <YAxis type="category" dataKey="segment" stroke="var(--chart-tick)" width={90} />
              <Tooltip
                formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <ReferenceLine x={0} stroke="var(--chart-tick)" strokeDasharray="3 3" />
              <Bar dataKey="lift_pct" name="Lift %" barSize={16} radius={[0, 4, 4, 0]}>
                {segmentData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.liftColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {d.simpsons_paradox?.detected && (
        <ChartContainer
          title="Simpson's Paradox"
          subtitle="When aggregate trends reverse within subgroups"
          insight={`Overall lift is ${d.simpsons_paradox.aggregate_lift >= 0 ? 'positive' : 'negative'}, but the treatment effect reverses for some user segments. This happens because of unequal group sizes across segments.`}
        >
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="border-b border-border dark:border-[#2a2a2a]">
                  <th className="text-left py-3 pr-4 font-semibold">Segment</th>
                  <th className="text-right py-3 px-4 font-semibold">Control Rate</th>
                  <th className="text-right py-3 px-4 font-semibold">Treatment Rate</th>
                  <th className="text-right py-3 px-4 font-semibold">Lift %</th>
                  <th className="text-right py-3 pl-4 font-semibold">Direction</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-border dark:border-[#2a2a2a] bg-surface/50 dark:bg-[#1a1a1a]">
                  <td className="py-2 pr-4 font-bold">Aggregate</td>
                  <td className="py-2 px-4 text-right tabular-nums">{(d.simpsons_paradox.aggregate_control_rate * 100).toFixed(2)}%</td>
                  <td className="py-2 px-4 text-right tabular-nums">{(d.simpsons_paradox.aggregate_treatment_rate * 100).toFixed(2)}%</td>
                  <td className="py-2 px-4 text-right tabular-nums">{d.simpsons_paradox.aggregate_lift.toFixed(2)}%</td>
                  <td className="py-2 pl-4 text-right">{d.simpsons_paradox.aggregate_lift >= 0 ? 'Positive' : 'Negative'}</td>
                </tr>
                {d.simpsons_paradox.segments?.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 dark:border-[#2a2a2a]/50">
                    <td className="py-2 pr-4">{row.segment}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{(row.control_rate * 100).toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right tabular-nums">{(row.treatment_rate * 100).toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right tabular-nums">{row.lift.toFixed(2)}%</td>
                    <td className="py-2 pl-4 text-right">
                      <span className={row.lift >= 0 ? 'text-sig-positive' : 'text-sig-negative'}>
                        {row.lift >= 0 ? 'Positive' : 'Negative'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}

      <ChartContainer
        title="Treatment Effect Heatmap"
        subtitle="Effect magnitude across all dimensions"
        insight="Darker green indicates stronger positive treatment effect; darker red indicates negative effect. Gray cells are not statistically significant."
      >
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[#2a2a2a]">
                <th className="text-left py-3 pr-4 font-semibold">Dimension</th>
                <th className="text-left py-3 px-4 font-semibold">Segment</th>
                <th className="text-right py-3 px-4 font-semibold">n</th>
                <th className="text-right py-3 px-4 font-semibold">Lift %</th>
                <th className="text-right py-3 px-4 font-semibold">p-value</th>
                <th className="text-center py-3 pl-4 font-semibold">Effect</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim: string) =>
                (d.segments[dim] || []).map((seg: any, i: number) => (
                  <tr key={`${dim}-${i}`} className="border-b border-border/30 dark:border-[#2a2a2a]/30">
                    {i === 0 && (
                      <td className="py-2 pr-4 font-medium" rowSpan={d.segments[dim].length}>
                        {dim.replace(/_/g, ' ')}
                      </td>
                    )}
                    <td className="py-2 px-4">{seg.segment}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{seg.n_total?.toLocaleString()}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{seg.lift_pct >= 0 ? '+' : ''}{seg.lift_pct.toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right tabular-nums">{seg.p_value.toFixed(4)}</td>
                    <td className="py-2 pl-4 text-center">
                      <span
                        className="inline-block w-6 h-6 rounded"
                        style={{
                          backgroundColor: seg.p_value >= 0.05
                            ? 'var(--sig-neutral)'
                            : seg.lift_pct > 0
                              ? 'var(--sig-positive)'
                              : 'var(--sig-negative)',
                          opacity: seg.p_value >= 0.05 ? 0.3 : Math.min(1, Math.abs(seg.lift_pct) / 5 + 0.4),
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  )
}
