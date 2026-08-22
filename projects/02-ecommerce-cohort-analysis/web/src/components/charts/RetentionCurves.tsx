'use client'

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from '@/components/ChartTooltip'
import { formatCohort, formatPercent, formatPercentTick } from '@/lib/format'
import type { CurvePoint, RetentionRow } from '@/lib/filters'

const axis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 11 },
  tickLine: false,
}

/**
 * The average retention curve, with every individual cohort behind it.
 *
 * The faint per-cohort lines are the point of the chart, not decoration: an
 * average alone would hide that the cohorts agree closely for the first two
 * months and diverge afterwards. They are drawn at 10% opacity in the series-1
 * hue and carry no tooltip -- 23 overlapping hover targets would make the mean,
 * which is the readable series, impossible to hit.
 */
export function AverageRetentionCurve({
  curve,
  rows,
}: {
  curve: CurvePoint[]
  rows: RetentionRow[]
}) {
  // One row per month, with each cohort's value as its own key so Recharts can
  // draw them as separate lines over a shared x-axis.
  const data = curve.map((p) => {
    // The tuple widens the value type: `range` is a pair, every other key a
    // scalar, and Recharts reads both off the same row.
    const point: Record<string, number | null | [number, number]> = {
      month: p.month,
      mean: p.mean,
      // A two-element value, which Recharts draws as a band between the pair.
      // Not two stacked Areas: a stacked series is measured from zero, forcing
      // the y-axis to include 0 and flattening a chart whose range is under 1%.
      range: [p.ciLower, p.ciUpper] as [number, number],
    }
    for (const row of rows) point[`c_${row.cohort}`] = row.values[p.month] ?? null
    return point
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="month"
          {...axis}
          label={{
            value: 'Meses desde la primera compra',
            position: 'insideBottom',
            offset: -2,
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
              // Only the mean; the 23 faint cohort lines and the two band
              // series are excluded so the tooltip stays one row, not twenty-six.
              only={['mean']}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--chart-tick)' }}
          payload={[
            { value: 'Promedio de cohortes', type: 'line', color: 'var(--series-1)' },
            { value: 'IC 95%', type: 'rect', color: 'var(--series-1)' },
            { value: 'Cohortes individuales', type: 'line', color: 'var(--chart-tick)' },
          ]}
        />

        {rows.map((row) => (
          <Line
            key={row.cohort}
            type="linear"
            dataKey={`c_${row.cohort}`}
            name={formatCohort(row.cohort)}
            stroke="var(--series-1)"
            strokeOpacity={0.1}
            strokeWidth={1}
            dot={false}
            activeDot={false}
            legendType="none"
            isAnimationActive={false}
          />
        ))}

        <Area
          type="linear"
          dataKey="range"
          stroke="none"
          fill="var(--series-1)"
          fillOpacity={0.14}
          name="IC 95%"
          legendType="none"
          isAnimationActive={false}
        />

        <Line
          type="linear"
          dataKey="mean"
          name="Promedio"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0, fill: 'var(--series-1)' }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--chart-bg)' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/**
 * Cohort curves against the average: either the two extremes, or a chosen few.
 *
 * Two modes rather than one chart that does both, because the number of coloured
 * lines is capped at three by what the palette can actually separate. Validating
 * every *pair* of hues -- not just neighbours -- the four-hue sets all fail: red
 * against amber is ΔE 14.4 to normal vision, below the floor. These two sets were
 * each validated at `--pairs all` in both themes and pass:
 *
 *   extremes  green #059669 + red #DC2626        (roles, so hues are fixed)
 *   selected  blue #2563EB, amber #D97706, green #059669
 *
 * The average is gray in both, as a reference rather than a series. Best and
 * worst keep fixed hues across filter changes -- they are roles, not ranks in a
 * list that repaints.
 */
const SELECTED_HUES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)']

export function CohortComparison({
  rows,
  curve,
  best,
  worst,
  selected,
}: {
  rows: RetentionRow[]
  curve: CurvePoint[]
  /** Extremes mode when null; otherwise the chosen cohorts, at most three. */
  best: string | null
  worst: string | null
  selected: string[]
}) {
  const byCohort = new Map(rows.map((r) => [r.cohort, r]))
  const showExtremes = best !== null && worst !== null
  const picked = showExtremes ? [] : selected.slice(0, SELECTED_HUES.length)

  const data = curve.map((p) => {
    const point: Record<string, number | null> = { month: p.month, mean: p.mean }
    if (showExtremes) {
      point.best = byCohort.get(best)?.values[p.month] ?? null
      point.worst = byCohort.get(worst)?.values[p.month] ?? null
    }
    for (const o of picked) point[`o_${o}`] = byCohort.get(o)?.values[p.month] ?? null
    return point
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="month"
          {...axis}
          label={{
            value: 'Meses desde la primera compra',
            position: 'insideBottom',
            offset: -2,
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
        <Line
          type="linear"
          dataKey="mean"
          name="Promedio"
          stroke="var(--chart-tick)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
        {showExtremes && (
          <Line
            type="linear"
            dataKey="best"
            name={`Mejor · ${formatCohort(best)}`}
            stroke="var(--series-3)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: 'var(--series-3)' }}
          />
        )}
        {showExtremes && (
          <Line
            type="linear"
            dataKey="worst"
            name={`Peor · ${formatCohort(worst)}`}
            stroke="var(--series-5)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: 'var(--series-5)' }}
          />
        )}
        {picked.map((o, i) => (
          <Line
            key={o}
            type="linear"
            dataKey={`o_${o}`}
            name={formatCohort(o)}
            stroke={SELECTED_HUES[i]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
