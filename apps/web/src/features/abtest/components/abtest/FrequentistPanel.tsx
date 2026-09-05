'use client'
import { ChartState } from '@/components/ChartState'
import { useABText } from '@/features/abtest/lib/translations'
import { usePreferences } from '@/components/SitePreferences'
import { ChartContainer } from '@/features/abtest/components/ui/ChartContainer'
import { useFrequentist } from '@/features/abtest/hooks/useABTestAPI'
import { useABTestFilters } from '@/features/abtest/context/ABTestFilterContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from 'recharts'

export function FrequentistPanel() {
  const tr = useABText()
  const { t } = usePreferences()
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useFrequentist(queryString)

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !data) return <ChartState loading={isLoading} error={error} empty={!data} />

  const d = data as any

  const ciData = [
    {
      name: tr("Control"),
      interval: [d.wilson_ci_control[0] * 100, d.wilson_ci_control[1] * 100],
      lower: d.wilson_ci_control[0] * 100,
      upper: d.wilson_ci_control[1] * 100,
      mid: ((d.wilson_ci_control[0] + d.wilson_ci_control[1]) / 2) * 100,
      range: (d.wilson_ci_control[1] - d.wilson_ci_control[0]) * 100,
      fill: 'var(--control)',
    },
    {
      name: tr("Treatment"),
      interval: [d.wilson_ci_treatment[0] * 100, d.wilson_ci_treatment[1] * 100],
      lower: d.wilson_ci_treatment[0] * 100,
      upper: d.wilson_ci_treatment[1] * 100,
      mid: ((d.wilson_ci_treatment[0] + d.wilson_ci_treatment[1]) / 2) * 100,
      range: (d.wilson_ci_treatment[1] - d.wilson_ci_treatment[0]) * 100,
      fill: 'var(--treatment)',
    },
  ]

  const effectLabel = d.cohens_h.interpretation
  const pVal = d.z_test.p_value

  return (
    <div>
      <ChartContainer
        title={tr("Confidence Intervals")}
        subtitle={tr("Wilson score intervals for conversion rate (95% confidence)")}
        insight={`${t('Z-test', 'Prueba Z')}: p=${pVal.toFixed(4)}. Cohen h=${d.cohens_h.effect_size.toFixed(4)}. ${pVal < 0.05 ? t('Reject the null hypothesis at α=0.05.', 'Se rechaza la hipótesis nula con α=0,05.') : t('Insufficient evidence to reject the null hypothesis at α=0.05.', 'Evidencia insuficiente para rechazar la hipótesis nula con α=0,05.')}`}
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ciData} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis type="number" domain={['auto', 'auto']} tickFormatter={(v: number) => `${v.toFixed(1)}%`} stroke="var(--chart-tick)" />
              <YAxis type="category" dataKey="name" stroke="var(--chart-tick)" />
              <Tooltip
                formatter={(value: number | number[]) => Array.isArray(value) ? value.map(v => `${v.toFixed(3)}%`).join(' — ') : `${value.toFixed(3)}%`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <Bar dataKey="interval" name={tr('Confidence Intervals')} barSize={20} radius={[4, 4, 4, 4]}>
                {ciData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Multiple Metrics")}
        subtitle={tr("Statistical tests across conversion, revenue per user, and session duration")}
        insight={tr('Comparing control vs treatment across multiple metrics to check for consistent effects.')}
      >
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[var(--border)]">
                <th className="text-left py-3 pr-4 font-semibold">{tr("Metric")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Control")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Treatment")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Diff")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("p-value")}</th>
                <th className="text-right py-3 pl-4 font-semibold">{tr("Significant")}</th>
              </tr>
            </thead>
            <tbody>
              {d.metrics_table?.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50 dark:border-[var(--border)]/50">
                  <td className="py-2 pr-4">{tr(row.metric)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.control.toFixed(4)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.treatment.toFixed(4)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.diff.toFixed(4)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.p_value.toFixed(4)}</td>
                  <td className="py-2 pl-4 text-right">
                    <span className={row.p_value < 0.05 ? 'text-sig-positive font-semibold' : 'text-muted'}>
                      {row.p_value < 0.05 ? tr("Yes") : tr("No")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Chi-Squared Test")}
        subtitle={tr("2x2 contingency table: group vs conversion")}
        insight={`χ²=${d.chi_squared.chi2.toFixed(2)}, p=${d.chi_squared.p_value.toFixed(4)}. ${t('Cramer’s V', 'V de Cramér')}=${d.chi_squared.cramers_v.toFixed(4)}.`}
      >
        <div className="overflow-x-auto">
          <table className="font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[var(--border)]">
                <th className="text-left py-3 pr-8 font-semibold">{tr("Group")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Converted")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Not Converted")}</th>
                <th className="text-right py-3 pl-4 font-semibold">{tr("Total")}</th>
              </tr>
            </thead>
            <tbody>
              {d.contingency_table?.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50 dark:border-[var(--border)]/50">
                  <td className="py-2 pr-8 font-medium">{tr(row.group)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.converted.toLocaleString()}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.not_converted.toLocaleString()}</td>
                  <td className="py-2 pl-4 text-right tabular-nums">{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  )
}
