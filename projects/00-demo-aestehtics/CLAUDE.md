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

**Production checklist (Vercel + Cloud Run):**
1. Deploy FastAPI backend to Cloud Run — get the service URL (e.g. `https://olist-api-xxxx-uc.a.run.app`)
2. In Vercel project settings → Environment Variables, add:
   - `OLIST_BACKEND_URL` = `https://olist-api-xxxx-uc.a.run.app` (server-side only, no NEXT_PUBLIC_)
3. Do NOT set `NEXT_PUBLIC_OLIST_API_URL` in production — the proxy handles routing and keeps the Cloud Run URL private from the client bundle.
4. Ensure Cloud Run allows unauthenticated requests OR add an `Authorization` header in the `olistFetcher` via a server-side secret.
5. The `BackendWarmup` component on the homepage fires `GET /api/olist/health` on first load — this wakes the Cloud Run container before the user navigates to `/olist`.

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
