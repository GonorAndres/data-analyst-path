'use client'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { useFrequentist } from '@/hooks/useABTestAPI'
import { useABTestFilters } from '@/context/ABTestFilterContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from 'recharts'

export function FrequentistPanel() {
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useFrequentist(queryString)

  if (isLoading) return <p className="font-sans text-sm text-muted py-10">Loading frequentist analysis...</p>
  if (error || !data) return <p className="font-sans text-sm text-sig-negative py-10">Failed to load data.</p>

  const d = data as any

  const ciData = [
    {
      name: 'Control',
      lower: d.wilson_ci_control[0] * 100,
      upper: d.wilson_ci_control[1] * 100,
      mid: ((d.wilson_ci_control[0] + d.wilson_ci_control[1]) / 2) * 100,
      range: (d.wilson_ci_control[1] - d.wilson_ci_control[0]) * 100,
      fill: 'var(--control)',
    },
    {
      name: 'Treatment',
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
        title="Confidence Intervals"
        subtitle="Wilson score intervals for conversion rate (95% confidence)"
        insight={`The z-test yields p=${pVal.toFixed(4)}. Cohen's h = ${d.cohens_h.effect_size.toFixed(4)} (${effectLabel} effect). ${pVal < 0.05 ? 'We reject the null hypothesis.' : 'We fail to reject the null hypothesis.'}`}
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ciData} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis type="number" domain={['auto', 'auto']} tickFormatter={(v: number) => `${v.toFixed(1)}%`} stroke="var(--chart-tick)" />
              <YAxis type="category" dataKey="name" stroke="var(--chart-tick)" />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(3)}%`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <Bar dataKey="mid" barSize={20} radius={[0, 4, 4, 0]}>
                {ciData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title="Multiple Metrics"
        subtitle="Statistical tests across conversion, revenue per user, and session duration"
        insight={`Comparing control vs treatment across multiple metrics to check for consistent effects.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[#2a2a2a]">
                <th className="text-left py-3 pr-4 font-semibold">Metric</th>
                <th className="text-right py-3 px-4 font-semibold">Control</th>
                <th className="text-right py-3 px-4 font-semibold">Treatment</th>
                <th className="text-right py-3 px-4 font-semibold">Diff</th>
                <th className="text-right py-3 px-4 font-semibold">p-value</th>
                <th className="text-right py-3 pl-4 font-semibold">Significant</th>
              </tr>
            </thead>
            <tbody>
              {d.metrics_table?.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50 dark:border-[#2a2a2a]/50">
                  <td className="py-2 pr-4">{row.metric}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.control.toFixed(4)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.treatment.toFixed(4)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.diff.toFixed(4)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.p_value.toFixed(4)}</td>
                  <td className="py-2 pl-4 text-right">
                    <span className={row.p_value < 0.05 ? 'text-sig-positive font-semibold' : 'text-muted'}>
                      {row.p_value < 0.05 ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      <ChartContainer
        title="Chi-Squared Test"
        subtitle="2x2 contingency table: group vs conversion"
        insight={`Chi-squared statistic = ${d.chi_squared.chi2.toFixed(2)}, p = ${d.chi_squared.p_value.toFixed(4)}. Cramer's V = ${d.chi_squared.cramers_v.toFixed(4)}.`}
      >
        <div className="overflow-x-auto">
          <table className="font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[#2a2a2a]">
                <th className="text-left py-3 pr-8 font-semibold">Group</th>
                <th className="text-right py-3 px-4 font-semibold">Converted</th>
                <th className="text-right py-3 px-4 font-semibold">Not Converted</th>
                <th className="text-right py-3 pl-4 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.contingency_table?.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50 dark:border-[#2a2a2a]/50">
                  <td className="py-2 pr-8 font-medium">{row.group}</td>
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
