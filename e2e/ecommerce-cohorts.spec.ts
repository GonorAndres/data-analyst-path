import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test.describe('E-Commerce Cohorts (Streamlit) -- Deploy Gate', () => {
  test('app loads with header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(10000);
    await expect(page.locator('.page-header').first()).toBeVisible();
  });

  test('sidebar renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(10000);
    const sidebar = page.locator('[data-testid="stSidebar"]');
    await expect(sidebar.getByText(/Olist E-Commerce/i)).toBeVisible();
  });

  test('main content renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(10000);
    await expect(page.getByText(/Dashboard ejecutivo/i)).toBeVisible();
  });
});
