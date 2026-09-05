'use client'
import { ChartState } from '@/components/ChartState'
import { useABText } from '@/features/abtest/lib/translations'
import { usePreferences } from '@/components/SitePreferences'
import { ChartContainer } from '@/features/abtest/components/ui/ChartContainer'
import { useBayesian } from '@/features/abtest/hooks/useABTestAPI'
import { useABTestFilters } from '@/features/abtest/context/ABTestFilterContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

export function BayesianPanel() {
  const tr = useABText()
  const { t } = usePreferences()
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useBayesian(queryString)

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !data) return <ChartState loading={isLoading} error={error} empty={!data} />

  const d = data as any

  const posteriorData = d.posterior_pdf_control.x.map((x: number, i: number) => ({
    x: (x * 100),
    control: d.posterior_pdf_control.pdf[i],
    treatment: d.posterior_pdf_treatment.pdf[i],
  }))

  const probData = [
    { name: tr("P(Treatment > Control)"), value: d.probability_b_beats_a, fill: 'var(--treatment)' },
    { name: tr("P(Control > Treatment)"), value: 1 - d.probability_b_beats_a, fill: 'var(--control)' },
  ]

  return (
    <div>
      <ChartContainer
        title={tr("Posterior Distributions")}
        subtitle={tr("Beta-Binomial conjugate model with uniform prior")}
        insight={`${t('Posterior probability that treatment beats control', 'Probabilidad posterior de que el tratamiento supere al control')}: ${(d.probability_b_beats_a * 100).toFixed(1)}%.`}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={posteriorData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="x"
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                label={{ value: tr("Conversion Rate"), position: 'insideBottom', offset: -5, fill: 'var(--chart-tick)' }}
              />
              <YAxis stroke="var(--chart-tick)" label={{ value: tr("Density"), angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)' }} />
              <Tooltip
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label: number) => `${t('Rate', 'Tasa')}: ${label.toFixed(2)}%`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <Area
                type="monotone"
                dataKey="control"
                stroke="var(--control)"
                fill="var(--posterior-a)"
                fillOpacity={0.4}
                name={tr("Control")}
              />
              <Area
                type="monotone"
                dataKey="treatment"
                stroke="var(--treatment)"
                fill="var(--posterior-b)"
                fillOpacity={0.4}
                name={tr("Treatment")}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Probability of Being Best")}
        insight={`${t('Probability of improvement', 'Probabilidad de mejora')}: ${(d.probability_b_beats_a * 100).toFixed(1)}%. ${t('Expected loss', 'Pérdida esperada')}: $${d.expected_loss.loss_b.toFixed(4)} ${tr('per user')}.`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="h-64 w-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={probData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                >
                  {probData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="font-sans text-sm space-y-3">
            <div>
              <p className="text-muted">{tr("Control 95% Credible Interval")}</p>
              <p className="font-semibold tabular-nums">{(d.credible_interval_control[0] * 100).toFixed(2)}% -- {(d.credible_interval_control[1] * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-muted">{tr("Treatment 95% Credible Interval")}</p>
              <p className="font-semibold tabular-nums">{(d.credible_interval_treatment[0] * 100).toFixed(2)}% -- {(d.credible_interval_treatment[1] * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-muted">{tr("Expected Loss (if ship treatment)")}</p>
              <p className="font-semibold tabular-nums">${d.expected_loss.loss_b.toFixed(6)} {tr('per user')}</p>
            </div>
          </div>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Bayesian vs Frequentist Comparison")}
        insight={tr("Both frameworks should converge to similar conclusions with large samples.")}
      >
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="border-b border-border dark:border-[var(--border)]">
                <th className="text-left py-3 pr-4 font-semibold">{tr("Framework")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Point Estimate")}</th>
                <th className="text-right py-3 px-4 font-semibold">{tr("Interval")}</th>
                <th className="text-right py-3 pl-4 font-semibold">{tr("Conclusion")}</th>
              </tr>
            </thead>
            <tbody>
              {d.comparison_table?.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50 dark:border-[var(--border)]/50">
                  <td className="py-2 pr-4 font-medium">{tr(row.framework)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.point_estimate}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{row.interval}</td>
                  <td className="py-2 pl-4 text-right">{tr(row.conclusion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  )
}
