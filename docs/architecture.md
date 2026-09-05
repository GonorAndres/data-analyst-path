# Unified analytics application

## Ownership

`apps/web` owns all visitor-facing routes. Its root layout loads one font family, preference provider, navigation shell, and analytics initializer. Project modules own their calculations, charts, filters, and local interfaces; they do not initialize a second theme, locale, or site shell.

The public portfolio presents seven case studies. Olist marketplace performance and cohort retention are two analyses of one e-commerce case study. Their routes and datasets remain distinct; the navigation explains their relationship.

## Data flow

The browser calls `/api/<service>/api/v1/...`. In production, the Pages Function forwards to the existing consolidated FastAPI service; development rewrites forward to `API_ORIGIN` (default `http://localhost:8080`). No endpoint schema was changed for consolidation.

SWR keys include the complete service URL and all query parameters. Fetchers accept only their own service prefix. Reusing `/api/v1/filters` as a cache key is prohibited: one browser now hosts every analysis. Project filter providers stay below their project route.

Airbnb reads its public JSON during export. Cohorts loads only the JSON files required by the current view and clears rejected cache entries. Research artifacts are stored in their project public directories and staged into generated `apps/web/public`; their existing public URLs are preserved. The cohort pipeline also updates the imported metadata under the unified feature module.

## Navigation and presentation

- Analysis roots now open a visual case narrative. `?view=explore` opens the dashboard and `?view=methods` opens research. Existing `?section=` bookmarks imply exploration, including when switching back to its default tab. Nested research/cohort URLs remain available. See [presentation maintenance](presentation.md).
- Typed bilingual case content and reproducible retained evidence snapshots back the narrative. Shared `AnalysisFigure` wrappers align domain charts. The static narrative does not request analytics APIs; measured evidence and synthetic/conceptual examples are explicitly distinguished.
- Global project navigation and home links are available from every page; the mobile menu supports keyboard dismissal and focus restoration.
- Existing cohort subroutes remain canonical. Former state-only dashboard tabs use `?section=`; invalid values fall back to the project default. Back, forward, and reload preserve the selected section.
- English and light are the first-visit defaults. `analyst-locale` and `analyst-theme` persist preferences; prior `theme`/`kpi-theme` values are read during migration. Storage failures do not prevent interaction.
- Shared CSS controls fonts, spacing, borders, surfaces, and chart text. Domain color scales remain separate. Theme changes update CSS before chart redraw; D3 charts also respond to viewport changes.
- Visible controls and narrative support English/Spanish. Original dataset category names and source notebooks retain their provenance and language; notebook viewers explain this.
- Loading, request failure, no matching data, and valid numeric zero are distinct states. Never coerce absent metrics to zero.

## Build, analytics, and compatibility

One Next static export produces all routes. `scripts/build-hub.mjs` prepares `dist/` and adds canonical tags to application pages, excluding 404s and original notebook documents. The prior multi-export merge modes are retired. `.next-dev` and `.next` separate development and production artifacts; static exports are emitted into `out/`.

Analytics initializes once. Client navigation updates `app_id` before capturing the pageview. `/ingest` remains the same-origin transport; analytics is disabled in Next development and intercepted by test fixtures. The Cloudflare provider-host redirect and preview-host behavior remain unchanged.

The frontend retains the existing Next 14 / React 18 platform. A framework-version upgrade and changes to analytical models are outside this migration.

## Completion gates

Run the production build, both TypeScript checks, and the browser suite. Test populated results with fixtures as well as outages. Test keyboard use, section history, cache isolation, both locales, and both themes at 390, 768, and 1440 pixels. Completed source deletion, hosting retirement, deployment verification, and recovery details are tracked in `retirement.md`.
