# Data Analyst Portfolio

Andrés González Ortega · Actuarial Science, UNAM · Mexico City

One bilingual analytics site at [data-analyst.gonor.me](https://data-analyst.gonor.me), with seven case studies and eight interactive analyses.

The current source presents visual case studies first: a business question, annotated evidence, interpretation, a supported decision, and methods. Insurance leads the homepage. **Explore** opens the analytical workspace; **Methods & sources** connects the case to its research and reports. The presentation changes described here have been verified locally and are not yet deployed.

The unified implementation was deployed on 2026-09-05. Approved legacy source and hosting retirement is complete; see the retirement ledger for verification and backup details.

## Application structure

- `apps/web`: the only frontend application. Shared navigation, theme, language, and UI tokens; analysis code in `src/features`.
- `projects`: Python backends, pipelines, SQL, notebooks, datasets, reports, and namespaced public research artifacts.
- `backend`: one FastAPI application mounting six analytical services.
- `functions`: Cloudflare Pages API and analytics proxies, health endpoint, and provider-host redirect.
- `e2e`: browser regression tests with deterministic data fixtures.
- `docs`: analyst knowledge base, architecture, and the retirement checklist.

Superseded frontend copies and legacy hosting have been removed. Research artifacts, datasets, and backend modules are preserved. See [retirement ledger](docs/retirement.md).

## Case studies

| Case study | Analysis routes |
|---|---|
| Insurance claims and reserving | `/insurance/` |
| Olist e-commerce | `/olist/` marketplace performance; `/cohorts/` customer retention |
| A/B experiments | `/abtest/` |
| Executive KPI reporting | `/kpi/` |
| Financial portfolio analytics | `/portfolio/` |
| NYC 311 operational efficiency | `/operations/` |
| Airbnb Mexico City | `/airbnb/` |

## Local development

Node 22+ is required. Run frontend commands from the repository root.

```bash
npm ci
npm ci --prefix apps/web
npm run dev
```

Open `http://localhost:3000`. Airbnb and cohort data are bundled. The other analyses use the consolidated API:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
bash backend/dev.sh
```

The backend listens on port 8080. To use a different development API origin, set `API_ORIGIN` in `apps/web/.env.local`. Production clients always use same-origin `/api/<service>` URLs.

Public JSON and notebook HTML remain alongside their research project. `scripts/stage-web-assets.mjs` stages them into the generated `apps/web/public` directory before development/build. Do not edit the generated copies.

## Build and verification

```bash
npm run build
npm run typecheck:web
npm run typecheck:functions
npm run evidence:check
npm run test:e2e
npm run preview
```

The build installs dependencies once, exports one Next.js app, and prepares `dist/` for Cloudflare Pages. Use `npm run build:fast` to reuse installed dependencies. Development and production Next outputs are isolated.

Tests run against the Pages runtime. API fixtures cover failure, empty, and populated results without production-data or analytics requests. The suite checks existing routes, preference persistence, responsive layouts, bookmarkable sections, service-cache isolation, and reports.

Deployment, deletions, and all git actions require explicit user approval.

## Research and maintenance

- [Unified architecture](docs/architecture.md)
- [Legacy retirement inventory](docs/retirement.md)
- [Analytical follow-up issues](docs/analysis-followups.md)
- [Case-study presentation and evidence maintenance](docs/presentation.md)
- [Evidence audit](docs/evidence-audit.md)
- [Analyst workflow](docs/workflow/00-overview.md)
- [Dashboard design principles](docs/design/dashboard-design.md)

Python, SQL, TypeScript, Recharts, and D3 support the analyses. Research artifacts retain their original languages; the visitor interface supports English and Spanish with a shared light/dark theme.

Related work: [professional portfolio](https://github.com/GonorAndres/GonorAndres.github.io), data-science and data-engineering repositories.
