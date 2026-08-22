'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { FacetGrid } from '@/components/charts/Facets'
import { formatCurrency, formatExact, formatPercent } from '@/lib/format'
import type { Segments } from '@/lib/types'

const axis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 11 },
  tickLine: false,
}

/** Stripped-down axes for facet panels, where the shared scale is stated once in
 *  the card subtitle rather than repeated seven times. */
const microAxis = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-tick)', fontSize: 9 },
  tickLine: false,
}

/**
 * The seven RFM segments assigned a fixed hue each, in the palette's own order.
 *
 * Keyed by segment name rather than by position, so a filter that hides three
 * segments leaves the remaining four the colour they already were. Colour follows
 * the entity, never its rank in the current view.
 *
 * Only ever one of these appears per chart or per facet panel -- see the note in
 * Facets.tsx for why seven at once is not something colour can carry.
 */
export const SEGMENT_HUES: Record<string, string> = {
  'Alto Valor': 'var(--series-1)',
  Leales: 'var(--series-2)',
  'Potencial Leal': 'var(--series-3)',
  'En Riesgo': 'var(--series-4)',
  Inactivos: 'var(--series-5)',
  Perdidos: 'var(--series-6)',
  Otros: 'var(--series-7)',
}

export const hueFor = (segment: string) => SEGMENT_HUES[segment] ?? 'var(--chart-tick)'

/**
 * Segment sizes, horizontal because the labels are words, not dates.
 *
 * One hue. The segment names are on the y-axis, so colour here would restate what
 * the axis already says -- and seven hues that a reader might compare is the
 * exact case the palette cannot support. The largest bar is darkened rather than
 * hue-shifted, so rank never repaints identity.
 */
export function SegmentDistribution({
  data,
}: {
  data: { segment: string; customers: number }[]
}) {
  const sorted = [...data].sort((a, b) => a.customers - b.customers)
  const max = Math.max(...sorted.map((d) => d.customers), 0)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatExact(Number(v))} {...axis} />
        <YAxis type="category" dataKey="segment" width={112} {...axis} />
        <Tooltip
          cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }}
          content={<ChartTooltip valueFormatter={(v) => `${formatExact(v)} clientes`} />}
        />
        <Bar dataKey="customers" name="Clientes" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {sorted.map((d) => (
            <Cell
              key={d.segment}
              fill="var(--series-1)"
              fillOpacity={d.customers === max ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * The RFM map, as one small panel per segment on shared axes.
 *
 * Binned, not raw: the underlying scatter is 93,358 customers, which at that
 * density is a solid cloud that answers no question. Cells are 30-day recency
 * buckets by integer order count, with the mark area proportional to how many
 * customers fall in each.
 *
 * Faceted rather than overlaid because RFM segments are *defined* by cuts on
 * these very axes, so each one occupies its own region -- overlaying them buries
 * that structure under seven translucent layers, while the panels make it the
 * first thing visible.
 */
export function RfmMap({ data }: { data: Segments['scatter'] }) {
  const bySegment = new Map<string, Segments['scatter']>()
  for (const d of data) {
    const arr = bySegment.get(d.segment) ?? []
    arr.push(d)
    bySegment.set(d.segment, arr)
  }

  // Shared domains, computed over every panel's data. Per-panel autoscaling would
  // make the small multiples compare nothing.
  const maxRecency = Math.max(...data.map((d) => d.recency), 0)
  const maxFreq = Math.max(...data.map((d) => d.frequency), 0)
  const maxCount = Math.max(...data.map((d) => d.count), 0)

  const panels = Array.from(bySegment.entries())
    .sort((a, b) => b[1].reduce((s, d) => s + d.count, 0) - a[1].reduce((s, d) => s + d.count, 0))
    .map(([segment, points]) => ({
      key: segment,
      label: segment,
      hue: hueFor(segment),
      sublabel: formatExact(points.reduce((s, d) => s + d.count, 0)),
      chart: (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 6, right: 10, left: 0, bottom: 2 }}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis
              type="number"
              dataKey="recency"
              domain={[0, maxRecency]}
              ticks={[0, Math.round(maxRecency / 2), maxRecency]}
              {...microAxis}
            />
            <YAxis
              type="number"
              dataKey="frequency"
              domain={[0, maxFreq]}
              ticks={[1, 3, 5]}
              width={18}
              {...microAxis}
            />
            <ZAxis type="number" dataKey="count" domain={[0, maxCount]} range={[8, 300]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--chart-tick)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as Segments['scatter'][number]
                return (
                  <div
                    className="border border-border dark:border-[#2a2a2a] rounded-sm px-3 py-2 shadow-sm"
                    style={{ background: 'var(--chart-bg)' }}
                  >
                    <p className="font-sans text-xs text-muted mb-1">{p.segment}</p>
                    <p className="font-sans text-sm text-[var(--chart-label)] tabular-nums">
                      {formatExact(p.count)} clientes
                    </p>
                    <p className="font-sans text-xs text-muted tabular-nums">
                      {p.recency}–{p.recency + 29} días · {p.frequency}
                      {p.frequency >= 5 ? '+' : ''} pedido{p.frequency > 1 ? 's' : ''} ·{' '}
                      {formatCurrency(p.avg_revenue)} medio
                    </p>
                  </div>
                )
              }}
            />
            <Scatter
              data={points}
              fill={hueFor(segment)}
              fillOpacity={0.65}
              stroke="var(--chart-bg)"
              strokeWidth={1}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      ),
    }))

  return <FacetGrid panels={panels} height={132} />
}

/**
 * LTV curves as small multiples, one panel per segment on a shared y-domain.
 *
 * There is deliberately no average line across segments. An earlier version drew
 * one and it came out visibly jagged, which turned out to be an artefact rather
 * than a signal: the number of segments with any data swings from seven at month
 * 0 to one at month 16, so a mean "across segments present" jumps every time
 * membership changes. A reference line that moves because its own denominator
 * moved is worse than no reference line.
 *
 * The sparsity is itself the finding, and the caller states it. A segment's
 * cumulative revenue can only change in a month where someone in it ordered
 * again, so the two largest segments -- 62,000 customers between them, nearly all
 * of them single-purchase -- have a curve consisting of one point. Panels with a
 * single observation draw it as a dot, because a one-point line renders nothing
 * and would read as missing data instead of as a flat lifetime value.
 */
export function LtvCurves({ data }: { data: Segments['ltv_curves'] }) {
  // Array.from, not a spread: tsconfig targets es5, where spreading a Set
  // needs downlevelIteration. Same reason for every Map/Set traversal here.
  const segments = Array.from(new Set(data.map((d) => d.segment)))
  const months = Array.from(new Set(data.map((d) => d.month))).sort((a, b) => a - b)
  const index = new Map(data.map((d) => [`${d.segment}|${d.month}`, d.cumulative_revenue]))

  const maxY = Math.max(...data.map((d) => d.cumulative_revenue), 0)
  const domain: [number, number] = [0, Math.ceil(maxY / 50) * 50]
  const maxMonth = months[months.length - 1] ?? 0

  const panels = segments
    .map((segment) => {
      const points = months.map((month) => ({
        month,
        value: index.get(`${segment}|${month}`) ?? null,
      }))
      const observed = points.filter((p) => p.value !== null)
      const last = observed[observed.length - 1]
      return {
        key: segment,
        label: segment,
        hue: hueFor(segment),
        sublabel: last ? formatCurrency(last.value as number) : undefined,
        peak: last?.value ?? 0,
        chart: (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 6, right: 10, left: 0, bottom: 2 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="month"
                type="number"
                domain={[0, maxMonth]}
                ticks={[0, 6, 12, 18]}
                {...microAxis}
              />
              <YAxis
                domain={domain}
                tickFormatter={(v) => formatCurrency(Number(v))}
                width={44}
                {...microAxis}
              />
              <Tooltip
                cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1 }}
                content={
                  <ChartTooltip
                    valueFormatter={(v) => formatCurrency(v)}
                    labelFormatter={(l) => `Mes ${l}`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                name={segment}
                stroke={hueFor(segment)}
                strokeWidth={2}
                // Dots always, so a segment observed in a single month is a
                // visible mark rather than an empty panel.
                // A dot only where the line cannot draw itself. A segment
                // observed in one month has no segment to stroke, so without
                // this its panel renders empty and reads as missing data rather
                // than as a lifetime value that never moved. `fill` is explicit:
                // with strokeWidth 0 and no fill the mark is invisible.
                dot={
                  observed.length === 1
                    ? { r: 3.5, fill: hueFor(segment), strokeWidth: 0 }
                    : false
                }
                activeDot={{ r: 4, strokeWidth: 1, stroke: 'var(--chart-bg)' }}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ),
      }
    })
    .sort((a, b) => b.peak - a.peak)

  return <FacetGrid panels={panels} height={132} />
}

/**
 * Revenue concentration: the Lorenz curve against the line of perfect equality.
 *
 * The gap between the two lines is the inequality, and the Gini is twice its
 * area -- so the equality line is not a decoration, it is the reference the
 * statistic is defined against and has to be on the chart. Two series, one of
 * them a gray reference, so this one stays a single chart.
 */
export function LorenzCurve({ data }: { data: Segments['lorenz'] }) {
  const points = data.population.map((p, i) => ({
    population: p * 100,
    revenue: data.revenue[i] * 100,
    equality: p * 100,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 12, right: 20, left: 4, bottom: 12 }}>
        <CartesianGrid stroke="var(--chart-grid)" />
        <XAxis
          type="number"
          dataKey="population"
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
          tickFormatter={(v) => `${v}%`}
          {...axis}
          label={{
            value: 'Clientes acumulados (de menor a mayor gasto)',
            position: 'insideBottom',
            offset: -8,
            fill: 'var(--chart-tick)',
            fontSize: 11,
          }}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
          tickFormatter={(v) => `${v}%`}
          width={48}
          {...axis}
        />
        <Tooltip
          cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1 }}
          content={
            <ChartTooltip
              valueFormatter={(v) => formatPercent(v, 1)}
              labelFormatter={(l) => `${Number(l).toFixed(0)}% de los clientes`}
              only={['revenue']}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--chart-tick)' }}
          payload={[
            { value: 'Ingresos acumulados', type: 'line', color: 'var(--series-1)' },
            { value: 'Igualdad perfecta', type: 'line', color: 'var(--chart-tick)' },
          ]}
        />
        <ReferenceLine
          x={80}
          stroke="var(--chart-tick)"
          strokeDasharray="3 3"
          label={{
            value: `20% superior = ${data.top20_share.toFixed(0)}% de los ingresos`,
            position: 'insideTopLeft',
            fill: 'var(--chart-label)',
            fontSize: 11,
          }}
        />
        <Line
          type="linear"
          dataKey="equality"
          stroke="var(--chart-tick)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          legendType="none"
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Ingresos acumulados"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={false}
          legendType="none"
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chart-bg)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
