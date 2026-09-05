'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

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
import { ChartTooltip } from '@/features/cohorts/components/ChartTooltip'
import { FacetGrid } from '@/features/cohorts/components/charts/Facets'
import { formatExact, formatPercent } from '@/features/cohorts/lib/format'
import type { Survival } from '@/features/cohorts/lib/types'

const axis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 11 },
  tickLine: false,
}

/** Reduced axes for facet panels; the shared scale is stated in the card. */
const microAxis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 9 },
  tickLine: false,
}

/**
 * The Kaplan-Meier curve: the probability a customer has NOT yet bought again.
 *
 * Stepped, not smoothed. The estimator is a step function that only changes at
 * observed event times, and interpolating between them would draw a decline on
 * days where nothing was measured -- a real claim about unobserved time.
 *
 * The y-axis starts at the curve's own floor rather than at 0. On a 0-100% axis
 * this curve is a flat line pinned to the top, because ~95% of customers never
 * return; the shape only exists in the top five points of the range. The axis is
 * labelled and the interval drawn so the zoom is stated rather than implied.
 */
export function SurvivalChart({ data }: { data: Survival }) {
  const tx = useProjectText()
  const points = data.days.map((d, i) => ({
    day: d,
    survival: data.survival[i] * 100,
    // A two-element value, which Recharts draws as a band between the pair.
    // The first version stacked two Areas instead -- an invisible floor plus a
    // visible span -- and a stacked series is measured from zero, which dragged
    // the y-axis to 0-100 and flattened this entire curve into the top row of
    // pixels. A range series carries no such baseline.
    range: [data.ci_lower[i] * 100, data.ci_upper[i] * 100] as [number, number],
  }))

  const floor = Math.min(...data.ci_lower) * 100
  const domain: [number, number] = [Math.floor(floor * 2) / 2, 100]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="day"
          type="number"
          domain={[0, 720]}
          ticks={[0, 90, 180, 270, 360, 540, 720]}
          {...axis}
          label={{
            value: tx("Días desde la primera compra"),
            position: 'insideBottom',
            offset: -4,
            fill: 'var(--chart-tick)',
            fontSize: 11,
          }}
        />
        <YAxis
          domain={domain}
          tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
          width={54}
          {...axis}
        />
        <Tooltip
          cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1 }}
          content={
            <ChartTooltip
              valueFormatter={(v) => formatPercent(v, 2)}
              labelFormatter={(l) => (tx("Día") + " " + (l) + "")}
              only={['survival']}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--chart-tick)' }}
          payload={[
            { value: tx("S(t) — aún sin recomprar"), type: 'line', color: 'var(--series-1)' },
            { value: tx("IC 95%"), type: 'rect', color: 'var(--series-1)' },
          ]}
        />
        <Area
          type="stepAfter"
          dataKey="range"
          stroke="none"
          fill="var(--series-1)"
          fillOpacity={0.16}
          legendType="none"
          isAnimationActive={false}
        />
        <Line
          type="stepAfter"
          dataKey="survival"
          name="S(t)"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chart-bg)' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/**
 * The same curve split by a customer attribute, as one panel per group.
 *
 * Faceted rather than overlaid for the reason set out in Facets.tsx: four hues a
 * reader may compare in any pairing is past what this palette carries, and the
 * groups differ by fractions of a percent, so two hard-to-separate lines would be
 * indistinguishable in both senses at once.
 *
 * Each panel repeats the aggregate curve in gray, which is what makes a panel
 * readable alone -- the question is always "does this group behave differently
 * from everyone?", and that comparison is now inside the panel rather than spread
 * across a legend. Shared y-domain, or the panels compare nothing.
 */
export function SegmentedSurvival({
  days,
  groups,
  overall,
}: {
  days: number[]
  groups: { group: string; survival: number[]; n: number }[]
  overall: number[]
}) {
  const tx = useProjectText()
  const floor =
    Math.min(...groups.flatMap((g) => g.survival), ...overall) * 100
  const domain: [number, number] = [Math.floor(floor * 2) / 2, 100]

  const panels = groups.map((g) => ({
    key: g.group,
    label: g.group,
    hue: 'var(--series-1)',
    sublabel: `n=${formatExact(g.n)}`,
    chart: (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={days.map((d, i) => ({
            day: d,
            value: g.survival[i] * 100,
            overall: overall[i] * 100,
          }))}
          margin={{ top: 6, right: 10, left: 0, bottom: 2 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, 720]}
            ticks={[0, 360, 720]}
            {...microAxis}
          />
          <YAxis
            domain={domain}
            tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
            width={30}
            {...microAxis}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1 }}
            content={
              <ChartTooltip
                valueFormatter={(v) => formatPercent(v, 2)}
                labelFormatter={(l) => (tx("Día") + " " + (l) + "")}
              />
            }
          />
          <Line
            type="stepAfter"
            dataKey="overall"
            name={tx("Todos")}
            stroke="var(--chart-tick)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="stepAfter"
            dataKey="value"
            name={g.group}
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1, stroke: 'var(--chart-bg)' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    ),
  }))

  return <FacetGrid panels={panels} height={150} columns={2} />
}
