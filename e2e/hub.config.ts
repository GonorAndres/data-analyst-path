import { defineConfig } from '@playwright/test';
import { baseConfig } from './shared.config';

/**
 * One config for the merged site, replacing the six per-project configs that
 * each ran against their own `next start` port.
 *
 * The server is `wrangler pages dev`, not a plain static file server, because
 * it is the runtime that actually serves production: it applies Pages' URL
 * semantics (trailing slashes, `.html` stripping) and it runs the Functions in
 * `functions/`. A static server would pass tests that the real host fails.
 *
 * No backend runs in CI. The `/api/*` Function forwards to Cloud Run and those
 * calls may fail or time out here -- that is expected, and the specs assert
 * only on what renders without data, exactly as they did on Vercel.
 */
export default defineConfig({
  ...baseConfig,
  testDir: '.',
  // Everything except the Streamlit cohort app, which is a separate Cloud Run
  // service with its own config and is not part of this build.
  testIgnore: 'ecommerce-cohorts.spec.ts',
  use: { ...baseConfig.use, baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173' },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npx wrangler pages dev --port 4173 --ip 127.0.0.1',
        url: 'http://127.0.0.1:4173/',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
