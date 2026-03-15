'use client'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { useSegments } from '@/hooks/useABTestAPI'
import { useABTestFilters } from '@/context/ABTestFilterContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from 'recharts'

export function SimpsonParadox() {
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useSegments(queryString)

  if (isLoading) return <p className="font-sans text-sm text-muted py-10">Loading...</p>
  if (error || !data) return <p className="font-sans text-sm text-sig-negative py-10">Failed to load data.</p>

  const d = (data as any).simpsons_paradox
  if (!d?.detected) {
    return (
      <ChartContainer
        title="Simpson's Paradox Check"
        insight="No Simpson's Paradox detected in this data subset. All segment-level effects are directionally consistent with the aggregate."
      >
        <p className="font-sans text-sm text-muted">Try different filter combinations to explore paradox scenarios.</p>
      </ChartContainer>
    )
  }

  const chartData = [
    {
      name: 'Aggregate',
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
      title="Simpson's Paradox Visualization"
      subtitle="The aggregate trend reverses within subgroups"
      insight={`The overall result shows a ${d.aggregate_lift >= 0 ? 'positive' : 'negative'} treatment effect, but when broken down by user segment, the direction reverses for at least one group. This is caused by confounding -- unequal segment distribution between control and treatment.`}
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
            <Bar dataKey="control" name="Control" fill="var(--control)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="treatment" name="Treatment" fill="var(--treatment)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}
