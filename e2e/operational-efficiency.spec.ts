import { test, expect } from '@playwright/test';

test.describe('Operational Efficiency -- Deploy Gate', () => {
  test('redirects to /operations and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/\/operations/);
    await expect(page.getByRole('heading', { name: /Centro de Operaciones NYC 311/i })).toBeVisible();
  });

  test('contexto tab content visible', async ({ page }) => {
    await page.goto('/operations');
    await page.waitForLoadState('load');
    await expect(page.getByText('OPS // P06')).toBeVisible();
    await expect(page.getByText(/Eficiencia Operacional/i)).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/operations');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: /Resumen Ejecutivo/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Contexto/i }).click();
  });

  test('filters present', async ({ page }) => {
    await page.goto('/operations');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: /Limpiar filtros/i })).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/operations');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
