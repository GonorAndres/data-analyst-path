import { test as base, expect } from '@playwright/test'

/** Deliberately unavailable APIs are deterministic; tests opt into real schemas. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/**', route => route.fulfill({
      status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Fixture: service unavailable' }),
    }))
    await page.route('**/ingest/**', route => route.fulfill({
      status: 200, contentType: 'application/javascript', body: '/* analytics transport disabled in tests */',
    }))
    await use(page)
  },
})
export { expect }
