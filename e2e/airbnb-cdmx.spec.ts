import { test, expect } from './fixtures';

test.describe('Airbnb CDMX -- Deploy Gate', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('landing indexes all 7 portfolio projects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('.case-card')).toHaveCount(7);

    // Every card is now an internal route on this origin. The last holdout was
    // the Olist cohort app, which ran as Streamlit on Cloud Run and was linked by
    // its raw run.app URL; it was rebuilt as a static export at /cohorts, so the
    // portfolio no longer points anyone at infrastructure.
    const paths = [
      '/airbnb',
      '/olist',
      '/insurance',
      '/cohorts',
      '/abtest',
      '/kpi',
      '/portfolio',
      '/operations',
    ];
    for (const path of paths) {
      await expect(page.locator(`a[href^="${path}"]`).first()).toBeVisible();
    }
    // No card may point off-origin: an external href here would mean a dashboard
    // was left behind by the consolidation.
    await expect(page.locator('.case-card a[href^="http"]')).toHaveCount(0);
  });

  test('airbnb case study loads', async ({ page }) => {
    await page.goto('/airbnb');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('olist case study loads', async ({ page }) => {
    await page.goto('/olist/?view=explore');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: /Olist.*e-commerce/i })).toBeVisible();
  });

  test('no console errors on airbnb page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text()); });
    await page.goto('/airbnb');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });

  test('chart container renders', async ({ page }) => {
    await page.goto('/airbnb/?view=explore');
    await page.waitForLoadState('load');
    const headings = page.getByRole('heading', { level: 2 });
    await expect(headings.first()).toBeVisible();
  });
});
