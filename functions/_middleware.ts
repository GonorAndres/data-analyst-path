/**
 * Sends the Pages-assigned hostname to the custom domain.
 *
 * Creating a Pages project mints `<project>.pages.dev`; the custom domain is a
 * CNAME added on top, never a replacement. Both hostnames keep serving the same
 * build, so the site is publicly reachable at two URLs, search engines index
 * whichever they find first, and the analytics split between them. Measured
 * elsewhere in this portfolio at 44% of pageviews landing on the unbranded
 * host.
 *
 * The provider hostname cannot simply be turned off -- it is the deployment
 * target the custom domain resolves to -- and it is already indexed and
 * carrying real visitors, so a 301 is the right instrument: it keeps those
 * visitors, and it consolidates ranking onto the canonical URL.
 *
 * Runs as root middleware rather than inside the individual Functions because
 * it has to cover static assets too, which is nearly the whole site. Pages
 * routes every request through `functions/_middleware.ts` first; `next()`
 * resumes normal handling -- the other Functions, then `dist/`.
 */

/**
 * Exact match, never `endsWith('.pages.dev')`.
 *
 * Preview deployments live at `dev.data-analyst-hub.pages.dev` and
 * `<hash>.data-analyst-hub.pages.dev`. A suffix check would redirect those to
 * production too, which makes every preview impossible to test -- the reason
 * previews exist at all is to see the build before it is canonical.
 */
const PAGES_APEX = 'data-analyst-hub.pages.dev'

const CANONICAL_ORIGIN = 'https://data-analyst.gonor.me'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)

  if (url.hostname === PAGES_APEX) {
    // Path and query are preserved: a deep link to /cohorts/segmentos?x=1 has
    // to arrive at the same page, not at the landing page.
    return Response.redirect(CANONICAL_ORIGIN + url.pathname + url.search, 301)
  }

  return context.next()
}
