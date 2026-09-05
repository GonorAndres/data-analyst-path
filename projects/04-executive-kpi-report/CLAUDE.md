# CLAUDE.md — Executive KPI Report

## Active Application

Frontend code lives in `apps/web/src/features/kpi` relative to the repository
root. The shared app owns `/kpi/`, navigation, light/dark themes, and
English/Spanish preferences. Do not recreate project-local frontend source or
configuration; superseded copies were archived outside the repository and removed.

Run `npm ci --prefix apps/web` and `npm run dev` from the repository root.
Start the consolidated backend separately with `bash backend/dev.sh` (port
8080). Browser requests use `/api/kpi`; keep SWR keys service-prefixed. Backend
source, report generation, pipelines, notebooks, and public artifacts remain
project-owned. Publication uses the shared Cloudflare Pages application, not a
project-specific Vercel deployment. See `../../docs/retirement.md` for the
verified retirement inventory.

## To-Do

- [ ] Improve PDF generation: add more format and detailed info
