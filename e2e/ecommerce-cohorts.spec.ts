import { test, expect } from '@playwright/test';

test.setTimeout(90000); // Streamlit cold start can be slow

test.describe('E-Commerce Cohorts (Streamlit) -- Deploy Gate', () => {
  test('app loads with title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(10000); // Cloud Run cold start
    await expect(page.getByText(/Analisis de Cohortes/i)).toBeVisible();
  });

  test('sidebar shows data summary', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(10000);
    await expect(page.getByText(/Olist E-Commerce/i)).toBeVisible();
    await expect(page.getByText('96,478')).toBeVisible();
  });

  test('main content renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(10000);
    await expect(page.getByText(/Dashboard ejecutivo/i)).toBeVisible();
  });
});
