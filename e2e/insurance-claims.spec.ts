import { test, expect } from './fixtures';

test('a company selection disables unsupported BF estimates without requesting them', async ({ page }) => {
  const comparisonRequests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.endsWith('/cl-vs-bf')) comparisonRequests.push(request.url());
  });
  await page.route('**/api/insurance/api/v1/**', route => {
    const endpoint = new URL(route.request().url()).pathname.split('/').at(-1);
    const payload = endpoint === 'filters'
      ? { lobs: ['Auto'], companies: [{ grcode: 77, grname: 'Example insurer' }], years: [1988, 1997] }
      : endpoint === 'loss-triangle'
        ? { accident_years: [1997], development_lags: [1], triangle: [[100]], ibnr_by_year: [{ accident_year: 1997, latest_lag: 1, latest_value: 100, cdf: 1.5, ultimate: 150, ibnr: 50 }] }
        : endpoint === 'kpis'
          ? { total_premium: 1000, avg_loss_ratio: 0.5 }
          : {};
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.goto('/insurance/?view=explore');
  const bf = page.getByRole('button', { name: 'Bornhuetter-Ferguson', exact: true });
  await expect(bf).toBeEnabled();
  await bf.click();
  await page.waitForLoadState('networkidle');
  comparisonRequests.length = 0;
  const companyTriangle = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/loss-triangle') && url.searchParams.get('company') === '77';
  });
  await page.getByRole('combobox', { name: 'Insurer', exact: true }).selectOption('77');
  expect(new URL((await companyTriangle).url()).searchParams.get('method')).toBe('cl');
  await expect(bf).toBeDisabled();
  await expect(page.getByText('Select all companies to compare methods. Company-specific BF estimates are unavailable.', { exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(comparisonRequests).toEqual([]);
});

test.describe('Insurance Claims -- Deploy Gate', () => {
  test('loads at /insurance', async ({ page }) => {
    await page.goto('/insurance/?view=explore');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { level: 1, name: /Insurance|Claims|Reserves/i })).toBeVisible();
  });

  test('dashboard structure renders', async ({ page }) => {
    await page.goto('/insurance/?view=explore');
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
    await page.goto('/insurance/?view=explore');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});
