import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'

const overview = {
  health_score: 75, health_status: 'green', commentary: 'Fixture commentary',
  period: { start: '2024-01', end: '2025-12' }, last_month: '2025-12',
  kpis: [
    { id: 'nrr', name: 'NRR', value: 1.1, formatted: '110.0%', category: 'revenue' },
    { id: 'logo_churn_rate', name: 'Logo Churn', value: 0.02, formatted: '2.0%', category: 'customers' },
    { id: 'dau_mau_ratio', name: 'DAU/MAU', value: 0.25, formatted: '25.0%', category: 'engagement' },
    { id: 'payback_months', name: 'Payback Period', value: 12, formatted: '12.0 mo', category: 'efficiency' },
  ].map(metric => ({ ...metric, change_mom: 0.05, change_yoy: 0.12, traffic_light: 'green', target: null, sparkline: [0.9, 1, 1.1] })),
}

async function mockKpi(page: Page, requests: string[] = []) {
  await page.route('**/api/kpi/api/v1/filters*', route => route.fulfill({
    json: { segments: ['Enterprise'], months: ['2024-01', '2025-12'] },
  }))
  await page.route('**/api/kpi/api/v1/overview*', route => {
    requests.push(route.request().url())
    return route.fulfill({ json: overview })
  })
}

test('KPI renders backend categories, exact percentage units and selected comparison', async ({ page }) => {
  await mockKpi(page)
  await page.goto('/kpi/?section=overview')
  await expect(page.getByText('Logo Churn', { exact: true })).toBeVisible()
  await expect(page.getByText('DAU/MAU', { exact: true })).toBeVisible()
  await expect(page.getByText('CAC Payback', { exact: true })).toBeVisible()
  // Wait for the existing health gauge animation; formatted KPI values must stay exact.
  await expect(page.getByText('75', { exact: true })).toBeVisible()
  await expect(page.getByText('110.0%', { exact: true })).toBeVisible()
  await expect(page.getByText('2.0%', { exact: true })).toBeVisible()
  await expect(page.getByText('25.0%', { exact: true })).toBeVisible()
  await expect(page.getByText('+5.0%', { exact: false })).toHaveCount(4)
  await page.getByRole('combobox', { name: 'Compare', exact: true }).selectOption('yoy')
  await expect(page.getByText('+12.0%', { exact: false })).toHaveCount(4)
  await expect(page.getByText('+5.0%', { exact: false })).toHaveCount(0)
})

test('KPI shared language changes request language and survives refresh', async ({ page }) => {
  const requests: string[] = []
  await mockKpi(page, requests)
  await page.goto('/kpi/?section=overview')
  await expect(page.getByText('110.0%', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to Spanish' }).click()
  await expect.poll(() => requests.some(url => new URL(url).searchParams.get('lang') === 'es')).toBeTruthy()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect.poll(() => new URL(requests.at(-1)!).searchParams.get('lang')).toBe('es')
})

test('KPI PDF uses the requested language, reports JSON failures and downloads PDF responses', async ({ page }) => {
  await mockKpi(page)
  let success = false
  let reportUrl = ''
  const downloads: string[] = []
  page.on('download', download => downloads.push(download.suggestedFilename()))
  await page.route('**/api/kpi/api/v1/report/generate*', route => {
    reportUrl = route.request().url()
    return route.fulfill(success
      ? { status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n% deterministic download fixture\n%%EOF' }
      : { status: 200, json: { error: 'No data available for report generation.' } })
  })
  await page.goto('/kpi/?section=report')
  await page.getByRole('button', { name: 'Switch to Spanish' }).click()
  const generate = page.getByRole('button', { name: 'Generar y Descargar PDF', exact: true })
  await generate.click()
  const errorMessage = page.getByRole('alert').filter({ hasText: 'No se pudo generar el informe' })
  await expect(errorMessage).toBeVisible()
  expect(new URL(reportUrl).searchParams.get('lang')).toBe('es')
  expect(new URL(reportUrl).searchParams.has('language')).toBe(false)
  expect(downloads).toEqual([])
  success = true
  const downloadPromise = page.waitForEvent('download')
  await generate.click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^kpi-report-\d{4}-\d{2}-\d{2}\.pdf$/)
  await expect(errorMessage).toHaveCount(0)
})

test('A/B and KPI HTTP-200 empty payloads render empty states without exceptions', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/**', route => route.fulfill({ json: { error: 'No data matches the selected filters.' } }))
  for (const [project, sections] of [
    ['abtest', ['overview', 'frequentist', 'bayesian', 'segments', 'sequential']],
    ['kpi', ['overview', 'revenue', 'customers', 'forecast', 'anomalies']],
  ] as const) {
    for (const section of sections) {
      await page.goto(`/${project}/?section=${section}`)
      await expect(page.getByRole('status')).toContainText('No data matches these filters.')
    }
  }
  expect(errors).toEqual([])
})

test('A/B power controls keep keyboard focus while recalculating', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/abtest/api/v1/power*', async route => {
    if (new URL(route.request().url()).searchParams.get('baseline_rate') === '0.13') await pending
    await route.fulfill({ json: {
      required_sample_size_per_group: 2000, current_sample_size: { min: 3000 }, is_adequate: true,
      runtime_estimate_days: 0, actual_mde: 0.008,
      power_curve: [{ effect_size: 0.005, power: 0.5 }, { effect_size: 0.01, power: 0.9 }],
      mde_curve: [{ effect_size: 0.005, required_n: 8000 }, { effect_size: 0.01, required_n: 2000 }],
    } })
  })
  await page.goto('/abtest/?section=power')
  await expect(page.getByRole('heading', { name: 'Power Curve', exact: true })).toBeVisible()
  const slider = page.getByRole('slider', { name: 'Baseline Rate', exact: true })
  await slider.focus()
  try {
    const request = page.waitForRequest(req => req.url().includes('/power?baseline_rate=0.13'))
    await slider.press('ArrowRight')
    await request
    await expect(slider).toBeFocused()
    await expect(slider).toHaveValue('0.13')
    await expect(page.getByRole('status')).toContainText('Loading analysis')
  } finally {
    release()
  }
  await expect(page.getByRole('heading', { name: 'Power Curve', exact: true })).toBeVisible()
  await expect(slider).toBeFocused()
})

test('A/B confidence chart exposes interval bounds rather than only a midpoint', async ({ page }) => {
  await page.route('**/api/abtest/api/v1/frequentist*', route => route.fulfill({ json: {
    wilson_ci_control: [0.1, 0.12], wilson_ci_treatment: [0.12, 0.14],
    cohens_h: { interpretation: 'small', effect_size: 0.04 }, z_test: { p_value: 0.08 },
    chi_squared: { chi2: 0.4, p_value: 0.08, cramers_v: 0.04 },
    metrics_table: [], contingency_table: [],
  } }))
  await page.goto('/abtest/?section=frequentist')
  await expect(page.getByRole('heading', { name: 'Confidence Intervals', exact: true })).toBeVisible()
  await page.locator('.recharts-bar-rectangle').first().hover()
  await expect(page.getByText('10.000% — 12.000%', { exact: true })).toBeVisible()
})
