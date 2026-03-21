import { test, expect } from '@playwright/test';

test.describe('Executive KPI Report -- Deploy Gate', () => {
  test('redirects to /kpi and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/\/kpi/);
    await expect(page.getByRole('heading', { name: /Executive KPI Report/i })).toBeVisible();
  });

  test('intro section renders', async ({ page }) => {
    await page.goto('/kpi');
    await page.waitForLoadState('load');
    await expect(page.getByText('NovaCRM', { exact: true })).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/kpi');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Overview' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'About' }).click();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/kpi');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
