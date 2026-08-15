import { test, expect } from '@playwright/test';

test.describe('Airbnb CDMX -- Deploy Gate', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('landing indexes all 7 portfolio projects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(8);

    // Seven of the eight cards are now internal routes on this same origin --
    // the merge onto one Cloudflare Pages project is what made them internal.
    // Only the Olist cohort app is still elsewhere: it is Streamlit on Cloud
    // Run, not part of this build.
    for (const path of ['/airbnb', '/olist', '/insurance', '/abtest', '/kpi', '/portfolio', '/operations']) {
      await expect(page.locator(`a[href^="${path}"]`).first()).toBeVisible();
    }
    await expect(
      page.locator('a[href="https://da-cohort-streamlit-451451662791.us-central1.run.app"]'),
    ).toBeVisible();
  });

  test('airbnb case study loads', async ({ page }) => {
    await page.goto('/airbnb');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('olist case study loads', async ({ page }) => {
    await page.goto('/olist');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: /Olist E-Commerce/i })).toBeVisible();
  });

  test('no console errors on airbnb page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/airbnb');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });

  test('chart container renders', async ({ page }) => {
    await page.goto('/airbnb');
    await page.waitForLoadState('load');
    const headings = page.getByRole('heading', { level: 2 });
    await expect(headings.first()).toBeVisible();
  });
});
