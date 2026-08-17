#!/usr/bin/env node
/**
 * Builds the six Next.js dashboards as static exports and merges them into a
 * single `dist/` tree for one Cloudflare Pages project.
 *
 * The apps already namespace themselves -- project 01's content lives at
 * `src/app/insurance/`, 03's at `src/app/abtest/`, and so on -- so each one's
 * `out/` can be merged without a `basePath`. Project 00 owns the root: its `/`
 * is the portfolio landing page and its `404.html` is the site's.
 *
 * The merge is where this could go wrong silently. Two apps can emit a file at
 * the same path; if the contents differ, one overwrites the other and that app
 * breaks at runtime with no build error. Webpack's content-hashed chunk names
 * should make it impossible, but "should" is not a guarantee to hang six
 * dashboards on, so every collision with differing content is a hard failure
 * unless it is a root file project 00 is expected to win.
 *
 * Usage:
 *   node scripts/build-hub.mjs             # install, build, merge
 *   node scripts/build-hub.mjs --no-install # reuse existing node_modules
 *   node scripts/build-hub.mjs --prune      # drop node_modules after each build
 *   node scripts/build-hub.mjs --merge-only # re-merge existing out/ dirs
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(REPO, 'dist')

// Order matters only for reporting; the collision check is order-independent.
// Project 00 is last so its root files land after everyone else's have been
// considered, which keeps the "project 00 wins the root" rule a single branch.
const APPS = [
  { dir: '01-insurance-claims-dashboard', slug: 'insurance' },
  { dir: '03-ab-test-analysis', slug: 'abtest' },
  { dir: '04-executive-kpi-report', slug: 'kpi' },
  { dir: '05-financial-portfolio-tracker', slug: 'portfolio' },
  { dir: '06-operational-efficiency', slug: 'operations' },
  { dir: '00-demo-aestehtics', slug: null }, // owns `/`
]

// Files every Next build emits at the root of `out/`. They legitimately differ
// between apps and there can only be one of each on a shared origin, so project
// 00 -- the app that owns `/` -- provides them.
const ROOT_OWNED = new Set(['index.html', 'index.txt', '404.html', '404/index.html'])

const args = new Set(process.argv.slice(2))
const doInstall = !args.has('--no-install') && !args.has('--merge-only')
const doBuild = !args.has('--merge-only')
const doPrune = args.has('--prune')

const log = (msg) => console.log(msg)
const run = (cmd, cmdArgs, cwd) =>
  execFileSync(cmd, cmdArgs, { cwd, stdio: 'inherit', env: buildEnv() })

/**
 * The dashboards fall back to a relative `/api/<svc>` base when
 * NEXT_PUBLIC_*_API_URL is unset, and that relative path is exactly what the
 * Pages Function serves. An inherited value from a shell or a CI environment
 * would bake an absolute Cloud Run URL into the bundle and bypass the proxy, so
 * these are stripped rather than trusted.
 *
 * NODE_ENV is deliberately left alone. `next build` sets it to 'production'
 * itself, which is what flips next.config.js to the static-export shape --
 * whereas setting it here would also reach `npm ci`, and npm reads it as
 * "skip devDependencies", leaving the build without tailwind or typescript.
 */
function buildEnv() {
  const env = { ...process.env }
  for (const key of Object.keys(env)) {
    if (key.startsWith('NEXT_PUBLIC_') && key.endsWith('_API_URL')) delete env[key]
  }
  delete env.NEXT_PUBLIC_API_URL // project 05 uses the unprefixed name
  return env
}

const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex')

/** Every file under `dir`, as paths relative to `dir`. */
function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, base, out)
    else out.push(path.relative(base, full))
  }
  return out
}

// ---------------------------------------------------------------- build

if (doBuild) {
  for (const app of APPS) {
    const cwd = path.join(REPO, 'projects', app.dir)
    log(`\n=== building ${app.dir} ===`)
    if (doInstall) run('npm', ['ci', '--no-audit', '--no-fund'], cwd)
    run('npm', ['run', 'build'], cwd)
    if (!fs.existsSync(path.join(cwd, 'out'))) {
      throw new Error(`${app.dir}: no out/ produced -- is output:'export' active?`)
    }
    if (doPrune) fs.rmSync(path.join(cwd, 'node_modules'), { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------- merge

log('\n=== merging into dist/ ===')
fs.rmSync(DIST, { recursive: true, force: true })
fs.mkdirSync(DIST, { recursive: true })

const owner = new Map() // relative path -> { app, hash }
const collisions = []
let copied = 0
let deduped = 0

for (const app of APPS) {
  const out = path.join(REPO, 'projects', app.dir, 'out')
  if (!fs.existsSync(out)) throw new Error(`${app.dir}: out/ missing -- run without --merge-only`)

  for (const rel of walk(out)) {
    const src = path.join(out, rel)
    const dest = path.join(DIST, rel)
    const hash = sha(src)
    const prior = owner.get(rel)

    if (prior) {
      if (prior.hash === hash) {
        deduped++
        continue // byte-identical; the copy already in dist/ is the same file
      }
      if (ROOT_OWNED.has(rel)) {
        // Project 00 owns the root. It is built last, so it overwrites here.
        if (app.slug !== null) continue
      } else {
        collisions.push({ rel, first: prior.app, second: app.dir })
        continue
      }
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    owner.set(rel, { app: app.dir, hash })
    copied++
  }

  const label = app.slug === null ? '/ (root)' : `/${app.slug}`
  log(`  ${app.dir.padEnd(34)} -> ${label}`)
}

if (collisions.length) {
  console.error(`\nFAIL: ${collisions.length} path(s) emitted by two apps with different content.`)
  console.error('A shared origin can only serve one of each, so one dashboard would break.\n')
  for (const c of collisions.slice(0, 20)) {
    console.error(`  ${c.rel}\n    claimed by ${c.first}, then by ${c.second}`)
  }
  if (collisions.length > 20) console.error(`  ... and ${collisions.length - 20} more`)
  console.error('\nFix: namespace the asset under the owning app (public/<slug>/...),')
  console.error('or give the apps distinct assetPrefix values.')
  process.exit(1)
}

// ---------------------------------------------------------------- routing

/**
 * Without this file, every request to the site invokes the Functions runtime --
 * including each hashed JS chunk, font and JSON file, none of which any Function
 * has an opinion about. Adding `_middleware.ts` made that concrete: it runs on
 * literally every asset request purely to compare a hostname.
 *
 * `exclude` wins over `include`, so the listed prefixes are served straight from
 * static assets and never reach a Function. `/api/*` and `/ingest/*` are not
 * excluded and keep working.
 *
 * The tradeoff is deliberate: a request for an excluded asset on the
 * `pages.dev` hostname will not be redirected to the canonical domain. That only
 * matters for someone deep-linking an asset, and every HTML route -- the ones
 * that get indexed and shared -- still redirects.
 */
const routes = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/_next/*',
    '/data/*',
    '/cohorts/data/*',
    '/favicon.svg',
    '/insurance/favicon.svg',
    '/abtest/favicon.svg',
    '/kpi/favicon.svg',
    '/portfolio/favicon.svg',
    '/operations/favicon.svg',
    '/cohorts/favicon.svg',
    '/abtest/notebooks_html/*',
    '/kpi/notebooks_html/*',
    '/portfolio/notebooks_html/*',
    '/operations/notebooks_html/*',
    '/cohorts/notebooks_html/*',
  ],
}
fs.writeFileSync(path.join(DIST, '_routes.json'), JSON.stringify(routes, null, 2))
log(`\n_routes.json: ${routes.exclude.length} static prefixes bypass the Functions runtime`)

log(`\nOK: ${copied} files, ${deduped} identical duplicates skipped, 0 collisions.`)
log(`dist/ ready at ${DIST}`)
