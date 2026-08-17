#!/usr/bin/env node
/**
 * Replaces each retired Vercel dashboard with a redirect to its path on the hub.
 *
 * Each deployment contains two files -- a vercel.json and an index.html -- and no
 * build step. The redirects are evaluated at Vercel's edge, so they work without
 * a server; the HTML only exists as a fallback for anything the rules miss, and
 * as something legible if someone views source.
 *
 * Usage:
 *   node ops/vercel-redirects/deploy.mjs          # deploy every project
 *   node ops/vercel-redirects/deploy.mjs --dry    # print what would be deployed
 *   node ops/vercel-redirects/deploy.mjs insurance-claims-dashboard
 *
 * Requires the Vercel CLI to be authenticated (`vercel login`).
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'redirects.json'), 'utf8'))

const args = process.argv.slice(2)
const dryRun = args.includes('--dry')
const only = args.filter((a) => !a.startsWith('--'))

const targets = only.length
  ? manifest.projects.filter((p) => only.includes(p.name))
  : manifest.projects

if (targets.length === 0) {
  console.error(`No project matched. Known: ${manifest.projects.map((p) => p.name).join(', ')}`)
  process.exit(1)
}

/**
 * Two rules, and the order matters -- Vercel takes the first match.
 *
 * The first preserves deep links that already sit under the dashboard's own
 * prefix, so `/abtest/notebooks` lands on `/abtest/notebooks` rather than the
 * dashboard root. The second is the catch-all, including `/`, which on these
 * sites used to redirect into the prefix anyway.
 */
function rulesFor(dashPath, canonical) {
  if (dashPath === '/') {
    return [
      { source: '/', destination: canonical, permanent: true },
      { source: '/:path+', destination: `${canonical}/:path+`, permanent: true },
    ]
  }
  // Order matters -- Vercel takes the first match -- and each case is spelled
  // out rather than leaning on `/:path*` to cover them. A first attempt used
  // only `/:path*` plus a prefix rule: `/` fell through to the fallback HTML and
  // served 200, and `/insurance/` with its trailing slash matched nothing and
  // 404'd. `:path+` requires at least one segment, which keeps the deep-link
  // rule from swallowing the bare and trailing-slash forms.
  return [
    { source: '/', destination: `${canonical}${dashPath}`, permanent: true },
    { source: dashPath, destination: `${canonical}${dashPath}`, permanent: true },
    { source: `${dashPath}/`, destination: `${canonical}${dashPath}`, permanent: true },
    {
      source: `${dashPath}/:path+`,
      destination: `${canonical}${dashPath}/:path+`,
      permanent: true,
    },
    { source: '/:path*', destination: `${canonical}${dashPath}`, permanent: true },
  ]
}

const html = (target) => `<!doctype html>
<meta charset="utf-8">
<title>Se mudó a data-analyst.gonor.me</title>
<link rel="canonical" href="${target}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace("${target}")</script>
<p>Este tablero ahora vive en <a href="${target}">${target}</a>.</p>
`

for (const project of targets) {
  const target = manifest.canonical + (project.path === '/' ? '' : project.path)
  const redirects = rulesFor(project.path, manifest.canonical)

  console.log(`\n=== ${project.name} -> ${target}`)
  for (const r of redirects) console.log(`    ${r.source}  ->  ${r.destination}`)
  if (dryRun) continue

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `vr-${project.name}-`))
  fs.writeFileSync(
    path.join(dir, 'vercel.json'),
    JSON.stringify(
      {
        // Each project still carries a Next.js framework preset from when it
        // served a dashboard, and Vercel honours that over the contents of the
        // deployment -- it looks for a package.json with `next` and fails the
        // build. Null resets it to a plain static deployment, which is all a
        // redirect needs.
        framework: null,
        buildCommand: null,
        installCommand: null,
        outputDirectory: '.',
        redirects,
      },
      null,
      2,
    ),
  )
  fs.writeFileSync(path.join(dir, 'index.html'), html(target))
  fs.mkdirSync(path.join(dir, '.vercel'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.vercel', 'project.json'),
    JSON.stringify({ projectId: project.projectId, orgId: manifest.orgId }),
  )

  try {
    const out = execFileSync('vercel', ['deploy', '--prod', '--yes'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const url = out.trim().split('\n').filter(Boolean).pop()
    console.log(`    deployed: ${url}`)
  } catch (err) {
    console.error(`    FAILED: ${err.stderr || err.message}`)
    process.exitCode = 1
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
