/**
 * Liveness for the Pages layer itself.
 *
 * Deliberately makes no outbound call. The other two Functions both depend on
 * something remote -- Cloud Run for `/api/*`, PostHog for `/ingest/*` -- so
 * neither can answer "are the Functions running?" without also answering "is
 * the upstream up?", and a Cloud Run cold start takes ~30s.
 *
 * This exists because static assets and Functions do not become ready at the
 * same moment. `wrangler pages dev` serves `dist/` almost immediately but
 * compiles the Functions bundle after, so a readiness probe against `/` passes
 * while `/ingest/*` still falls through to the static 404 -- which the browser
 * then refuses to execute as a script, with a console error that looks nothing
 * like a startup race. `e2e/hub.config.ts` waits on this route for exactly that
 * reason, and `ops/urls.yml` uses it to separate "Pages is down" from "the
 * origin behind it is down".
 */

const SERVICES = ['insurance', 'olist', 'abtest', 'kpi', 'portfolio', 'ops']

export const onRequest: PagesFunction = async () =>
  Response.json(
    {
      status: 'ok',
      functions: ['api', 'ingest', 'health'],
      api_services: SERVICES,
    },
    { headers: { 'cache-control': 'no-store' } },
  )
