/**
 * Sends the Pages provider URL to the custom domain.
 *
 * Cloudflare creates `data-analyst-hub.pages.dev` when the project is created,
 * and attaching `data-analyst.gonor.me` adds a hostname rather than replacing
 * one. Both stay publicly reachable and serve byte-identical content, which
 * splits traffic and search ranking across two addresses. Redirecting rather
 * than removing: the provider URL is the deployment target the custom domain
 * resolves to, so it cannot be deleted, and it may already be linked.
 *
 * This is `_middleware`, not the `_worker.js` the canonical-domain skill
 * prescribes. A `_worker.js` puts a Pages project into advanced mode, where the
 * worker owns all routing and the `functions/` directory is ignored entirely --
 * which would silently disable `/api/*` and `/ingest/*`, the two routes with no
 * static fallback. Middleware composes with Functions instead of replacing them.
 *
 * The hostname is compared exactly. Preview deployments are served from
 * `dev.data-analyst-hub.pages.dev` and `<hash>.data-analyst-hub.pages.dev`, so a
 * `.endsWith('.pages.dev')` test would bounce every preview to production and
 * leave previews impossible to test.
 */

const PAGES_APEX = 'data-analyst-hub.pages.dev'
const CANONICAL_ORIGIN = 'https://data-analyst.gonor.me'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)

  if (url.hostname === PAGES_APEX) {
    return Response.redirect(`${CANONICAL_ORIGIN}${url.pathname}${url.search}`, 301)
  }

  return context.next()
}
