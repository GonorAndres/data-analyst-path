'use client'
import { ChartState } from '@/components/ChartState'
import { metricLabel } from '@/features/kpi/lib/metric-labels'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, ArrowUpDown } from 'lucide-react'
import { useKPIFilters } from '@/features/kpi/context/KPIFilterContext'
import { useLanguage } from '@/features/kpi/context/LanguageContext'
import { useAnomalies } from '@/features/kpi/hooks/useKPIAPI'
import { ChartContainer } from '@/features/kpi/components/ui/ChartContainer'
import { StatusBadge } from '@/features/kpi/components/ui/StatusBadge'
import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis, Cell,
} from 'recharts'
import type { AnomalyResponse, AnomalyItem } from '@/features/kpi/types/kpi-types'

function SummaryCards({ summary, t }: { summary: AnomalyResponse['summary']; t: (k: any) => string }) {
  const cards = [
    { label: t('anomaly.critical'), count: summary.critical_count, status: 'critical' as const, icon: <AlertTriangle size={16} /> },
    { label: t('anomaly.warning'), count: summary.warning_count, status: 'warning' as const, icon: <AlertCircle size={16} /> },
    { label: t('anomaly.info'), count: summary.info_count, status: 'info' as const, icon: <Info size={16} /> },
    { label: t('anomaly.total'), count: summary.total, status: 'green' as const, icon: null },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2 text-[var(--fg-muted)]">
            {card.icon}
            <span className="text-xs font-semibold uppercase tracking-wider">{card.label}</span>
          </div>
          <span className="text-3xl font-light tabular-nums text-[var(--fg-primary)]">{card.count}</span>
        </motion.div>
      ))}
    </div>
  )
}

function AnomalyTimeline({ anomalies }: { anomalies: AnomalyItem[] }) {
  const scatterData = anomalies.map((a) => ({
    month: a.month,
    z_score: Math.abs(a.z_score),
    severity: a.severity,
    metric: a.metric,
    value: a.value,
  }))

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'var(--status-red)'
      case 'warning': return 'var(--status-yellow)'
      default: return 'var(--accent-cyan)'
    }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} type="category" allowDuplicatedCategory={false} />
        <YAxis dataKey="z_score" name="|z|" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} label={{ value: '|z|', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--chart-tick)' }} />
        <ZAxis dataKey="z_score" range={[50, 400]} />
        <Tooltip
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(val: number, name: string) => [val.toFixed(2), name]}
        />
        <Scatter data={scatterData}>
          {scatterData.map((entry, idx) => (
            <Cell key={idx} fill={severityColor(entry.severity)} fillOpacity={0.8} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

type SortField = 'metric' | 'month' | 'z_score' | 'severity'
type SortDir = 'asc' | 'desc'

function AnomalyTable({ anomalies, t }: { anomalies: AnomalyItem[]; t: (k: any) => string }) {
  const { language } = useLanguage()
  const [sortField, setSortField] = useState<SortField>('z_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const severityRank = { critical: 3, warning: 2, info: 1 }

  const sorted = [...anomalies].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'metric': cmp = a.metric.localeCompare(b.metric); break
      case 'month': cmp = a.month.localeCompare(b.month); break
      case 'z_score': cmp = Math.abs(a.z_score) - Math.abs(b.z_score); break
      case 'severity': cmp = severityRank[a.severity] - severityRank[b.severity]; break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="text-left py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold cursor-pointer hover:text-[var(--fg-primary)] select-none"
      aria-sort={sortField === field ? sortDir === 'asc' ? 'ascending' : 'descending' : 'none'}
    >
      <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={sortField === field ? 'text-[var(--accent-cyan)]' : 'opacity-30'} />
      </button>
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--glass-border)]">
            <SortHeader field="metric" label={t('anomaly.col_metric')} />
            <SortHeader field="month" label={t('anomaly.col_month')} />
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('anomaly.col_value')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{language === 'es' ? 'Referencia y límites' : 'Baseline and bounds'}</th>
            <SortHeader field="z_score" label={t('anomaly.col_zscore')} />
            <SortHeader field="severity" label={t('anomaly.col_severity')} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
              <td className="py-2 px-3 text-[var(--fg-primary)] font-medium">{metricLabel(a.metric, t)}</td>
              <td className="py-2 px-3 text-[var(--fg-secondary)]">{a.month}</td>
              <td className="text-right py-2 px-3 tabular-nums">{a.value.toLocaleString()}</td>
              <td className="text-right py-2 px-3 tabular-nums text-[var(--fg-muted)]">
                {a.evidence?.length ? a.evidence.map((e) => (
                  <div key={e.method} className="whitespace-nowrap">
                    <span className="font-medium">{e.method === 'zscore' ? 'Z-score' : 'IQR'}</span>
                    {' · '}{e.baseline_kind === 'mean' ? (language === 'es' ? 'media' : 'mean') : (language === 'es' ? 'mediana' : 'median')}: {e.expected.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    <div className="text-xs">[{e.lower_bound.toLocaleString(undefined, { maximumFractionDigits: 4 })}, {e.upper_bound.toLocaleString(undefined, { maximumFractionDigits: 4 })}]</div>
                  </div>
                )) : a.expected.toLocaleString()}
              </td>
              <td className="text-right py-2 px-3 tabular-nums font-medium">{a.z_score.toFixed(2)}</td>
              <td className="py-2 px-3">
                <StatusBadge status={a.severity} label={t(`anomaly.${a.severity}`)} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AnomalyPanel() {
  const { queryString } = useKPIFilters()
  const { t, language } = useLanguage()
  const { data, isLoading, error } = useAnomalies(queryString)

  const a = data as AnomalyResponse | undefined

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !a) return <ChartState loading={isLoading} error={error} empty={!a} />

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
        {language === 'es'
          ? 'Demostración con datos sintéticos. Se comparan todos los segmentos durante los meses seleccionados; el filtro de segmento no modifica estas alertas. Z-score usa la media y la desviación estándar muestral; IQR usa la mediana y límites Q1 − 1.5 × IQR y Q3 + 1.5 × IQR. Son referencias descriptivas, no pronósticos ni metas. La gráfica muestra |z|; los casos IQR pueden tener |z| menor que 2.'
          : 'Synthetic-data demonstration. Alerts compare all segments over the selected months; the segment filter does not change these alerts. Z-score uses the mean and sample standard deviation; IQR uses the median and Q1 − 1.5 × IQR / Q3 + 1.5 × IQR bounds. These are descriptive baselines, not forecasts or targets. The chart shows |z|; IQR outliers may have |z| below 2.'}
      </p>
      {/* Commentary */}
      {a.commentary && (
        <div className="glass-card p-5">
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{a.commentary}</p>
        </div>
      )}

      {/* Summary cards */}
      <SummaryCards summary={a.summary} t={t} />

      {/* Timeline scatter */}
      <ChartContainer title={t('anomaly.timeline_title')} subtitle={t('anomaly.subtitle')}>
        <AnomalyTimeline anomalies={a.anomalies} />
      </ChartContainer>

      {/* Details table */}
      <ChartContainer title={t('anomaly.details_title')}>
        <AnomalyTable anomalies={a.anomalies} t={t} />
      </ChartContainer>
    </div>
  )
}
