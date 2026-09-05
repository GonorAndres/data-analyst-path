/** Reproduce the small, offline figures from retained research artifacts. */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const inputs = []
function read(relative) {
  const bytes = fs.readFileSync(path.join(root, relative))
  inputs.push({ path: relative, sha256: createHash('sha256').update(bytes).digest('hex') })
  return JSON.parse(bytes)
}
const airbnb = read('projects/00-demo-aestehtics/public/data/airbnb/kpis.json')
const areas = read('projects/00-demo-aestehtics/public/data/airbnb/neighborhood_ranking.json')
const overview = read('projects/02-ecommerce-cohort-analysis/web/public/cohorts/data/overview.json')
const meta = read('projects/02-ecommerce-cohort-analysis/web/public/cohorts/data/meta.json')
const cohorts = read('projects/02-ecommerce-cohort-analysis/web/public/cohorts/data/cohorts.json')
const insurance = read('projects/01-insurance-claims-dashboard/public/insurance/evidence/paid-development.json')
const kpi = read('projects/04-executive-kpi-report/public/kpi/evidence/revenue-bridge.json')
const bridge = kpi.bridge
if (Math.abs(bridge.starting_mrr + bridge.new + bridge.expansion - bridge.contraction - bridge.churned - bridge.ending_mrr) > 0.02) {
  throw new Error('The retained KPI revenue bridge does not reconcile.')
}
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0)
const customers = sum(overview.by_cohort, 'customers')
if (customers !== meta.customers || sum(overview.monthly, 'orders') !== meta.orders) {
  throw new Error('Cohort evidence disagrees with metadata; reconcile the source artifacts first.')
}
const result = {
  schemaVersion: 1,
  reviewedAt: '2026-09-05',
  inputs,
  kpi: { period: kpi.period, reviewedAt: kpi.reviewedAt, unit: kpi.unit, seed: kpi.seed, bridge },
  insurance: {
    capturedAt: insurance.capturedAt,
    source: '/insurance/evidence/paid-development.json',
    rows: insurance.ibnr_by_year.map(row => {
      if (row.ultimate <= 0 || row.ultimate - row.latest_value !== row.ibnr) throw new Error('Insurance snapshot reserve identity failed.')
      return { year: row.accident_year, periods: row.latest_lag, paid: row.latest_value, ultimate: row.ultimate, paidPercent: row.latest_value / row.ultimate * 100 }
    }),
  },
  ecommerce: {
    customers,
    orders: meta.orders,
    repeatCustomers: sum(overview.by_cohort, 'repeat'),
    repeatRate: sum(overview.by_cohort, 'repeat') / customers * 100,
    coverage: [meta.date_start, meta.date_end],
    // January 2018 has six fully observed subsequent months through July.
    cohort: '2018-01',
    cohortSize: cohorts.retention_counts[cohorts.cohorts.indexOf('2018-01')][0],
    returning: cohorts.retention_counts[cohorts.cohorts.indexOf('2018-01')].slice(1, 7),
  },
  airbnb: {
    listings: airbnb.total_listings,
    meanAskingPrice: airbnb.avg_price_per_night,
    currency: airbnb.currency,
    artifactUpdated: airbnb.updated,
    areas: areas.neighborhoods.slice(0, 5).map(area => ({ name: area.name, listings: area.listing_count })),
  },
}
const output = path.join(root, 'apps/web/src/lib/evidence-snapshots.json')
const serialized = JSON.stringify(result, null, 2) + '\n'
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== serialized) {
    throw new Error('Evidence snapshots are stale. Run npm run evidence:build and review the changed values.')
  }
  console.log('Evidence snapshots match their retained source artifacts.')
} else {
  fs.writeFileSync(output, serialized)
  console.log('Generated reproducible evidence snapshots.')
}
