import { test, expect } from './fixtures';

test.describe('Insurance Claims -- Deploy Gate', () => {
  test('loads at /insurance', async ({ page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1, name: /Insurance|Claims|Reserves/i })).toBeVisible();
  });

  test('dashboard structure renders', async ({ page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('load');
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
    expect(errors).toHaveLength(0);
  });
});
