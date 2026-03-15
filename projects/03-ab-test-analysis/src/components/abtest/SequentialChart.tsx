'use client'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { useSequential } from '@/hooks/useABTestAPI'
import { useABTestFilters } from '@/context/ABTestFilterContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Area, ComposedChart,
} from 'recharts'

export function SequentialChart() {
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useSequential(queryString)

  if (isLoading) return <p className="font-sans text-sm text-muted py-10">Loading sequential monitoring...</p>
  if (error || !data) return <p className="font-sans text-sm text-sig-negative py-10">Failed to load data.</p>

  const d = data as any

  const convData = (d.cumulative_stats || []).map((s: any) => ({
    date: s.date,
    control: s.cum_conv_control * 100,
    treatment: s.cum_conv_treatment * 100,
  }))

  const boundaries = d.obrien_fleming_boundaries || []
  const zData = (d.cumulative_stats || []).map((s: any, i: number) => {
    const b = boundaries[i]?.boundary
    return {
      date: s.date,
      z_stat: s.z_stat,
      upper_bound: b ?? boundaries[boundaries.length - 1]?.boundary,
      lower_bound: b ? -b : boundaries[boundaries.length - 1]?.boundary ? -boundaries[boundaries.length - 1].boundary : undefined,
    }
  })

  const pData = (d.cumulative_stats || []).map((s: any) => ({
    date: s.date,
    p_value: s.p_value,
  }))

  return (
    <div>
      <ChartContainer
        title="Cumulative Conversion Over Time"
        subtitle="Control vs treatment conversion rates as data accumulates"
        insight={d.optimal_stopping_point
          ? `A sequential test would have stopped on ${d.optimal_stopping_point.date} (day ${d.optimal_stopping_point.day_number}) when the z-statistic crossed the O'Brien-Fleming boundary.`
          : 'The z-statistic never crossed the O\'Brien-Fleming stopping boundary during this experiment.'}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={convData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="date"
                stroke="var(--chart-tick)"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--chart-tick)"
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(3)}%`}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="control" stroke="var(--control)" strokeWidth={2} dot={false} name="Control" />
              <Line type="monotone" dataKey="treatment" stroke="var(--treatment)" strokeWidth={2} dot={false} name="Treatment" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title="Z-Statistic with O'Brien-Fleming Boundaries"
        subtitle="Sequential monitoring: crossing the boundary justifies early stopping"
        insight="The O'Brien-Fleming approach uses conservative early boundaries that become more lenient over time, controlling the overall Type I error rate."
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={zData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" stroke="var(--chart-tick)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="var(--chart-tick)" />
              <Tooltip contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }} />
              <Legend />
              <Line type="monotone" dataKey="z_stat" stroke="var(--accent-indigo)" strokeWidth={2} dot={false} name="Z-statistic" />
              <Line type="monotone" dataKey="upper_bound" stroke="var(--sig-negative)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Upper Boundary" />
              <Line type="monotone" dataKey="lower_bound" stroke="var(--sig-negative)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Lower Boundary" />
              <ReferenceLine y={0} stroke="var(--chart-tick)" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title="Daily P-Value Evolution"
        subtitle="Why peeking at p-values is dangerous"
        insight="Computing p-values daily without correction inflates the false positive rate. The dashed line shows alpha=0.05. Multiple crossings don't mean significance."
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" stroke="var(--chart-tick)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="var(--chart-tick)" domain={[0, 1]} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip
                formatter={(value: number) => value.toFixed(4)}
                contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }}
              />
              <ReferenceLine y={0.05} stroke="var(--sig-negative)" strokeDasharray="5 5" label={{ value: 'alpha = 0.05', fill: 'var(--sig-negative)', fontSize: 11 }} />
              <Line type="monotone" dataKey="p_value" stroke="var(--accent-indigo)" strokeWidth={1.5} dot={false} name="p-value" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  )
}
