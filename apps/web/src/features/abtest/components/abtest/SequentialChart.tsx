'use client'
import { ChartState } from '@/components/ChartState'
import { useABText } from '@/features/abtest/lib/translations'
import { usePreferences } from '@/components/SitePreferences'
import { ChartContainer } from '@/features/abtest/components/ui/ChartContainer'
import { useSequential } from '@/features/abtest/hooks/useABTestAPI'
import { useABTestFilters } from '@/features/abtest/context/ABTestFilterContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Area, ComposedChart,
} from 'recharts'

export function SequentialChart() {
  const tr = useABText()
  const { t } = usePreferences()
  const { queryString } = useABTestFilters()
  const { data, error, isLoading } = useSequential(queryString)

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !data) return <ChartState loading={isLoading} error={error} empty={!data} />

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
        title={tr("Cumulative Conversion Over Time")}
        subtitle={tr("Control vs treatment conversion rates as data accumulates")}
        insight={d.optimal_stopping_point
          ? `${t('O’Brien-Fleming stopping boundary crossed', 'Se cruzó el límite de parada de O’Brien-Fleming')}: ${d.optimal_stopping_point.date} (${t('day', 'día')} ${d.optimal_stopping_point.day_number}).`
          : t('The z-statistic did not cross the O’Brien-Fleming stopping boundary during this experiment.', 'El estadístico Z no cruzó el límite de parada de O’Brien-Fleming durante el experimento.')}
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
              <Line type="monotone" dataKey="control" stroke="var(--control)" strokeWidth={2} dot={false} name={tr("Control")} />
              <Line type="monotone" dataKey="treatment" stroke="var(--treatment)" strokeWidth={2} dot={false} name={tr("Treatment")} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Z-Statistic with O'Brien-Fleming Boundaries")}
        subtitle={tr("Sequential monitoring: crossing the boundary justifies early stopping")}
        insight={tr("The O'Brien-Fleming approach uses conservative early boundaries that become more lenient over time, controlling the overall Type I error rate.")}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={zData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" stroke="var(--chart-tick)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="var(--chart-tick)" />
              <Tooltip contentStyle={{ background: 'var(--chart-bg)', border: '1px solid var(--chart-grid)' }} />
              <Legend />
              <Line type="monotone" dataKey="z_stat" stroke="var(--accent-indigo)" strokeWidth={2} dot={false} name={tr("Z-statistic")} />
              <Line type="monotone" dataKey="upper_bound" stroke="var(--sig-negative)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={tr("Upper Boundary")} />
              <Line type="monotone" dataKey="lower_bound" stroke="var(--sig-negative)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={tr("Lower Boundary")} />
              <ReferenceLine y={0} stroke="var(--chart-tick)" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer
        title={tr("Daily P-Value Evolution")}
        subtitle={tr("Why peeking at p-values is dangerous")}
        insight={tr("Computing p-values daily without correction inflates the false positive rate. The dashed line shows alpha=0.05. Multiple crossings don't mean significance.")}
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
              <Line type="monotone" dataKey="p_value" stroke="var(--accent-indigo)" strokeWidth={1.5} dot={false} name={tr("p-value")} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  )
}
