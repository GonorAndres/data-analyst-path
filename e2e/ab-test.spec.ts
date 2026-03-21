import { test, expect } from '@playwright/test';

test.describe('A/B Test Lab -- Deploy Gate', () => {
  test('redirects to /abtest and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/\/abtest/);
    await expect(page.getByRole('heading', { name: /A\/B Test Lab/i })).toBeVisible();
  });

  test('analysis tabs present', async ({ page }) => {
    await page.goto('/abtest');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: 'Executive Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Frequentist' })).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/abtest');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Frequentist' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Executive Overview' }).click();
  });

  test('notebooks page loads', async ({ page }) => {
    await page.goto('/abtest/notebooks');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: /Technical Process/i })).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/abtest');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
