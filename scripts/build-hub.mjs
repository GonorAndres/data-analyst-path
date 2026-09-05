#!/usr/bin/env node
/**
 * Build one Next.js static application and package it for Cloudflare Pages.
 * No frontend exports are merged. Research assets are staged by web's prebuild.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WEB = path.join(ROOT, 'apps/web')
const DIST = path.join(ROOT, 'dist')
const OUTPUT = path.join(WEB, 'out')
const args = new Set(process.argv.slice(2))

if ([...args].some(arg => arg !== '--no-install')) {
  throw new Error('Supported option: --no-install. Multi-app merge/prune modes have been retired.')
}
if (!args.has('--no-install')) execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: WEB, stdio: 'inherit' })
execFileSync('npm', ['run', 'build'], { cwd: WEB, stdio: 'inherit' })
if (!fs.existsSync(path.join(OUTPUT, 'index.html'))) throw new Error('Unified frontend did not produce index.html')

// dist is exclusively a generated build artifact; only replace it after success.
fs.rmSync(DIST, { recursive: true, force: true })
fs.cpSync(OUTPUT, DIST, { recursive: true })
let count = 0
function canonicalize(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { canonicalize(file); continue }
    if (!entry.name.endsWith('.html')) continue
    const relative = path.relative(DIST, file).replaceAll(path.sep, '/')
    if (relative === '404.html' || relative === '404/index.html' || relative.includes('/notebooks_html/')) continue
    let html = fs.readFileSync(file, 'utf8')
    if (html.includes('rel="canonical"')) continue
    const route = relative === 'index.html' ? '/' : relative.endsWith('/index.html') ? '/' + relative.slice(0, -10) : '/' + relative
    html = html.replace('</head>', '<link rel="canonical" href="https://data-analyst.gonor.me' + route + '"/></head>')
    fs.writeFileSync(file, html)
    count++
  }
}
canonicalize(DIST)
console.log('Unified frontend ready in dist/; ' + count + ' canonical routes.')
