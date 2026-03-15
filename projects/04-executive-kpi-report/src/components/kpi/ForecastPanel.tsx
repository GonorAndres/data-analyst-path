'use client'
import { useKPIFilters } from '@/context/KPIFilterContext'
import { useLanguage } from '@/context/LanguageContext'
import { useForecast } from '@/hooks/useKPIAPI'
import { ChartContainer } from '@/components/ui/ChartContainer'
import {
  LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { ForecastResponse, ForecastMetric } from '@/types/kpi-types'

function formatValue(value: number, metric: string): string {
  if (metric.toLowerCase().includes('mrr') || metric.toLowerCase().includes('arr')) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }
  if (metric.toLowerCase().includes('churn') || metric.toLowerCase().includes('nrr')) {
    return `${value.toFixed(1)}%`
  }
  return value.toFixed(1)
}

function ForecastChart({ forecast }: { forecast: ForecastMetric }) {
  const { t } = useLanguage()

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={forecast.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis
          tickFormatter={(v) => formatValue(v, forecast.metric)}
          tick={{ fontSize: 11, fill: 'var(--chart-tick)' }}
        />
        <Tooltip
          formatter={(val: number) => formatValue(val, forecast.metric)}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />

        {/* Confidence interval band */}
        <Area
          type="monotone"
          dataKey="upper_ci"
          stroke="none"
          fill="var(--chart-forecast)"
          fillOpacity={0.1}
          name={t('forecast.ci')}
        />
        <Area
          type="monotone"
          dataKey="lower_ci"
          stroke="none"
          fill="var(--chart-bg)"
          fillOpacity={1}
          name=""
          legendType="none"
        />

        {/* Target line */}
        <Line
          type="monotone"
          dataKey="target"
          stroke="var(--chart-tick)"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          name={t('forecast.target')}
        />

        {/* Actual line */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="var(--chart-revenue)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--chart-revenue)' }}
          name={t('forecast.actual')}
          connectNulls={false}
        />

        {/* Forecast line */}
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="var(--chart-forecast)"
          strokeWidth={2}
          strokeDasharray="8 4"
          dot={{ r: 3, fill: 'var(--chart-forecast)' }}
          name={t('forecast.predicted')}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function ComparisonTable({ forecasts, t }: { forecasts: ForecastMetric[]; t: (k: any) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--glass-border)]">
            <th className="text-left py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('forecast.metric')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('forecast.last_actual')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('forecast.next_forecast')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('forecast.target')}</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((f) => {
            const actuals = f.data.filter((d) => d.actual !== null)
            const lastActual = actuals.length > 0 ? actuals[actuals.length - 1] : null
            const forecasted = f.data.filter((d) => d.forecast !== null)
            const nextForecast = forecasted.length > 0 ? forecasted[0] : null
            const lastTarget = f.data.filter((d) => d.target !== null).at(-1)

            return (
              <tr key={f.metric} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
                <td className="py-2 px-3 text-[var(--fg-primary)] font-medium">{f.metric_label}</td>
                <td className="text-right py-2 px-3 tabular-nums">
                  {lastActual?.actual != null ? formatValue(lastActual.actual, f.metric) : '--'}
                </td>
                <td className="text-right py-2 px-3 tabular-nums text-[var(--accent-violet)]">
                  {nextForecast?.forecast != null ? formatValue(nextForecast.forecast, f.metric) : '--'}
                </td>
                <td className="text-right py-2 px-3 tabular-nums text-[var(--fg-muted)]">
                  {lastTarget?.target != null ? formatValue(lastTarget.target, f.metric) : '--'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ForecastPanel() {
  const { queryString } = useKPIFilters()
  const { t } = useLanguage()
  const { data, isLoading, error } = useForecast(queryString)

  const f = data as ForecastResponse | undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="skeleton h-5 w-48 mb-4" />
            <div className="skeleton h-72 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-[var(--status-red)]">{t('error.load_failed')}</p>
      </div>
    )
  }

  if (!f) return null

  return (
    <div className="space-y-6">
      {/* Commentary */}
      {f.commentary && (
        <div className="glass-card p-5">
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{f.commentary}</p>
        </div>
      )}

      {/* Individual forecast charts */}
      {f.forecasts.map((forecast) => (
        <ChartContainer
          key={forecast.metric}
          title={`${forecast.metric_label} ${t('forecast.predicted')}`}
          subtitle={t('forecast.subtitle')}
        >
          <ForecastChart forecast={forecast} />
        </ChartContainer>
      ))}

      {/* Comparison table */}
      <ChartContainer title={t('forecast.comparison_title')}>
        <ComparisonTable forecasts={f.forecasts} t={t} />
      </ChartContainer>
    </div>
  )
}
