import { test, expect } from './fixtures'

const routes = ['insurance', 'cohorts', 'olist', 'abtest', 'kpi', 'portfolio', 'operations', 'airbnb']

test('short data context keeps technical details in methods', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('analyst-locale', 'es'))
  await page.goto('/abtest/')
  await expect(page.locator('.case-story .case-provenance')).toHaveText('Datos simulados para practicar pruebas A/B')
  await expect(page.locator('.case-story .case-provenance')).not.toContainText('enriquecimiento')
  await expect(page.locator('.case-welcome-art figcaption')).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Vistas del caso de estudio' }).getByRole('button', { name: 'Métodos y fuentes' }).click()
  await expect(page.locator('.case-methods .case-provenance')).toContainText('enriquecimiento reproducible modifica conversiones')
})

for (const locale of ['en', 'es']) {
  for (const width of [390, 1440]) {
    test(`illustrated case introductions in ${locale} at ${width}px`, async ({ page }) => {
      test.setTimeout(60_000)
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(locale => {
        localStorage.setItem('analyst-locale', locale)
        localStorage.setItem('analyst-theme', locale === 'es' ? 'dark' : 'light')
      }, locale)
      for (const route of routes) {
        await page.goto(`/${route}/`)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.locator('.case-welcome')).toHaveCount(1)
        await expect(page.locator('#case-welcome-title')).toBeVisible()
        const image = page.locator('.case-welcome-art img')
        const artwork = route === 'cohorts' ? 'ecommerce' : route
        await expect(image).toHaveAttribute('src', `/images/cases/${artwork}-v2-1200.webp`)
        await expect(image).toHaveAttribute('alt', /.+/)
        await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await page.locator('.case-welcome a').click()
        await expect(page).toHaveURL(/#case-analysis$/)
        await expect(page.locator('#case-analysis h1')).toBeInViewport()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await expect(page.locator('.reading-section')).toHaveCount(3)
      }
    })
  }
}

test('introductions do not displace exploration, methods, or deep links', async ({ page }) => {
  for (const path of ['/insurance/?view=explore', '/insurance/?view=methods', '/cohorts/retencion/']) {
    await page.goto(path)
    await expect(page.locator('.case-welcome')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await page.goto('/insurance/#case-analysis')
  await expect(page.locator('#case-analysis h1')).toBeInViewport()
})
