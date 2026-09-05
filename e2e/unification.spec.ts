import { test, expect } from './fixtures'

const paths = ['/insurance/', '/olist/', '/cohorts/', '/abtest/', '/kpi/', '/portfolio/', '/operations/', '/airbnb/']

async function switchProject(page: import('@playwright/test').Page, path: string) {
  await page.getByRole('button', { name: /^(Projects|Proyectos)$/ }).click()
  await page.locator(`#project-menu a[href="${path}"]`).click()
  await expect(page).toHaveURL(new RegExp(path.replaceAll('/', '\\/')), { timeout: 15_000 })
}

test('one runtime preserves preferences between every project and after refresh', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await page.getByRole('button', { name: 'Switch to Spanish' }).click()
  await page.evaluate(() => { (window as any).__navigationMarker = 'same-runtime' })
  for (const path of paths) {
    await switchProject(page, path)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await page.evaluate(() => (window as any).__navigationMarker)).toBe('same-runtime')
    await expect(page.locator('.site-header')).toHaveCount(1)
    await expect(page.locator('.site-footer')).toHaveCount(1)
  }
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('project selector supports keyboard dismissal and returns focus', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Projects', exact: true })
  await trigger.click()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('sections survive refresh and browser back/forward', async ({ page }) => {
  await page.goto('/portfolio/?view=explore')
  await page.getByRole('button', { name: 'Risk', exact: true }).click()
  await expect(page).toHaveURL(/section=risk/)
  await page.getByRole('button', { name: 'Correlation', exact: true }).click()
  await expect(page).toHaveURL(/section=correlation/)
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Risk', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Risk', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.goForward()
  await expect(page.getByRole('button', { name: 'Correlation', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('filter caches remain isolated during cross-project SPA navigation', async ({ page }) => {
  const requested: string[] = []
  const fixtures: Record<string, unknown> = {
    insurance: { lobs: ['Insurance only'], companies: [{ grcode: 77, grname: 'Insurance company' }], years: [1988, 1997] },
    olist: { product_categories: ['Olist only'], states: ['SP'], payment_types: ['credit_card'] },
    kpi: { segments: ['KPI only'], months: ['2025-01', '2025-12'] },
    abtest: { device_types: ['AB only'], countries: ['US'], user_segments: ['new'], traffic_sources: ['direct'] },
  }
  await page.route('**/api/*/api/v1/filters*', route => {
    const service = new URL(route.request().url()).pathname.split('/')[2]
    requested.push(service)
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtures[service] ?? {}) })
  })
  await page.goto('/insurance/?view=explore')
  await expect(page.getByRole('option', { name: 'Insurance only', exact: true })).toHaveCount(1)
  await page.evaluate(() => { (window as any).__navigationMarker = true })
  for (const [path, option] of [['/olist/', 'Olist only'], ['/kpi/', 'KPI only'], ['/abtest/', 'AB only']]) {
    await switchProject(page, path)
    await page.getByRole('navigation', { name: 'Case study views' }).getByRole('button', { name: 'Explore', exact: true }).click()
    await expect(page.getByRole('option', { name: option, exact: true })).toHaveCount(1)
    await expect(page.getByRole('option', { name: 'Insurance only', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => (window as any).__navigationMarker)).toBe(true)
  }
  expect(new Set(requested)).toEqual(new Set(['insurance', 'olist', 'kpi', 'abtest']))
})

for (const width of [390, 768, 1440]) {
  test(`no page overflow across projects at ${width}px in either theme`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click()
      for (const path of paths) {
        await switchProject(page, path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), { message: `${path} overflow in ${theme}` }).toBeLessThanOrEqual(1)
      }
    }
  })
}

test('empty A/B data is displayed as empty without a render exception', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/abtest/api/v1/**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ error: 'No data matches the selected filters.' }),
  }))
  await page.goto('/abtest/?section=frequentist')
  await expect(page.getByText(/No data matches|No data available|No matching data/i).first()).toBeVisible()
  expect(errors).toEqual([])
})

test('e-commerce grouping retains both analyses and cohort deep links', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.case-card')).toHaveCount(7)
  await page.locator('.case-analyses a[href="/cohorts/"]').click()
  await expect(page.locator('.analysis-switch a')).toHaveCount(2)
  await page.getByRole('navigation', { name: 'Case study views' }).getByRole('button', { name: 'Explore', exact: true }).click()
  await page.locator('a[href="/cohorts/retencion/"]').click()
  await expect(page).toHaveURL(/\/cohorts\/retencion\//)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
