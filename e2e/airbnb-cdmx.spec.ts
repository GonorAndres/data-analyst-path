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
    // 2 internal case studies + 6 external project cards
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(8);
    const externalUrls = [
      'https://insurance-claims-dashboard-pi.vercel.app',
      'https://da-cohort-streamlit-451451662791.us-central1.run.app',
      'https://ab-test-analysis.vercel.app',
      'https://executive-kpi-report.vercel.app',
      'https://financial-portfolio-tracker-iota.vercel.app',
      'https://operational-efficiency.vercel.app',
    ];
    for (const url of externalUrls) {
      await expect(page.locator(`a[href="${url}"]`)).toBeVisible();
    }
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
