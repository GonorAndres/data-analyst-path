# CLAUDE.md — 00-demo-aestehtics

Project-level instructions for the Airbnb CDMX Next.js dashboard.

## Local Development Ports

- **Next.js frontend**: `PORT=3050 npm run dev` → `http://localhost:3050` (port 3000 is taken)
- **Olist FastAPI backend**: always run on port **2050**
  ```bash
  cd backend && python3 -m uvicorn olist_backend.main:app --host 0.0.0.0 --port 2050
  ```
- Only **port 3050** needs to be forwarded to your local machine. Port 2050 is internal — the browser never calls it directly.

## Backend Proxy Architecture

The browser never calls the FastAPI backend directly. All API requests go through a Next.js rewrite proxy:

```
Browser → localhost:3050/api/olist/<path> → Next.js (server-side) → localhost:2050/<path>
```

This is defined in `next.config.js` using `rewrites()`. The proxy destination is controlled by `OLIST_BACKEND_URL` (server-side env var, no `NEXT_PUBLIC_` prefix).

**`.env.local` (dev):**
```
OLIST_BACKEND_URL=http://localhost:2050
```

**Production:** there is nothing to configure. This app is no longer its own
Vercel deployment with its own backend URL; it is built as a static export and
merged into the `data-analyst-hub` Cloudflare Pages project by
`scripts/build-hub.mjs`, and it owns the root of `data-analyst.gonor.me`.

- `rewrites()` in `next.config.js` applies to `npm run dev` only. A static export
  has no server, so in production `/api/olist/*` is answered by the hub's
  `functions/api/[[path]].ts`, which proxies to the consolidated Cloud Run
  service at `/olist`.
- Do **not** set `NEXT_PUBLIC_OLIST_API_URL`. The relative `/api/olist` default is
  what routes through that proxy; an absolute URL bypasses it and bakes a Cloud
  Run hostname into the client bundle. `build-hub.mjs` strips the variable from
  the build env precisely so this cannot happen by accident.
- `OLIST_BACKEND_URL` is a dev-only variable now — it feeds the `rewrites()`
  destination. In production the origin lives in the Pages Function instead.
- The `BackendWarmup` component fires `GET /api/olist/health` on first load,
  waking the Cloud Run container before the user reaches `/olist`. It still
  matters: the service runs at `min-instances=0`.

## Consolidated Backend

This backend can also run as part of the unified portfolio API at `backend/main.py` (repo root). In that mode, all routes are prefixed with `/olist` (e.g., `/olist/api/v1/filters`). Set `OLIST_BACKEND_URL=http://localhost:8080/olist` in `.env.local` to use the consolidated backend.

## Dark / Light Mode Contrast Rule

**Always verify contrast in both modes whenever you add or modify colors.**

- SVG `fill` and `stroke` attributes are NOT affected by CSS `color` overrides — hardcoded hex values in Recharts `tick`, `label`, `stroke`, and `Cell` props will break in one of the two modes.
- Use CSS custom properties (`var(--chart-tick)`, `var(--chart-label)`, `var(--chart-grid)`, `var(--bar-rank-1/2/3)`) defined in `src/app/globals.css` for all chart colors.
- Minimum contrast targets: **4.5:1** for body/label text, **3:1** for large text and UI components (WCAG AA).
- After any color change run a quick mental check: does this value work on `#FAFAF8` (light bg) AND on `#141414` (dark bg)?
- The `.dark .text-muted` override in `globals.css` bumps muted text from `#6B6B6B` (fails AA on `#141414`) to `#9A9A9A` (6.6:1). Keep this pattern for any new muted-text tokens.
- Tooltip `contentStyle` backgrounds are hardcoded (`#FAFAF8` / `#1A1A1A`) — if a dark-mode tooltip is added later, these need explicit overrides.
