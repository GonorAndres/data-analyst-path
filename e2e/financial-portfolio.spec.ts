import { test, expect } from './fixtures';

test.describe('Financial Portfolio Tracker -- Deploy Gate', () => {
  test('loads at /portfolio', async ({ page }) => {
    await page.goto('/portfolio/?view=explore');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1, name: /Portfolio analytics/i })).toBeVisible();
  });

  test('about section renders with data source', async ({ page }) => {
    await page.goto('/portfolio/?view=explore');
    await page.waitForLoadState('load');
    await expect(page.getByText(/Yahoo Finance/).first()).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/portfolio/?view=explore');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Overview' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'About' }).click();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text()); });
    await page.goto('/portfolio/?view=explore');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
