'use client'
import { ChartState } from '@/components/ChartState'
import { useABText } from '@/features/abtest/lib/translations'
import { usePreferences } from '@/components/SitePreferences'
import { ChartContainer } from '@/features/abtest/components/ui/ChartContainer'
import { useSegments } from '@/features/abtest/hooks/useABTestAPI'
import { useABTestFilters } from '@/features/abtest/context/ABTestFilterContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from 'recharts'

export function SimpsonParadox() {
  const tr = useABText()
  const { t } = usePreferences()
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useSegments(queryString)

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !data) return <ChartState loading={isLoading} error={error} empty={!data} />

  const d = (data as any).simpsons_paradox
  if (!d?.detected) {
    return (
      <ChartContainer
        title={tr("Simpson's Paradox Check")}
        insight={tr("No Simpson's Paradox detected in this data subset. All segment-level effects are directionally consistent with the aggregate.")}
      >
        <p className="font-sans text-sm text-muted">{tr("Try different filter combinations to explore paradox scenarios.")}</p>
      </ChartContainer>
    )
  }

  const chartData = [
    {
      name: tr("Aggregate"),
      control: d.aggregate_control_rate * 100,
      treatment: d.aggregate_treatment_rate * 100,
    },
    ...(d.segments || []).map((s: any) => ({
      name: s.segment,
      control: s.control_rate * 100,
      treatment: s.treatment_rate * 100,
    })),
  ]

  return (
    <ChartContainer
      title={tr("Simpson's Paradox Visualization")}
      subtitle={tr("The aggregate trend reverses within subgroups")}
      insight={t('The aggregate treatment effect reverses for at least one user segment. Unequal segment distributions can confound the overall comparison.', 'El efecto agregado del tratamiento se invierte en al menos un segmento. Las distribuciones desiguales pueden distorsionar la comparación global.')}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="name" stroke="var(--chart-tick)" />
            <YAxis stroke="var(--chart-tick)" tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
            />
            <Legend />
            <Bar dataKey="control" name={tr("Control")} fill="var(--control)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="treatment" name={tr("Treatment")} fill="var(--treatment)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}
