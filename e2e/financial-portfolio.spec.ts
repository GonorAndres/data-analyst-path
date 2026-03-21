import { test, expect } from '@playwright/test';

test.describe('Financial Portfolio Tracker -- Deploy Gate', () => {
  test('redirects to /portfolio and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/\/portfolio/);
    await expect(page.getByRole('heading', { name: /Portfolio Tracker/i })).toBeVisible();
  });

  test('about section renders with data source', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('load');
    await expect(page.getByText('Yahoo Finance (yfinance)', { exact: true })).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Overview' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'About' }).click();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/portfolio');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
