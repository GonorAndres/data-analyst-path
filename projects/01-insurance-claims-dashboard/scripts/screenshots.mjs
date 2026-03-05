import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'dashboards', 'screenshots');
const URL = 'http://localhost:3051/insurance';

async function capture(page, name, opts = {}) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  console.log(`  Saved: ${name}`);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
  }, theme);
  await page.waitForTimeout(300);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Loading dashboard...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  // Wait for data to load (KPIs rendered)
  await page.waitForTimeout(5000);

  // Light mode -- full dashboard
  console.log('Capturing light mode...');
  await setTheme(page, 'light');
  await capture(page, 'dashboard-light-full.png', { fullPage: true });

  // Light mode -- triangle section
  const triangleSection = page.locator('text=Triangulo de desarrollo').first();
  if (await triangleSection.count()) {
    await triangleSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    // Capture the viewport with triangle visible
    await capture(page, 'triangle-heatmap-light.png');
  }

  // Dark mode -- full dashboard
  console.log('Capturing dark mode...');
  await setTheme(page, 'dark');
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await capture(page, 'dashboard-dark-full.png', { fullPage: true });

  // Dark mode -- triangle section
  if (await triangleSection.count()) {
    await triangleSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await capture(page, 'triangle-heatmap-dark.png');
  }

  await browser.close();
  console.log('Done!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
