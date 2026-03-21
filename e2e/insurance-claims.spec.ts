import { test, expect } from '@playwright/test';

test.describe('Insurance Claims -- Deploy Gate', () => {
  test('redirects to /insurance and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000); // cold start
    await expect(page).toHaveURL(/\/insurance/);
    await expect(page.getByRole('heading', { name: /Reservas y Siniestralidad/i })).toBeVisible();
  });

  test('KPI cards visible', async ({ page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
    await expect(page.getByText(/Loss ratio/i)).toBeVisible();
    await expect(page.getByText(/Combined ratio/i)).toBeVisible();
  });

  test('development triangle renders', async ({ page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
    await expect(page.getByRole('heading', { name: /Triangulo de desarrollo/i })).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/insurance');
    await page.waitForLoadState('load');
    await page.waitForTimeout(5000);
    expect(errors).toHaveLength(0);
  });
});
