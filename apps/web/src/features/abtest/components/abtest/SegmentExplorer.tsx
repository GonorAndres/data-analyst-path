'use client'
import { ChartState } from '@/components/ChartState'
import { useABText } from '@/features/abtest/lib/translations'
import { usePreferences } from '@/components/SitePreferences'
import { ChartContainer } from '@/features/abtest/components/ui/ChartContainer'
import { useSegments } from '@/features/abtest/hooks/useABTestAPI'
import { useABTestFilters } from '@/features/abtest/context/ABTestFilterContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ErrorBar, Legend,
} from 'recharts'
import { useState } from 'react'

export function SegmentExplorer() {
  const tr = useABText()
  const { t } = usePreferences()
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useSegments(queryString)
  const [activeDimension, setActiveDimension] = useState('device_type')

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !data) return <ChartState loading={isLoading} error={error} empty={!data} />

  const d = data as any
  const dimensions = Object.keys(d.segments || {})
  const selectedDimension = dimensions.includes(activeDimension) ? activeDimension : dimensions[0]
  const segmentData = (d.segments?.[selectedDimension] || []).map((s: any) => ({
    ...s,
    segment: tr(s.segment),
    liftColor: s.p_value < 0.05
      ? (s.lift_pct > 0 ? 'var(--sig-positive)' : 'var(--sig-negative)')
      : 'var(--sig-neutral)',
  }))
  if (!dimensions.length) return <ChartState empty />

  return (
    <div>
      <ChartContainer
        title={tr("Segment Deep Dive")}
        subtitle={tr("Treatment effect by segment -- look for heterogeneous effects")}
        insight={d.simpsons_paradox?.detected
          ? t('The aggregate result may contradict segment-level results. Inspect the user segment dimension.', 'El resultado agregado puede contradecir los resultados por segmento. Revisa la dimensión de segmento de usuarios.')
          : t('Aggregate and segment-level results are directionally consistent.', 'Los resultados agregados y por segmento siguen la misma dirección.')}
      >
        <div className="flex gap-2 mb-6 flex-wrap">
          {dimensions.map((dim: string) => (
            <button
              key={dim}
              onClick={() => setActiveDimension(dim)}
              aria-pressed={selectedDimension === dim}
              className={`px-3 py-1.5 rounded font-sans text-xs tracking-wide transition-colors ${
                selectedDimension === dim
                  ? 'bg-accent-indigo text-white dark:bg-[var(--accent)]'
                  : 'bg-surface dark:bg-[var(--surface)] text-muted hover:text-ink dark:hover:text-[var(--foreground)]'
              }`}
            >
              {tr(dim.replace(/_/g, ' '))}
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
              <Bar dataKey="lift_pct" name={tr("Lift %")} barSize={16} radius={[0, 4, 4, 0]}>
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
          title={tr("Simpson's Paradox")}
          subtitle={tr("When aggregate trends reverse within subgroups")}
          insight={t('The treatment effect reverses for some user segments. Unequal segment distributions can change the aggregate result.', 'El efecto del tratamiento se invierte en algunos segmentos. Las distribuciones desiguales entre segmentos pueden cambiar el resultado agregado.')}
        >
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="border-b border-border dark:border-[var(--border)]">
                  <th className="text-left py-3 pr-4 font-semibold">{tr("Segment")}</th>
                  <th className="text-right py-3 px-4 font-semibold">{tr("Control Rate")}</th>
                  <th className="text-right py-3 px-4 font-semibold">{tr("Treatment Rate")}</th>
                  <th className="text-right py-3 px-4 font-semibold">{tr("Lift %")}</th>
                  <th className="text-right py-3 pl-4 font-semibold">{tr("Direction")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-border dark:border-[var(--border)] bg-surface/50 dark:bg-[var(--surface)]">
                  <td className="py-2 pr-4 font-bold">{tr("Aggregate")}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{(d.simpsons_paradox.aggregate_control_rate * 100).toFixed(2)}%</td>
                  <td className="py-2 px-4 text-right tabular-nums">{(d.simpsons_paradox.aggregate_treatment_rate * 100).toFixed(2)}%</td>
                  <td className="py-2 px-4 text-right tabular-nums">{d.simpsons_paradox.aggregate_lift.toFixed(2)}%</td>
                  <td className="py-2 pl-4 text-right">{d.simpsons_paradox.aggregate_lift >= 0 ? tr("Positive") : tr("Negative")}</td>
                </tr>
                {d.simpsons_paradox.segments?.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 dark:border-[var(--border)]/50">
                    <td className="py-2 pr-4">{tr(row.segment)}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{(row.control_rate * 100).toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right tabular-nums">{(row.treatment_rate * 100).toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right tabular-nums">{row.lift.toFixed(2)}%</td>
                    <td className="py-2 pl-4 text-right">
                      <span className={row.lift >= 0 ? 'text-sig-positive' : 'text-sig-negative'}>
                        {row.lift >= 0 ? tr("Positive") : tr("Negative")}
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
        title={tr("Treatment Effect Heatmap")}
        subtitle={tr("Effect magnitude across all dimensions")}
        insight={tr("Darker green indicates stronger positive treatment effect; darker red indicates negative effect. Gray cells are not statistically significant.")}
      >
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[var(--border)]">
                <th className="text-left py-3 pr-4 font-semibold">{tr("Dimension")}</th>
                <th className="text-left py-3 px-4 font-semibold">{tr("Segment")}</th>
                <th className="text-right py-3 px-4 font-semibold">n</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Lift %")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("p-value")}</th>
                <th className="text-center py-3 pl-4 font-semibold">{tr("Effect")}</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim: string) =>
                (d.segments[dim] || []).map((seg: any, i: number) => (
                  <tr key={`${dim}-${i}`} className="border-b border-border/30 dark:border-[var(--border)]/30">
                    {i === 0 && (
                      <td className="py-2 pr-4 font-medium" rowSpan={d.segments[dim].length}>
                        {tr(dim.replace(/_/g, ' '))}
                      </td>
                    )}
                    <td className="py-2 px-4">{tr(seg.segment)}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{seg.n_total?.toLocaleString()}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{seg.lift_pct >= 0 ? '+' : ''}{seg.lift_pct.toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right tabular-nums">{seg.p_value.toFixed(4)}</td>
                    <td className="py-2 pl-4 text-center">
                      <span
                        role="img"
                        aria-label={seg.p_value >= 0.05 ? t('Not significant', 'No significativo') : seg.lift_pct > 0 ? tr('Positive') : tr('Negative')}
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
