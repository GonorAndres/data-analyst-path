import { test, expect } from '@playwright/test';

/**
 * Gates the thing the per-dashboard specs cannot see: that all six dashboards
 * are served from one origin, each from its own path, with its own identity
 * intact.
 *
 * The per-dashboard specs each check one path in isolation and would still pass
 * if the merge dropped a sibling, served the wrong app at a path, or gave every
 * page project 00's favicon.
 */
test.describe('Portfolio hub -- Deploy Gate', () => {
  const dashboards = [
    { path: '/insurance', title: /Reservas y Siniestralidad/i },
    { path: '/abtest', title: /A\/B Test Lab/i },
    { path: '/kpi', title: /Executive KPI Report/i },
    { path: '/portfolio', title: /Portfolio Tracker/i },
    { path: '/operations', title: /Centro de Operaciones NYC 311/i },
    { path: '/airbnb', title: /Airbnb CDMX/i },
    { path: '/olist', title: /Olist E-Commerce/i },
  ];

  test('landing page is the portfolio index, not a redirect', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('landing page links to the siblings on this origin', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    // Cross-origin hrefs here would mean the merge shipped but the index still
    // sends visitors back to the old per-project deployments.
    for (const { path } of dashboards) {
      await expect(page.locator(`a[href^="${path}"]`).first()).toHaveCount(1);
    }
  });

  for (const { path, title } of dashboards) {
    test(`${path} serves its own app`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await page.waitForLoadState('load');
      await expect(page).toHaveTitle(title);
    });
  }

  test('each dashboard keeps its own favicon', async ({ page }) => {
    // A single shared favicon at the root would be the tell-tale sign that the
    // public/ assets were merged rather than namespaced.
    const expected: Array<[string, string]> = [
      ['/insurance', '/insurance/favicon.svg'],
      ['/abtest', '/abtest/favicon.svg'],
      ['/kpi', '/kpi/favicon.svg'],
      ['/portfolio', '/portfolio/favicon.svg'],
      ['/operations', '/operations/favicon.svg'],
    ];
    for (const [path, icon] of expected) {
      await page.goto(path);
      await expect(page.locator(`link[rel="icon"][href="${icon}"]`)).toHaveCount(1);
    }
  });

  test('analytics is proxied same-origin and tagged per dashboard', async ({ page }) => {
    // The whole point of /ingest: an adblocker that drops us.i.posthog.com must
    // not be able to drop this. And one PostHog project means app_id is the only
    // thing separating these six sites in the data.
    const seen = new Set<string>();
    for (const [path, appId] of [
      ['/', 'data-analyst-hub'],
      ['/insurance', 'insurance-claims'],
      ['/abtest', 'ab-test-analysis'],
      ['/kpi', 'executive-kpi-report'],
      ['/portfolio', 'financial-portfolio-tracker'],
      ['/operations', 'operational-efficiency'],
    ] as const) {
      await page.goto(path);
      const html = await page.content();
      expect(html).toContain(`app_id:'${appId}'`);
      expect(html).toContain("api_host:'/ingest'");
      expect(html).toContain("capture_pageview:'history_change'");
      expect(html).not.toContain("api_host:'https://us.i.posthog.com'");
      seen.add(appId);
    }
    expect(seen.size).toBe(6); // no two dashboards sharing an app_id
  });
});
