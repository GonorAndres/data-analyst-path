import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { baseConfig } from './shared.config';

/**
 * One config for the unified app, replacing the per-project configs that
 * each ran against their own `next start` port.
 *
 * The server is `wrangler pages dev`, not a plain static file server, because
 * it is the runtime that actually serves production: it applies Pages' URL
 * semantics (trailing slashes, `.html` stripping) and it runs the Functions in
 * `functions/`. A static server would pass tests that the real host fails.
 *
 * No backend runs in CI. Shared fixtures provide deterministic failures;
 * populated-data specs override them with explicit service responses.
 */
export default defineConfig({
  ...baseConfig,
  // Every spec in here runs against the unified dist/. The Streamlit cohort app
  // used to be the one exception -- a separate Cloud Run service with its own
  // config -- but it was rebuilt into the hub at /cohorts, so there is nothing
  // left to exclude.
  testDir: '.',
  use: { ...baseConfig.use, baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173' },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // API_ORIGIN points the /api/* proxy at a closed port so the gate is
        // hermetic. Without it the Function's default origin is the real Cloud
        // Run service, so CI reaches out to production on every /api/* call --
        // which is slow (min-instances=0, so each spec eats a cold start) and,
        // worse, unstable: workerd took a fatal partway through roughly half of
        // all runs, and every spec after it reported ERR_CONNECTION_REFUSED.
        // It always struck just after the insurance specs, the only ones that
        // exercise /api/*, so the blame landed on whichever spec ran next --
        // /operations, alphabetically -- and looked like a broken dashboard.
        //
        // Browser fixtures verify failure and populated-data states without a
        // live backend. Any unmocked proxy request fails cleanly with a 504.
        // Port 9 refuses immediately rather than hanging.
        command:
          'npx wrangler pages dev --port 4173 --ip 127.0.0.1 --binding API_ORIGIN=http://127.0.0.1:9',

        // Both of the settings below exist because of the same failure, and
        // neither is optional.
        //
        // `cwd` defaults to the directory holding this config -- `e2e/`. Wrangler
        // resolves `functions/` relative to its working directory, so from there
        // it found no Functions at all and served only the static `dist/` tree.
        // Every `/api/*` and `/ingest/*` request 404'd into the SPA fallback,
        // which is HTML, which is why the browser reported "Refused to execute
        // script ... MIME type ('text/html')" for `array.js`. The suite still
        // passed locally whenever a manually started server -- launched from the
        // repo root, with Functions -- happened to be listening on this port.
        cwd: path.resolve(__dirname, '..'),

        // Wait on a Function rather than `/`. Static assets answer before the
        // Functions bundle is ready, so a probe against `/` reports success on a
        // server that cannot yet serve the routes half these specs depend on --
        // and, as above, would report success even if Functions never loaded.
        url: 'http://127.0.0.1:4173/health',

        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
