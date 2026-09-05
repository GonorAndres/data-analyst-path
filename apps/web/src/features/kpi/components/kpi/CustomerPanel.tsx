'use client'
import { ChartState } from '@/components/ChartState'
import { usePreferences } from '@/components/SitePreferences'
import { useKPIFilters } from '@/features/kpi/context/KPIFilterContext'
import { useLanguage } from '@/features/kpi/context/LanguageContext'
import { useCustomers } from '@/features/kpi/hooks/useKPIAPI'
import { ChartContainer } from '@/features/kpi/components/ui/ChartContainer'
import {
  LineChart, Line, AreaChart, Area, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import type { CustomerResponse } from '@/features/kpi/types/kpi-types'

function ChurnChart({ data, t }: { data: CustomerResponse['churn_trend']; t: (k: any) => string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <Tooltip
          formatter={(val: number) => `${(val * 100).toFixed(2)}%`}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="logo_churn" stroke="var(--chart-churn)" strokeWidth={2} dot={false} name={t('customer.logo_churn')} />
        <Line type="monotone" dataKey="revenue_churn" stroke="var(--chart-contraction)" strokeWidth={2} dot={false} name={t('customer.revenue_churn')} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function NRRTrendChart({ data }: { data: CustomerResponse['nrr_trend'] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} domain={['auto', 'auto']} />
        <Tooltip
          formatter={(val: number) => `${(val * 100).toFixed(1)}%`}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <ReferenceLine y={1} stroke="var(--chart-tick)" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="nrr" stroke="var(--chart-expansion)" strokeWidth={2} dot={false} name="NRR" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function NPSTrendChart({ data }: { data: CustomerResponse['nps_trend'] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <Tooltip
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        {/* NPS zone coloring */}
        <ReferenceArea y1={-100} y2={0} fill="var(--status-red)" fillOpacity={0.05} />
        <ReferenceArea y1={0} y2={30} fill="var(--status-yellow)" fillOpacity={0.05} />
        <ReferenceArea y1={30} y2={70} fill="var(--status-green)" fillOpacity={0.05} />
        <ReferenceArea y1={70} y2={100} fill="var(--accent-cyan)" fillOpacity={0.05} />
        <ReferenceLine y={0} stroke="var(--chart-tick)" strokeDasharray="3 3" />
        <ReferenceLine y={30} stroke="var(--status-yellow)" strokeDasharray="3 3" strokeOpacity={0.5} />
        <ReferenceLine y={70} stroke="var(--status-green)" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Line type="monotone" dataKey="nps" stroke="var(--accent-cyan)" strokeWidth={2.5} dot={false} name="NPS" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function LorenzCurve({ data }: { data: CustomerResponse['lorenz_curve'] }) {
  const { t } = usePreferences()
  // Add equality line data
  const equalityLine = [
    { pct_customers: 0, pct_revenue: 0 },
    { pct_customers: 100, pct_revenue: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis
          dataKey="pct_customers"
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: 'var(--chart-tick)' }}
          label={{ value: t('% Customers', '% Clientes'), position: 'bottom', offset: -5, fontSize: 11, fill: 'var(--chart-tick)' }}
        />
        <YAxis
          dataKey="pct_revenue"
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: 'var(--chart-tick)' }}
          label={{ value: t('% Revenue', '% Ingresos'), angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--chart-tick)' }}
        />
        <Tooltip
          formatter={(val: number) => `${val.toFixed(1)}%`}
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        {/* Equality line */}
        <Line data={equalityLine} type="linear" dataKey="pct_revenue" stroke="var(--chart-tick)" strokeDasharray="5 5" dot={false} />
        {/* Lorenz curve */}
        <Area data={data} type="monotone" dataKey="pct_revenue" stroke="var(--accent-violet)" fill="var(--accent-violet)" fillOpacity={0.15} strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function SupportTicketsChart({ data }: { data: CustomerResponse['support_tickets'] }) {
  const { t } = usePreferences()
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} tickFormatter={(v) => `${v}h`} />
        <Tooltip
          contentStyle={{
            background: 'var(--chart-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="tickets" fill="var(--accent-cyan)" fillOpacity={0.3} stroke="var(--accent-cyan)" name={t('Tickets', 'Solicitudes')} radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="resolution_hours" stroke="var(--accent-violet)" strokeWidth={2} dot={false} name={t('Avg Resolution (h)', 'Resolución media (h)')} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function CustomerPanel() {
  const { queryString } = useKPIFilters()
  const { t } = useLanguage()
  const { data, isLoading, error } = useCustomers(queryString)

  const c = data as CustomerResponse | undefined

  if (data && typeof data === 'object' && 'error' in data) return <ChartState empty={String(data.error).startsWith('No data')} error={String(data.error).startsWith('No data') ? undefined : data.error} />

  if (isLoading || error || !c) return <ChartState loading={isLoading} error={error} empty={!c} />

  return (
    <div className="space-y-6">
      {/* Commentary */}
      {c.commentary && (
        <div className="glass-card p-5">
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{c.commentary}</p>
        </div>
      )}

      {/* Churn Trends */}
      <ChartContainer title={t('customer.churn_title')} subtitle={t('customer.churn_subtitle')}>
        <ChurnChart data={c.churn_trend} t={t} />
      </ChartContainer>

      {/* NRR */}
      <ChartContainer title={t('customer.nrr_title')} subtitle={t('customer.nrr_subtitle')}>
        <NRRTrendChart data={c.nrr_trend} />
      </ChartContainer>

      {/* NPS */}
      <ChartContainer title={t('customer.nps_title')} subtitle={t('customer.nps_subtitle')}>
        <NPSTrendChart data={c.nps_trend} />
      </ChartContainer>

      {/* Lorenz Curve */}
      <ChartContainer title={t('customer.lorenz_title')} subtitle={t('customer.lorenz_subtitle')}>
        <LorenzCurve data={c.lorenz_curve} />
      </ChartContainer>

      {/* Support Tickets */}
      <ChartContainer title={t('customer.tickets_title')} subtitle={t('customer.tickets_subtitle')}>
        <SupportTicketsChart data={c.support_tickets} />
      </ChartContainer>
    </div>
  )
}
