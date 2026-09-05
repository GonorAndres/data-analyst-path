import { test, expect } from './fixtures'

for (const locale of ['en', 'es']) {
  for (const width of [390, 768, 1440]) {
    test(`welcoming landing in ${locale} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(locale => localStorage.setItem('analyst-locale', locale), locale)
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toContainText(locale === 'en' ? 'Behind every number' : 'Detrás de cada número')
      await expect(page.locator('.reading-welcome-steps li')).toHaveCount(3)
      const illustration = page.locator('.welcome-art img')
      await expect(illustration).toHaveAttribute('alt', /.+/)
      await expect.poll(() => illustration.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      await page.locator('.welcome-actions a[href="#how-to-read"]').click()
      await expect(page).toHaveURL(/#how-to-read$/)
      await expect(page.locator('#reading-welcome-title')).toBeInViewport()
      await page.locator('.welcome-actions a[href="#case-studies"]').click()
      await expect(page).toHaveURL(/#case-studies$/)
      await expect(page.locator('#case-studies-title')).toBeInViewport()
      await expect(page.locator('.case-card')).toHaveCount(7)
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    })
  }
}
