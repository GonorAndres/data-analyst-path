'use client'
import { useKPIFilters } from '@/context/KPIFilterContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRevenue } from '@/hooks/useKPIAPI'
import { ChartContainer } from '@/components/ui/ChartContainer'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import type { RevenueResponse, WaterfallItem, MRRMovement } from '@/types/kpi-types'

const CHART_COLORS = {
  revenue: 'var(--chart-revenue)',
  new: 'var(--chart-new)',
  expansion: 'var(--chart-expansion)',
  contraction: 'var(--chart-contraction)',
  churn: 'var(--chart-churn)',
  forecast: 'var(--chart-forecast)',
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function WaterfallChart({ data }: { data: WaterfallItem[] }) {
  // Transform waterfall data: each bar has invisible base + visible segment
  let running = 0
  const chartData = data.map((item) => {
    if (item.type === 'start') {
      running = item.value
      return { name: item.name, base: 0, value: item.value, fill: CHART_COLORS.revenue, type: item.type }
    } else if (item.type === 'end') {
      return { name: item.name, base: 0, value: item.value, fill: CHART_COLORS.revenue, type: item.type }
    } else if (item.type === 'positive') {
      const base = running
      running += item.value
      return { name: item.name, base, value: item.value, fill: CHART_COLORS.expansion, type: item.type }
    } else {
      // negative
      running += item.value // item.value is negative
      const base = running
      return { name: item.name, base, value: Math.abs(item.value), fill: CHART_COLORS.churn, type: item.type }
    }
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <Tooltip
          formatter={(val: number) => formatCurrency(val)}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        {/* Invisible base */}
        <Bar dataKey="base" stackId="stack" fill="transparent" />
        {/* Visible segment */}
        <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ARRTrendChart({ data }: { data: RevenueResponse['arr_trend'] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <Tooltip
          formatter={(val: number) => formatCurrency(val)}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="arr" stroke={CHART_COLORS.revenue} strokeWidth={2} dot={false} name="ARR" />
        <Line type="monotone" dataKey="target" stroke={CHART_COLORS.forecast} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SegmentAreaChart({ data }: { data: RevenueResponse['segment_breakdown'] }) {
  if (!data || data.length === 0) return null

  // Extract segment keys (all keys except 'month')
  const segmentKeys = Object.keys(data[0]).filter((k) => k !== 'month')
  const segColors = [CHART_COLORS.revenue, CHART_COLORS.expansion, CHART_COLORS.new, CHART_COLORS.forecast]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <Tooltip
          formatter={(val: number) => formatCurrency(val)}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        {segmentKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={segColors[i % segColors.length]}
            fill={segColors[i % segColors.length]}
            fillOpacity={0.3}
            name={key}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function NRRChart({ data }: { data: RevenueResponse['nrr_trend'] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} domain={['auto', 'auto']} />
        <Tooltip
          formatter={(val: number) => `${val.toFixed(1)}%`}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <ReferenceLine y={100} stroke="var(--chart-tick)" strokeDasharray="3 3" label={{ value: '100%', position: 'right', fontSize: 10, fill: 'var(--chart-tick)' }} />
        <Line type="monotone" dataKey="nrr" stroke={CHART_COLORS.expansion} strokeWidth={2} dot={false} name="NRR" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function MovementsTable({ data, t }: { data: MRRMovement[]; t: (k: any) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--glass-border)]">
            <th className="text-left py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">Month</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('revenue.starting')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('revenue.new')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('revenue.expansion')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('revenue.contraction')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('revenue.churned')}</th>
            <th className="text-right py-2 px-3 text-[var(--fg-muted)] text-xs font-semibold">{t('revenue.ending')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
              <td className="py-2 px-3 text-[var(--fg-primary)] font-medium">{row.month}</td>
              <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(row.starting)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-[var(--status-green)]">+{formatCurrency(row.new)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-[var(--status-green)]">+{formatCurrency(row.expansion)}</td>
              <td className="text-right py-2 px-3 tabular-nums text-[var(--status-red)]">-{formatCurrency(Math.abs(row.contraction))}</td>
              <td className="text-right py-2 px-3 tabular-nums text-[var(--status-red)]">-{formatCurrency(Math.abs(row.churned))}</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium">{formatCurrency(row.ending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RevenuePanel() {
  const { queryString } = useKPIFilters()
  const { t } = useLanguage()
  const { data, isLoading, error } = useRevenue(queryString)

  const r = data as RevenueResponse | undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="skeleton h-5 w-48 mb-4" />
            <div className="skeleton h-64 w-full" />
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

  if (!r) return null

  return (
    <div className="space-y-6">
      {/* Commentary */}
      {r.commentary && (
        <div className="glass-card p-5">
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{r.commentary}</p>
        </div>
      )}

      {/* MRR Waterfall */}
      <ChartContainer title={t('revenue.waterfall_title')} subtitle={t('revenue.waterfall_subtitle')}>
        <WaterfallChart data={r.waterfall} />
      </ChartContainer>

      {/* ARR Trend */}
      <ChartContainer title={t('revenue.arr_trend_title')} subtitle={t('revenue.arr_trend_subtitle')}>
        <ARRTrendChart data={r.arr_trend} />
      </ChartContainer>

      {/* Revenue by Segment */}
      <ChartContainer title={t('revenue.segment_title')} subtitle={t('revenue.segment_subtitle')}>
        <SegmentAreaChart data={r.segment_breakdown} />
      </ChartContainer>

      {/* NRR Trend */}
      <ChartContainer title={t('revenue.nrr_title')} subtitle={t('revenue.nrr_subtitle')}>
        <NRRChart data={r.nrr_trend} />
      </ChartContainer>

      {/* MRR Movements Table */}
      {r.mrr_movements && r.mrr_movements.length > 0 && (
        <ChartContainer title={t('revenue.movements_title')}>
          <MovementsTable data={r.mrr_movements} t={t} />
        </ChartContainer>
      )}
    </div>
  )
}
