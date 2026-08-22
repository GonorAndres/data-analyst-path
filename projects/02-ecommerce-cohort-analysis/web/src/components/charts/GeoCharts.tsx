'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { ChartTooltip } from '@/components/ChartTooltip'
import { formatExact, formatPercent, formatPercentTick } from '@/lib/format'
import type { StateRow } from '@/lib/filters'

const axis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 11 },
  tickLine: false,
}

/**
 * States ranked by repeat rate, against the national median.
 *
 * One hue throughout, with bars above the median at full strength and the rest
 * at 55%. The Streamlit version painted three colours by tier -- green above
 * 1.2x the median, amber in the middle, red below -- which makes colour encode
 * rank: change the filter, a state crosses a threshold, and it changes colour
 * without its retention having changed at all. The median line carries that
 * comparison instead, and it carries it exactly rather than in tiers.
 */
export function StateRanking({ data, median }: { data: StateRow[]; median: number }) {
  const sorted = [...data].sort((a, b) => a.repeatPct - b.repeatPct)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
          {...axis}
        />
        {/* interval 0: with 27 categories Recharts thins the labels by default and
         *  drops every other state code, which makes the ranking unreadable. */}
        <YAxis type="category" dataKey="state" width={40} interval={0} {...axis} />
        <Tooltip
          cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }}
          content={
            <ChartTooltip
              valueFormatter={(v) => formatPercent(v, 2)}
              labelFormatter={(l) => `Estado ${l}`}
            />
          }
        />
        <ReferenceLine x={median} stroke="var(--chart-label)" strokeDasharray="3 3">
          <Label
            value={`Mediana nacional ${median.toFixed(1)}%`}
            position="insideTopRight"
            fill="var(--chart-label)"
            fontSize={11}
          />
        </ReferenceLine>
        <Bar dataKey="repeatPct" name="Tasa de recompra" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {sorted.map((d) => (
            <Cell
              key={d.state}
              fill="var(--series-1)"
              fillOpacity={d.repeatPct >= median ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Three hues, and three is the cap on how many states can be compared at once.
 *
 * This exact triple was validated across every pair -- not just neighbours -- in
 * both themes: blue, amber and green stay separable, while adding a fourth does
 * not. The five-hue version this replaces put `#2563EB` and `#7C3AED` on the same
 * axes, which are ΔE 0.4 apart under deuteranopia: two states drawn in what a
 * deuteranopic reader sees as one colour.
 *
 * Direct comparison is this chart's whole purpose, so it stays a single panel and
 * the series count gives way instead. The green/amber pair sits at ΔE 7.9 under
 * protanopia, inside the band that is legal only with secondary encoding -- hence
 * the legend and the table view, both always present.
 */
export const MAX_COMPARED_STATES = 3

const STATE_HUES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)']

/** Retention curves for the selected states, as a share of each state's month 0. */
export function StateRetentionCurves({
  data,
  states,
}: {
  data: { month: number; [state: string]: number | null }[]
  states: string[]
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="month"
          {...axis}
          label={{
            value: 'Meses desde la primera compra',
            position: 'insideBottom',
            offset: -4,
            fill: 'var(--chart-tick)',
            fontSize: 11,
          }}
        />
        <YAxis tickFormatter={formatPercentTick} width={54} {...axis} />
        <Tooltip
          cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1 }}
          content={
            <ChartTooltip
              valueFormatter={(v) => formatPercent(v, 2)}
              labelFormatter={(l) => `Mes ${l}`}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--chart-tick)' }}
        />
        {states.map((s, i) => (
          <Line
            key={s}
            type="linear"
            dataKey={s}
            name={s}
            stroke={STATE_HUES[i % STATE_HUES.length]}
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chart-bg)' }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/**
 * Delivery time against repeat rate, one mark per state.
 *
 * Every point is labelled with its state code, because with ~24 marks the
 * question is always "which one is that?" and a hover tooltip cannot answer it
 * for the reader looking at the overall shape. The fitted line is drawn only as
 * a visual summary of the correlation stated in the caption -- it is 24 states,
 * not 24 experiments, so it describes an association and nothing more.
 */
export function DeliveryScatter({
  data,
  fit,
}: {
  data: StateRow[]
  fit: { slope: number; intercept: number } | null
}) {
  const points = data
    .filter((d) => d.deliveryDays !== null)
    .map((d) => ({
      x: d.deliveryDays as number,
      y: d.repeatPct,
      state: d.state,
      customers: d.customers,
    }))

  const xs = points.map((p) => p.x)
  const line =
    fit && points.length
      ? [
          { x: Math.min(...xs), y: fit.intercept + fit.slope * Math.min(...xs) },
          { x: Math.max(...xs), y: fit.intercept + fit.slope * Math.max(...xs) },
        ]
      : []

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 16, right: 24, left: 4, bottom: 12 }}>
        <CartesianGrid stroke="var(--chart-grid)" />
        <XAxis
          type="number"
          dataKey="x"
          name="Entrega"
          domain={['dataMin - 1', 'dataMax + 1']}
          tickFormatter={(v) => `${Number(v).toFixed(0)}d`}
          {...axis}
          label={{
            value: 'Días promedio de entrega',
            position: 'insideBottom',
            offset: -8,
            fill: 'var(--chart-tick)',
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Recompra"
          tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
          width={48}
          {...axis}
        />
        <ZAxis type="number" dataKey="customers" range={[40, 520]} name="Clientes" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'var(--chart-tick)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const p = payload[0].payload as (typeof points)[number]
            if (p.state === undefined) return null
            return (
              <div
                className="border border-border dark:border-[#2a2a2a] rounded-sm px-3 py-2 shadow-sm"
                style={{ background: 'var(--chart-bg)' }}
              >
                <p className="font-sans text-xs text-muted mb-1">Estado {p.state}</p>
                <p className="font-sans text-sm text-[var(--chart-label)] tabular-nums">
                  {p.x.toFixed(1)} días · {p.y.toFixed(2)}% recompra
                </p>
                <p className="font-sans text-xs text-muted tabular-nums">
                  {formatExact(p.customers)} clientes
                </p>
              </div>
            )
          }}
        />
        {line.length === 2 && (
          <Scatter
            data={line}
            line={{ stroke: 'var(--chart-tick)', strokeWidth: 1.5, strokeDasharray: '5 4' }}
            shape={() => <g />}
            legendType="none"
            isAnimationActive={false}
          />
        )}
        <Scatter
          data={points}
          fill="var(--series-1)"
          fillOpacity={0.6}
          stroke="var(--chart-bg)"
          strokeWidth={1.5}
          isAnimationActive={false}
          label={{
            dataKey: 'state',
            position: 'top',
            fill: 'var(--chart-label)',
            fontSize: 10,
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
