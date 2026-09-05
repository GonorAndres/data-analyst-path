# CLAUDE.md — 00-demo-aestehtics

Project-level instructions for the Airbnb CDMX and Olist analyses.

## Active Frontend and Local Development

Frontend components live in `apps/web/src/features/market` relative to the
repository root. Routes are `/airbnb/` and `/olist/`; the shared portfolio
homepage owns `/`. Do not recreate project-local frontend source or configuration:
the superseded copies were archived outside the repository and removed.

Run from the repository root:

```bash
npm ci --prefix apps/web
npm run dev
```

The frontend defaults to `http://localhost:3000`. In a separate terminal, run
`bash backend/dev.sh` from the repository root to start the consolidated API on
port **8080**. Backend source, pipelines, notebooks, and `public/` artifacts
remain project-owned. Public assets are staged into the shared frontend.

## Backend Proxy Architecture

The browser never calls the FastAPI backend directly. All API requests go through a Next.js rewrite proxy:

```
Browser → localhost:3000/api/olist/<path> → Next.js → localhost:8080/olist/<path>
```

Development rewrites live in `apps/web/next.config.js`. `API_ORIGIN` is the
optional server-side origin override; its default is `http://localhost:8080`.
Do not use the obsolete `OLIST_BACKEND_URL` or a `NEXT_PUBLIC_OLIST_API_URL`.

**Production:** one static frontend is built by `scripts/build-hub.mjs` for the
`data-analyst-hub` Cloudflare Pages project at `data-analyst.gonor.me`.
Production `/api/olist/*` requests are handled by `functions/api/[[path]].ts`,
which proxies to the consolidated Cloud Run service at `/olist`. Keep requests
relative and SWR keys service-prefixed; never bake a backend hostname into browser
code. The old project hosting was retired; see `../../docs/retirement.md` for
the verified inventory. Do not restore legacy deployment workflows.

## Consolidated Backend

The active portfolio API is mounted by `backend/main.py` at the repository root.
Olist routes are prefixed with `/olist`, for example `/olist/api/v1/filters`.

## Dark / Light Mode Contrast Rule

**Always verify contrast in both modes whenever you add or modify colors.**

- SVG `fill` and `stroke` attributes are NOT affected by CSS `color` overrides — hardcoded hex values in Recharts `tick`, `label`, `stroke`, and `Cell` props will break in one of the two modes.
- Use CSS custom properties (`var(--chart-tick)`, `var(--chart-label)`, `var(--chart-grid)`, `var(--bar-rank-1/2/3)`) defined in `apps/web/src/app/globals.css` for chart colors.
- Minimum contrast targets: **4.5:1** for body/label text, **3:1** for large text and UI components (WCAG AA).
- Verify charts, labels, and tooltips against the current shared light and dark
  surface tokens, not obsolete project-specific palettes.
- The shared preferences provider owns English/Spanish and light/dark state.
  English and light mode are first-visit defaults; do not add local toggles or
  duplicate site navigation.
