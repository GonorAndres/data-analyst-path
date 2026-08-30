# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Comprehensive **Data Analyst portfolio and knowledge base** for an actuarial science graduate (UNAM, Mexico) targeting hybrid DA roles (business/financial/product analyst). The repo combines:
- **7 end-to-end portfolio projects** spanning real estate, insurance, e-commerce, finance, and operations domains
- **Knowledge base** documenting the full analyst workflow (stakeholder question -> delivered insights)
- **Multiple output formats**: Next.js interactive dashboards (Cloudflare Pages), Jupyter notebooks, automated PDF reports

This repo is distinct from sibling repos: `data-science/` (ML/predictive modeling) and `data-enginer/` (pipelines/infrastructure). The DA repo focuses on **business storytelling, visualization, and stakeholder communication** -- not model building or ETL infrastructure.

## Repository Layout

```
data-analyst/
├── docs/                        # Knowledge base (Obsidian-compatible)
│   ├── workflow/                 # End-to-end analyst workflow guides
│   ├── tools/                   # Power BI, SQL analytics, Python EDA, R stats patterns
│   ├── templates/               # Reusable project README, exec summary, stakeholder brief
│   └── design/                  # Dashboard design principles, chart selection
├── projects/                    # 7 portfolio projects (each self-contained)
│   ├── 00-demo-aestehtics/              # Next.js + Recharts (Airbnb CDMX, zero-backend)
│   ├── 01-insurance-claims-dashboard/   # Next.js + FastAPI + SQL (actuarial domain)
│   ├── 02-ecommerce-cohort-analysis/    # SQL + Python + Next.js (product analyst angle)
│   ├── 03-ab-test-analysis/             # Python + Next.js + FastAPI (statistical rigor)
│   ├── 04-executive-kpi-report/         # Python + Next.js + FastAPI (SaaS KPI automation)
│   ├── 05-financial-portfolio-tracker/  # Next.js + FastAPI + yfinance (finance + analytics)
│   └── 06-operational-efficiency/       # Next.js + D3.js + FastAPI (process optimization)
├── projects/latex-portfolio-deepdive/  # LaTeX deep-dive (see note below)
├── ops/                         # Ops registry + health check script
│   ├── urls.yml                 # SINGLE source of truth for every live URL
│   └── health_check.py          # Local / CI probe of every service
├── scripts/utils/               # Shared Python utilities
└── subagents_outputs/           # Claude Code subagent working files (gitignored)
```

### Project Directory Convention

Every project under `projects/` follows this structure:
```
<project-name>/
├── README.md          # Business question, methodology, findings, recommendations
├── data/raw/          # Original datasets (gitignored if large)
├── data/processed/    # Cleaned data
├── sql/               # SQL queries with comments explaining business context
├── notebooks/         # Numbered: 01_cleaning.ipynb, 02_eda.ipynb, 03_analysis.ipynb
├── dashboards/        # screenshots/ folder for the README and the gallery
├── reports/           # PDF exports, slide decks, executive summaries
└── requirements.txt   # Project-specific dependencies (if different from root)
```

## LaTeX Deep-Dive (`projects/latex-portfolio-deepdive/`)

A 166-page reference document covering all seven projects plus the shared
infrastructure: derivations, decision rationale, and interview-style challenge
questions. It is documentation, not a portfolio project -- it has no dashboard,
no data and no deploy.

```bash
cd projects/latex-portfolio-deepdive
pdflatex -interaction=nonstopmode -halt-on-error main.tex   # twice: TOC + refs
```

**`main.pdf` is committed and must be regenerated whenever the `.tex` changes**,
otherwise the tracked PDF silently disagrees with its own source. Run `pdflatex`
twice -- a single pass leaves the table of contents and cross-references stale.
Build droppings (`*.aux`, `*.log`, `*.toc`, `*.out`) are already gitignored.

A failed compile leaves a corrupt `main.aux` that makes the *next* run report a
wrong page count; delete it before re-running rather than debugging the count.

## Tech Stack

- **SQL** (PostgreSQL dialect, BigQuery where relevant): Primary analysis language. Window functions, CTEs, multi-table joins.
- **Python**: pandas, plotly, seaborn, scipy. For EDA, automation, and the pre-aggregation pipelines behind the dashboards.
- **Next.js + TypeScript**: Primary dashboard framework. Built as static exports and merged into one Cloudflare Pages project, with Recharts/D3.js for visualization.
- **FastAPI**: Backend APIs serving processed data to dashboards. Deployed to Cloud Run as a consolidated service.
- **Jupyter Notebooks**: For reproducible analytical narratives. Write like blog posts with markdown between code.

## Commands

```bash
# Python environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run a Jupyter notebook
jupyter notebook projects/<project>/notebooks/

# Run an R script
Rscript projects/<project>/analysis.R

# Execute SQL against local PostgreSQL
psql -d <database> -f projects/<project>/sql/queries.sql

# Consolidated backend (insurance + olist on single port)
cd backend && bash dev.sh   # serves on port 8080
# /insurance/api/v1/* and /olist/api/v1/*

# Frontend hub: build all six dashboards and merge into dist/
npm run build          # npm ci + next build + merge, per project
npm run build:fast     # skip npm ci (node_modules already present)
npm run preview        # wrangler pages dev -- serves dist/ + functions/
npm run test:e2e       # Playwright against the merged site
npm run typecheck:functions
```

## Consolidated Frontend (the Pages hub)

The seven Next.js dashboards are **one** Cloudflare Pages project, `data-analyst-hub`,
serving `data-analyst.gonor.me`. This mirrors the backend: one service, several
sub-applications under path prefixes.

| Path | Project | Notes |
|------|---------|-------|
| `/` | 00-demo-aestehtics | Owns the root: landing page, `favicon.svg`, `404.html` |
| `/airbnb`, `/olist` | 00-demo-aestehtics | |
| `/insurance` | 01-insurance-claims-dashboard | |
| `/cohorts`, `/cohorts/{retencion,segmentos,geografia,metodologia,notebooks}` | 02-ecommerce-cohort-analysis/**web** | Zero-backend: reads static JSON from `public/cohorts/data/` |
| `/abtest`, `/abtest/notebooks` | 03-ab-test-analysis | |
| `/kpi` | 04-executive-kpi-report | |
| `/portfolio` | 05-financial-portfolio-tracker | |
| `/operations` | 06-operational-efficiency | |
| `/api/<svc>/*` | `functions/api/[[path]].ts` | Proxies to Cloud Run; `<svc>` checked against a fixed list |
| `/ingest/*` | `functions/ingest/[[path]].ts` | Same-origin PostHog proxy |
| *(every request)* | `functions/_middleware.ts` | 301s the bare `data-analyst-hub.pages.dev` apex to `data-analyst.gonor.me`, path and query preserved. Exact hostname match, so `dev.*` and `<hash>.*` previews are untouched and stay testable. |

**How the merge works.** Each app builds with `output: 'export'` (production) and
keeps `rewrites()` for `npm run dev` only — see any `projects/*/next.config.js`.
No `basePath` is needed because each app already namespaces its routes under its
target path. `scripts/build-hub.mjs` merges the seven `out/` trees into `dist/` and
**fails the build** if two apps emit the same path with different content.

Project 02 is the odd one out in two ways, both of which need their own handling:
its Next app lives at `projects/02-ecommerce-cohort-analysis/**web**/` rather than
at the project root (the project also holds notebooks, parquet and the retired
Streamlit app), so `projects/*/…` globs miss it — `deploy-hub.yml` carries
explicit path filters and a second cache-key glob for it. And it has no backend:
its data is committed JSON under `public/cohorts/data/`, which the repo's global
`*.json` ignore rule excluded until `.gitignore` gained an explicit negation.

**Rules when touching a dashboard:**
- Anything in `public/` must live under the app's own slug (`public/kpi/...`),
  never at the root — seven apps share one origin. Only project 00 owns root assets.
- Do not add a root `page.tsx` to projects 01/02/03/04/05/06. `/` belongs to project 00.
- **Charts: ≤3 simultaneous series per chart, or facet into small multiples.** The
  seven `--series-*` hues pass the dataviz validator on *adjacent pairs only* —
  three of them are blues, and `#2563EB`/`#7C3AED` are ΔE 0.4 apart under
  deuteranopia. Validate the exact coexisting set with
  `validate_palette.js "<hex,...>" --pairs all` in both modes before shipping.
  See the comment block atop `projects/02-.../web/src/app/globals.css`.
- Keep fetches on the relative `/api/<svc>` default. Setting `NEXT_PUBLIC_*_API_URL`
  at build time bakes an absolute Cloud Run URL into the bundle and bypasses the
  proxy; `scripts/build-hub.mjs` strips those vars for exactly this reason.
- Server-only Next features (route handlers, `next/headers`, `next/image`,
  `redirect()` in a page) break `output: 'export'`. None are in use today.

## Consolidated Backend

A unified FastAPI entry point at `backend/main.py` mounts all project backends under path prefixes:

| Path prefix | Sub-app | Standalone port |
|-------------|---------|-----------------|
| `/olist` | `olist_backend` (project 00) | 2050 |
| `/insurance` | `insurance_backend` (project 01) | 2051 |
| `/abtest` | `abtest_backend` (project 03) | 2053 |
| `/kpi` | `kpi_backend` (project 04) | 2052 |
| `/portfolio` | `portfolio_backend` (project 05) | 2055 |
| `/ops` | `ops_backend` (project 06) | 2056 |
| `/health` | Status endpoint listing all services | -- |

**Dev modes:**
- **Standalone**: `cd projects/01-.../backend && uvicorn insurance_backend.main:app --port 2051`
- **Consolidated**: `cd backend && bash dev.sh` (port 8080)
- **Docker**: `docker build -f backend/Dockerfile -t da-portfolio-api . && docker run -p 8080:8080 da-portfolio-api`

**Frontend env var adjustment** (no code changes needed). These feed each app's
`rewrites()`, which exists for `npm run dev` only:

| Mode | `INSURANCE_BACKEND_URL` | `OLIST_BACKEND_URL` |
|------|-------------------------|---------------------|
| Standalone | `http://localhost:2051` | `http://localhost:2050` |
| Consolidated | `http://localhost:8080/insurance` | `http://localhost:8080/olist` |

**There is no production row.** A static export has no server to run `rewrites()`,
so in production `/api/<svc>/*` is answered by `functions/api/[[path]].ts`, which
holds the Cloud Run origin itself (`API_ORIGIN`, defaulting to the URL in
`ops/urls.yml`). Setting these variables at build time changes nothing; setting
`NEXT_PUBLIC_*_API_URL` actively breaks the arrangement, which is why
`scripts/build-hub.mjs` strips it.

## Conventions

### Project READMEs
Every project README must follow `docs/templates/project-readme-template.md`:
1. **Business Question** -- 1-2 sentences: what decision does this analysis support?
2. **Key Findings** -- 3-5 bullet points with business impact framing
3. **Data Source** -- Origin, size, time period, limitations
4. **Methodology** -- Tools used, approach chosen, alternatives considered
5. **Results** -- Charts, dashboard screenshots, or links to interactive outputs
6. **Recommendations** -- Actionable next steps, quantified impact where possible
7. **How to Reproduce** -- Steps for anyone to rerun the analysis

### DA Focus (Not DS, Not DE)
- No ML models, neural networks, or complex predictive pipelines (that belongs in `data-science/`)
- No Airflow DAGs, Spark jobs, or infrastructure code (that belongs in `data-enginer/`)
- Statistical methods stay applied: hypothesis testing, confidence intervals, descriptive stats
- Every visualization must pass the "5-second rule" -- main insight visible at a glance
- Every finding must include a "So What?" business interpretation

### Code Style
- **SQL**: CTEs over subqueries, `snake_case` for all identifiers, comment every query block with the business question it answers
- **Python**: Google style docstrings, plotly/seaborn for viz (no raw matplotlib defaults), pandas for tabular work
- **R**: tidyverse style, pipe-forward `|>` syntax
- **Notebooks**: Numbered sequentially (01_, 02_, 03_), markdown cells explaining "why" between code cells

### Visualization Standards
- Consistent color palette across all projects (define in `scripts/utils/theme.py`)
- Every chart must have: title, labeled axes, source annotation, insight annotation
- Prefer: bar charts for comparison, line charts for trends, scatter for relationships
- Avoid: 3D charts, pie charts with >5 slices, rainbow palettes
- Next.js dashboards include an "About / Methodology" page or tab

### Knowledge Base (docs/)
- Obsidian-compatible markdown with `[[wikilinks]]` for cross-references
- YAML frontmatter: `tags`, `status` (draft/review/complete), `created`, `updated`
- Workflow docs focus on the end-to-end process: from stakeholder asks a question to delivering insights
- Differentiated from `data-enginer/docs/`: NO infrastructure, pipelines, or cloud architecture content

### Output Delivery
- Next.js dashboards: Merged into one Cloudflare Pages project at `data-analyst.gonor.me/<path>`. Screenshots in `dashboards/screenshots/`. Live URLs in project README.
- Notebooks: Renderable via nbviewer/GitHub. Include "View on nbviewer" badge in project README.
- Reports: PDF exports in `reports/`, source files (if editable) alongside them.

### Technical Process Page (published notebooks)
Where a dashboard has supporting notebooks, publish them inside it as a browsable
page rather than linking out to GitHub:
1. Convert to HTML: `jupyter nbconvert --to html --output-dir=public/<slug>/notebooks notebooks/*.ipynb`
2. Commit the HTML under the app's own `public/` slug -- seven apps share one origin
3. Render each in an iframe on a "Proceso Técnico" route, one tab per notebook,
   each with a card explaining its inputs and outputs
4. Re-export whenever the notebooks are re-run, so the published outputs match

Projects 02 and 03 both do this. It adds real portfolio value -- viewers see the
code, transformations and intermediate results behind every figure without
leaving the site.

This replaced a Streamlit-specific version of the same pattern
(`streamlit.components.v1.html()` in a `streamlit/notebooks_html/` folder), which
went away with the last Streamlit app.

## Portfolio Project Summaries

| # | Project | Analyst Flavor | Primary Tools | Output Format |
|---|---------|---------------|---------------|---------------|
| 00 | Airbnb CDMX: Market Analysis | Real Estate/Analytics | Next.js, Recharts, Static JSON | Next.js dashboard (zero-backend) |
| 01 | Insurance Claims Dashboard | Financial/Insurance | Next.js, SQL, Python, FastAPI | Next.js dashboard + executive summary |
| 02 | E-Commerce Cohort Analysis | Product/Growth | SQL, Python, Next.js, Recharts | Next.js dashboard (zero-backend) + notebooks |
| 03 | A/B Test Analysis | Product/Growth | Python, Next.js, FastAPI | Next.js dashboard + statistical analysis |
| 04 | Executive KPI Report | Business/General | Python, Next.js, FastAPI | Next.js dashboard + automated PDF reports |
| 05 | Financial Portfolio Tracker | Financial | Python, Next.js, FastAPI | Next.js dashboard + notebooks |
| 06 | Operational Efficiency | Business/General | Next.js, D3.js, FastAPI, Python | Next.js dashboard + analytical notebooks |

## CI/CD & Cloud Run Deployment

### Environments & Branching

Two long-lived branches drive two deployment environments. Both are protected
and require a PR to merge.

| Branch | Environment (GitHub) | Cloudflare Pages | Cloud Run |
|--------|----------------------|------------------|-----------|
| `main` | `production`         | publishes to `data-analyst.gonor.me` | deploys to `da-portfolio-api` / `da-cohort-streamlit` |
| `dev`  | `preview`            | preview deploy (Pages-assigned `*.pages.dev`) | **skipped** — only test job runs |

**Daily flow:**

```
<ddMonth> (e.g. 11abril)  -->  PR  -->  dev  -->  PR  -->  main
   (feature branch,           preview env            production env
    one per day)
```

- Feature branches are named by date (`11abril`, `12abril`, ...). Never push to `main` or `dev` directly; protection will reject it.
- On push to `dev`: the hub deploys as a Pages preview; the API runs tests but does **not** redeploy Cloud Run (keeps one canonical production service to avoid confusion). The cohort redirect only ever deploys from `main` -- there is nothing in it to test.
- On push to `main`: everything deploys to production, same as before.
- The `ops/urls.yml` file is the **single source of truth** for every live URL. Update it when a canonical URL changes (new custom domain, Cloud Run service rename), then workflows and health checks pick it up.

### How It Works

Four workflows: three deploy workflows (path-filtered) and one health-check
cron. The deploy workflows share the `main` / `dev` routing described above.

| Workflow | File | Deploys to | Service/Project |
|----------|------|------------|-----------------|
| API | `deploy-api.yml` | Cloud Run (main only) | `da-portfolio-api` (port 8080) |
| Cohort redirect | `deploy-cohort-redirect.yml` | Cloud Run (main only) | `da-cohort-streamlit` (port 8080) |
| Portfolio Hub | `deploy-hub.yml` | Cloudflare Pages | all six Next.js dashboards, merged |
| Health cron | `ops-health.yml` | -- | curls every URL in `ops/urls.yml` every 6h |

`deploy-hub.yml` replaced six `deploy-frontend-*.yml` workflows. One workflow,
not six, because the dashboards now share a merged `dist/` tree: building only
the project that changed would publish a tree missing the other five.

**Merge behavior**: When a PR merges into `main` or `dev`, GitHub evaluates path filters against *all changed files* in that push. Each workflow is independent; multiple can fire in parallel.

### Architecture

```
Push to main (production)                      Push to dev (preview)
    |                                              |
    v                                              v
GitHub Actions (Workload Identity Federation -- no SA keys)
    |                                              |
    +--> deploy-api.yml ---------> Cloud Run       +--> test job only (no deploy)
    |    (da-portfolio-api, sub-svcs under         |
    |     /olist /insurance /abtest /kpi           |
    |     /portfolio /ops + /health)               |
    |                                              |
    +--> deploy-cohort-redirect --> Cloud Run      +--> (no job: main only)
    |    (da-cohort-streamlit :8080,               |
    |     nginx, 308 -> /cohorts/)                 |
    |                                              |
    +--> deploy-hub.yml --------> Cloudflare       +--> Pages preview
         (data-analyst.gonor.me,   Pages                (*.pages.dev)
          6 dashboards merged
          into one dist/ tree)

Separately, ops-health.yml runs every 6h (schedule cron) + on-demand
(workflow_dispatch). It reads ops/urls.yml, curls each endpoint, writes
a markdown report to $GITHUB_STEP_SUMMARY, and auto-opens/closes a single
"Health alert" issue when services go down or recover.
```

### GCP Resources

- **Project**: `project-ad7a5be2-a1c7-4510-82d` (number: `451451662791`)
- **Region**: `us-central1`
- **Artifact Registry**: `us-central1-docker.pkg.dev/<PROJECT_ID>/da-portfolio-api/`
- **WIF Pool/Provider**: `github-pool` / `github-provider` (scoped to `GonorAndres/data-analyst-path`)
- **Data Bucket**: `gs://da-portfolio-data-assets` -- parquet files downloaded at build time (not committed to git)
- **Service Account**: `github-deployer@<PROJECT_ID>.iam.gserviceaccount.com` (roles: `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`, `storage.objectViewer` on data bucket)

### Data in GCS (not in git)

Parquet data files live in `gs://da-portfolio-data-assets` and are downloaded during CI builds. Workflows pull data before `docker build` so existing Dockerfile `COPY` commands work unchanged.

| GCS path | Local destination | Used by |
|----------|-------------------|---------|
| `olist-backend/*` | `projects/00-demo-aestehtics/backend/data/` | API (olist) |
| `insurance-processed/*` | `projects/01-insurance-claims-dashboard/data/processed/` | API (insurance) |
| `cohort-processed/*` | `projects/02-ecommerce-cohort-analysis/data/processed/` | project 02's local pipeline only -- no CI job pulls it since the Streamlit service was retired |

To update data: `gcloud storage cp <local-file> gs://da-portfolio-data-assets/<prefix>/` then re-trigger the workflow.

### GitHub Secrets (already configured)

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | `project-ad7a5be2-a1c7-4510-82d` |
| `GCP_WIF_PROVIDER` | `projects/451451662791/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-deployer@project-ad7a5be2-a1c7-4510-82d.iam.gserviceaccount.com` |
| `CLOUDFLARE_ACCOUNT_ID` | `9e88860c389c87f4ec09baa1e9675a61` |
| `CLOUDFLARE_API_TOKEN` | API token with **Cloudflare Pages: Edit** on this account |

The Vercel secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`) are no longer read by any
workflow. Leave them until the Vercel projects are decommissioned, then remove.

### Adding a New Service

To deploy a new project to Cloud Run:
1. Create a `Dockerfile` in the project folder (build context is repo root)
2. Copy `deploy-api.yml`, change `SERVICE_NAME`, `paths`, Dockerfile path, and port
3. Push to the same Artifact Registry repo (`da-portfolio-api`) -- no new GCP setup needed

### Dockerfiles

| Service | Dockerfile | Build context | Port |
|---------|-----------|---------------|------|
| Consolidated API | `backend/Dockerfile` | repo root | 8080 |
| Cohort redirect | `ops/cohort-redirect/Dockerfile` | `ops/cohort-redirect` | 8080 |

The API Dockerfile uses repo root as build context (run `docker build -f <path> .`
from root). The redirect image is self-contained and builds from its own folder.

`projects/02-ecommerce-cohort-analysis/Dockerfile` still builds the retired
Streamlit app. No workflow references it; it is kept alongside `streamlit/` as a
record of the first implementation.

### Health Monitoring

`.github/workflows/ops-health.yml` runs on a 6-hour cron (plus
`workflow_dispatch` for on-demand runs). It:

1. Reads every service from `ops/urls.yml` (the URL registry).
2. `GET`s the production URL + `health_path` for each, retrying once on
   timeout so Cloud Run cold starts don't trigger false negatives.
3. Writes a markdown health table to `$GITHUB_STEP_SUMMARY` (visible in
   the Actions run UI).
4. Auto-opens a single issue titled `Health alert: DA portfolio service(s)
   down` when anything fails, and auto-closes it when everything is green
   again. One issue total, not one per run — no inbox spam.

When a URL changes (new custom domain, Pages project rename, etc.), update
`ops/urls.yml` first; the health cron and any workflow that reads the
registry will pick up the change on the next run.

Local probe (no CI):

```bash
pip install pyyaml
python3 ops/health_check.py
```

## Production & Quality Standards

- Every deployed Next.js dashboard must include an **About / Methodology** page or tab surfacing data sources, transformations, choices made, and limitations
- Every project README must include a **Decisions & Trade-offs** table: what was chosen, alternatives considered, and why
- Tests are mandatory: at minimum backend health tests + data pipeline tests per project
- CI must include lint (ruff) + test (pytest) workflow, not just deploy workflows. Green CI badge required on root README.

## E2E Deploy Gate Tests (`e2e/`)

Playwright tests that run **before** every deploy. They verify the frontend builds and serves correctly **without a backend**.

**Architecture:**
- Root `package.json` provides `@playwright/test`, `wrangler`, and `typescript` -- do not add app deps here
- **One config**, `e2e/hub.config.ts`, runs every spec against the merged `dist/`. The six per-project configs are gone along with their ports; they existed only because each dashboard had its own Vercel deployment.
- The server is `wrangler pages dev`, not a static file server, so the tests see the runtime that actually serves production: Pages URL semantics (trailing slashes, `.html` stripping) and the Functions in `functions/`.
- There is no longer a second config. `e2e/ecommerce-cohorts.{config,spec}.ts` covered the Streamlit app on Cloud Run; that app was rebuilt into the hub at `/cohorts`, so its specs went with it and `hub.config.ts` no longer needs a `testIgnore`.
- `e2e/hub.spec.ts` gates what the per-dashboard specs structurally cannot see: that all six live on one origin, each keeps its own favicon, and no two share a PostHog `app_id`.

**Key constraints (things that broke before):**
- Tests must NOT assert on backend-dependent data (KPI values, API responses). No backend runs in CI.
- Use `{ exact: true }` or `getByRole()` to avoid Playwright strict mode violations when text appears multiple times
- Spanish accented characters (`a` vs `a`) don't match in regex -- use actual accents or match by role
- Paths are built with `trailingSlash: true`. `/insurance` answers 308 and only `/insurance/` is a 200 -- matters for any check that asserts a strict status code, including `ops/urls.yml` sub_services.
- API test job uses `curl ... || true` in retry loops to prevent `set -e` from aborting on connection refused
- `/` is project 00's landing page, not a redirect. Specs must not assert that `/` bounces to a dashboard -- that was true only when each app owned a Vercel root.
- **`webServer.cwd` must stay pinned to the repo root.** Playwright defaults it to the config file's directory (`e2e/`), and wrangler resolves `functions/` relative to its working directory -- so it silently serves `dist/` with no Functions, every `/api/*` and `/ingest/*` 404s into the HTML SPA fallback, and the only visible symptom is a browser console error about `array.js` having MIME type `text/html`. It stays hidden locally whenever a manually started server (launched from the root, with Functions) is already on port 4173.
- `webServer.url` points at `/health`, a Function, not `/`. Static assets answer before the Functions bundle is ready, so probing `/` declares the server up while the routes half these specs rely on are still 404ing.
- Node 22+ is required (`engines` in the root `package.json`). wrangler 4.123 refuses to start on Node 20, which takes `wrangler pages dev` -- and therefore the whole gate -- down with it.

**When to update `e2e/*.spec.ts`:**
- You rename or remove a heading, route, or tab button that a test checks
- You add a new critical route worth gating deploys on
- You do NOT need to update tests for additions (new charts, sections, etc.)

## Cross-Project Integration

This repo links to but does not duplicate work from:
- `~/portafolio/` -- Astro portfolio website. Each project here should have a companion entry there.
- `~/data-science/` -- ML-focused projects. If analysis here surfaces a prediction use case, note it as "next steps" and point to data-science repo.
- `~/data-enginer/` -- Pipeline projects. If a project here needs infrastructure context, reference the relevant data-enginer doc.
