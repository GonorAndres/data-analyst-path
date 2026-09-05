import { test, expect } from './fixtures';

test.describe('Operational Efficiency -- Deploy Gate', () => {
  test('loads at /operations', async ({ page }) => {
    await page.goto('/operations/?view=explore');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1, name: /NYC 311/i })).toBeVisible();
  });

  test('intro heading renders', async ({ page }) => {
    await page.goto('/operations/?view=explore');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: 'Business question', exact: true })).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/operations/?view=explore');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: /Executive overview/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Context/i }).click();
  });

  test('filters present', async ({ page }) => {
    await page.goto('/operations/?section=resumen');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: /Clear filters|Reset filters/i })).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text()); });
    await page.goto('/operations/?view=explore');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
