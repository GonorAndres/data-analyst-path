import { test, expect } from '@playwright/test';

test.describe('Insurance Claims -- Deploy Gate', () => {
  test('redirects to /insurance and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/\/insurance/);
    await expect(page.getByRole('heading', { name: /Reservas y Siniestralidad/i })).toBeVisible();
  });

  test('dashboard structure renders', async ({ page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('no console errors (excluding network)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('fetch') || text.includes('API error') || text.includes('Failed to load') || text.includes('ERR_CONNECTION')) return;
        errors.push(text);
      }
    });
    await page.goto('/insurance');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
    expect(errors).toHaveLength(0);
  });
});
