import { test, expect } from './fixtures'

const dashboards = [
  { path: '/insurance/', title: /Insurance|Reserves/i },
  { path: '/cohorts/', title: /Customer Retention/i },
  { path: '/abtest/', title: /A\/B Test Lab/i },
  { path: '/kpi/', title: /Executive KPI Report/i },
  { path: '/portfolio/', title: /Portfolio/i },
  { path: '/operations/', title: /Operations|Operaciones/i },
  { path: '/airbnb/', title: /Airbnb CDMX/i },
  { path: '/olist/', title: /Olist/i },
]

test.describe('Unified portfolio — deploy gate', () => {
  test('landing is the portfolio index and links to every analysis', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.case-card')).toHaveCount(7)
    for (const { path } of dashboards) await expect(page.locator(`main a[href="${path}"]`).first()).toBeVisible()
  })

  for (const { path, title } of dashboards) {
    test(`${path} serves its own analysis`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(title)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.site-header')).toHaveCount(1)
    })
  }

  test('each dashboard retains its namespaced favicon', async ({ page }) => {
    for (const slug of ['insurance', 'abtest', 'kpi', 'portfolio', 'operations', 'cohorts']) {
      await page.goto('/' + slug + '/')
      await expect(page.locator(`link[rel="icon"][href="/${slug}/favicon.svg"]`)).toHaveCount(1)
    }
  })

  test('cohorts renders figures from its bundled JSON', async ({ page }) => {
    await page.goto('/cohorts/')
    await expect(page.getByText('93,358', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('cohort subpages and notebook artifacts are exported', async ({ page, request }) => {
    for (const sub of ['retencion', 'segmentos', 'geografia', 'metodologia', 'notebooks']) {
      const response = await page.goto(`/cohorts/${sub}/`)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
    const notebook = await request.get('/cohorts/notebooks_html/01_data_ingestion_cleaning.html')
    expect(notebook.status()).toBe(200)
    expect(notebook.headers()['content-type']).toContain('text/html')
  })

  test('analytics initializes once and updates project attribution on client navigation', async ({ page }) => {
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => (window as any).posthog?._i?.length)).toBe(1)
    for (const [path, id] of [['/insurance/', 'insurance-claims'], ['/kpi/', 'executive-kpi-report'], ['/cohorts/', 'ecommerce-cohorts']]) {
      await page.getByRole('button', { name: 'Projects', exact: true }).click()
      await page.locator(`#project-menu a[href="${path}"]`).click()
      await expect.poll(() => page.evaluate(() => {
        const queue = (window as any).posthog as any[]
        return [...queue].reverse().find(item => item[0] === 'register')?.[1]?.app_id
      })).toBe(id)
      expect(await page.evaluate(() => (window as any).posthog._i.length)).toBe(1)
    }
    expect(await page.evaluate(() => (window as any).posthog._i[0][1].api_host)).toBe('/ingest')
  })

  test('canonical URLs and preview routing remain valid', async ({ request, baseURL, page }) => {
    await page.goto('/cohorts/segmentos/')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://data-analyst.gonor.me/cohorts/segmentos/')
    const origin = baseURL ?? 'http://127.0.0.1:4173'
    const apex = await request.get(origin + '/cohorts/segmentos/?x=1', {
      headers: { Host: 'data-analyst-hub.pages.dev' }, maxRedirects: 0,
    })
    expect(apex.status()).toBe(301)
    expect(apex.headers()['location']).toBe('https://data-analyst.gonor.me/cohorts/segmentos/?x=1')
    for (const host of ['dev.data-analyst-hub.pages.dev', 'data-analyst.gonor.me']) {
      const result = await request.get(origin + '/health', { headers: { Host: host }, maxRedirects: 0 })
      expect(result.status()).toBe(200)
    }
  })
})
