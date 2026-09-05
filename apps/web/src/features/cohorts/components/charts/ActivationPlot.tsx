'use client'
import { useProjectText } from '@/features/market/components/useProjectText'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Activation } from '@/features/cohorts/lib/types'

/**
 * What predicts a second purchase: logistic-regression odds ratios with 95%
 * intervals.
 *
 * Plotted on a log2 scale, which is the only scale on which this is readable. An
 * odds ratio is a multiplicative quantity: 0.5 and 2.0 are the same size of
 * effect in opposite directions, but on a linear axis 2.0 sits four times further
 * from 1.0 than 0.5 does, so halving looks like a smaller effect than doubling.
 * On log2 they are symmetric about 0 -- and the reference line at 0 is "no
 * effect", which is what the intervals are being read against.
 *
 * Colour marks direction *and significance together*: an interval crossing zero
 * is drawn in muted ink regardless of which side its point estimate falls on,
 * because a coefficient whose interval spans no-effect has no direction to claim.
 * The interval itself is the evidence; the colour only restates it.
 */
const LABELS: Record<string, string> = {
  first_order_value_z: 'Valor del primer pedido',
  first_order_items_z: 'Artículos en el primer pedido',
  first_order_review_z: 'Reseña del primer pedido',
  first_order_weekend: 'Primer pedido en fin de semana',
  pay_credit_card: 'Pago: tarjeta de crédito',
  pay_debit_card: 'Pago: tarjeta de débito',
  pay_voucher: 'Pago: vale',
  cat_watches_gifts: 'Categoría: relojes y regalos',
  cat_telephony: 'Categoría: telefonía',
  cat_housewares: 'Categoría: artículos del hogar',
  cat_health_beauty: 'Categoría: salud y belleza',
  cat_computers_accessories: 'Categoría: cómputo',
  cat_sports_leisure: 'Categoría: deportes y ocio',
  cat_furniture_decor: 'Categoría: muebles y decoración',
  cat_other_cat: 'Categoría: otras',
}

export const labelFor = (feature: string) => LABELS[feature] ?? feature.replace(/_/g, ' ')

/** True when the 95% interval does not span "no effect". */
export const isConclusive = (f: Activation['features'][number]) =>
  f.significant && f.ci_lower !== null && (f.log2_odds > 0 ? f.ci_lower > 0 : f.ci_upper < 0)

export function ActivationPlot({ features }: { features: Activation['features'] }) {
  const tx = useProjectText()
  const data = [...features]
    .sort((a, b) => a.log2_odds - b.log2_odds)
    .map((f) => ({
      ...f,
      label: tx(labelFor(f.feature)),
      // ErrorBar wants distances from the point, not absolute bounds. An
      // unbounded lower CI collapses to zero length rather than drawing an arm
      // off the canvas -- the same cells the pipeline already refuses to ship.
      error: [
        f.ci_lower === null ? 0 : Math.max(0, f.log2_odds - f.ci_lower),
        Math.max(0, f.ci_upper - f.log2_odds),
      ] as [number, number],
      fill: !isConclusive(f)
        ? 'var(--chart-tick)'
        : f.log2_odds > 0
          ? 'var(--series-3)'
          : 'var(--series-5)',
    }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 28, left: 8, bottom: 20 }}>
        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
        <XAxis
          type="number"
          {...{
            stroke: 'var(--chart-grid)',
            tick: { fill: 'var(--chart-tick)', fontSize: 11 },
            tickLine: false,
          }}
          label={{
            value: tx("log₂(odds ratio) — a la derecha, mayor probabilidad de recompra"),
            position: 'insideBottom',
            offset: -12,
            fill: 'var(--chart-tick)',
            fontSize: 11,
          }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={186}
          stroke="var(--chart-grid)"
          tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const f = payload[0].payload as (typeof data)[number]
            return (
              <div
                className="border border-border rounded-sm px-3 py-2 shadow-sm"
                style={{ background: 'var(--chart-bg)' }}
              >
                <p className="font-sans text-xs text-muted mb-1">{f.label}</p>
                <p className="font-sans text-sm text-[var(--chart-label)] tabular-nums">
                  OR <strong>{f.odds_ratio.toFixed(2)}</strong>
                  {f.ci_lower !== null && (
                    <span className="text-muted">
                      {' '}
                      {tx("· IC95 [")}{(2 ** f.ci_lower).toFixed(2)}, {(2 ** f.ci_upper).toFixed(2)}]
                    </span>
                  )}
                </p>
                <p className="font-sans text-xs text-muted mt-0.5 tabular-nums">
                  p = {f.p_value < 0.001 ? '< 0.001' : f.p_value.toFixed(3)}
                  {!isConclusive(f) && ' · no concluyente'}
                </p>
              </div>
            )
          }}
        />
        <ReferenceLine x={0} stroke="var(--chart-label)" strokeWidth={1} />
        <Bar dataKey="log2_odds" name="log2(OR)" barSize={13} radius={2}>
          {data.map((d) => (
            <Cell key={d.feature} fill={d.fill} />
          ))}
          <ErrorBar dataKey="error" width={4} strokeWidth={1.5} stroke="var(--chart-tick)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
