'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from '@/components/ChartTooltip'
import { formatCohort, formatCurrency, formatExact } from '@/lib/format'

/** Axis and grid styling shared by every Recharts chart here: recessive, so the
 *  marks carry the attention rather than the scaffolding. */
const axis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 11 },
  tickLine: false,
}

export function RevenueTrend({
  data,
  peak,
}: {
  data: { month: string; revenue: number }[]
  peak: { month: string; revenue: number } | null
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatCohort} interval="preserveStartEnd" {...axis} />
        <YAxis tickFormatter={(v) => formatCurrency(Number(v))} width={64} {...axis} />
        <Tooltip
          cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1 }}
          content={
            <ChartTooltip valueFormatter={(v) => formatCurrency(v)} labelFormatter={formatCohort} />
          }
        />
        {/* The peak is the one point the copy refers to, so it is labelled
         *  directly rather than left for the reader to find. */}
        {peak && (
          <ReferenceLine
            x={peak.month}
            stroke="var(--chart-tick)"
            strokeDasharray="3 3"
            label={{
              value: `Pico · ${formatCurrency(peak.revenue)}`,
              position: 'insideTopRight',
              fill: 'var(--chart-label)',
              fontSize: 11,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="revenue"
          name="Ingresos"
          stroke="var(--series-1)"
          strokeWidth={2}
          fill="url(#revFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chart-bg)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function AcquisitionTrend({
  data,
}: {
  data: { cohort: string; customers: number }[]
}) {
  const max = Math.max(...data.map((d) => d.customers), 0)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="cohort" tickFormatter={formatCohort} interval="preserveStartEnd" {...axis} />
        <YAxis tickFormatter={(v) => formatExact(Number(v))} width={52} {...axis} />
        <Tooltip
          cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }}
          content={
            <ChartTooltip valueFormatter={(v) => formatExact(v)} labelFormatter={formatCohort} />
          }
        />
        {/* One series, so no legend: the title names it. The largest cohort is
         *  darkened rather than hue-shifted -- rank must not repaint identity. */}
        <Bar dataKey="customers" name="Clientes nuevos" radius={[4, 4, 0, 0]} maxBarSize={26}>
          {data.map((d) => (
            <Cell
              key={d.cohort}
              fill="var(--series-1)"
              fillOpacity={d.customers === max ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
