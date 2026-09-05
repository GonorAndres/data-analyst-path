/** Capture the locally built case stories; never request production analytics or APIs. */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'apps/web/package.json'))
const { chromium } = require('playwright')
const origin = process.env.PRESENTATION_ORIGIN || 'http://127.0.0.1:4174'
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local preview origin.')
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
})
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.route('**/ingest/**', route => route.fulfill({ body: '{}', contentType: 'application/json' }))
  await page.route('**/api/**', route => route.fulfill({ status: 503, body: '{"error":"Offline visual review"}', contentType: 'application/json' }))
  const directory = path.join(root, 'screenshots-live')
  fs.mkdirSync(directory, { recursive: true })
  for (const slug of ['home', 'insurance', 'olist', 'cohorts', 'abtest', 'kpi', 'portfolio', 'operations', 'airbnb']) {
    await page.goto(`${origin}/${slug === 'home' ? '' : `${slug}/`}`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(directory, `2026-09-${slug}.png`), animations: 'disabled' })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${origin}/insurance/`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(directory, '2026-09-insurance-mobile.png'), fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click()
  await page.screenshot({ path: path.join(directory, '2026-09-insurance-dark.png'), animations: 'disabled' })
  console.log('Captured nine local case/home views, mobile insurance, and dark insurance.')
} finally {
  await browser.close()
}
