# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Comprehensive **Data Analyst portfolio and knowledge base** for an actuarial science graduate (UNAM, Mexico) targeting hybrid DA roles (business/financial/product analyst). The repo combines:
- **7 end-to-end portfolio projects** spanning real estate, insurance, e-commerce, finance, and operations domains
- **Knowledge base** documenting the full analyst workflow (stakeholder question -> delivered insights)
- **Multiple output formats**: Next.js interactive dashboards (Vercel), Streamlit apps (Cloud Run), Jupyter notebooks, automated PDF reports

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
│   ├── 02-ecommerce-cohort-analysis/    # SQL + Python + Streamlit (product analyst angle)
│   ├── 03-ab-test-analysis/             # Python + Next.js + FastAPI (statistical rigor)
│   ├── 04-executive-kpi-report/         # Python + Next.js + FastAPI (SaaS KPI automation)
│   ├── 05-financial-portfolio-tracker/  # Next.js + FastAPI + yfinance (finance + analytics)
│   └── 06-operational-efficiency/       # Next.js + D3.js + FastAPI (process optimization)
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
├── dashboards/        # .pbix files + screenshots/ folder + PBI Service links
├── reports/           # PDF exports, slide decks, executive summaries
├── streamlit/         # Streamlit app code (where applicable)
└── requirements.txt   # Project-specific dependencies (if different from root)
```

## Tech Stack

- **SQL** (PostgreSQL dialect, BigQuery where relevant): Primary analysis language. Window functions, CTEs, multi-table joins.
- **Python**: pandas, plotly, seaborn, scipy, streamlit. For EDA, automation, and interactive apps.
- **Next.js + TypeScript**: Primary dashboard framework. Deployed to Vercel with Recharts/D3.js for visualization.
- **FastAPI**: Backend APIs serving processed data to dashboards. Deployed to Cloud Run as a consolidated service.
- **Jupyter Notebooks**: For reproducible analytical narratives. Write like blog posts with markdown between code.

## Commands

```bash
# Python environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run a Jupyter notebook
jupyter notebook projects/<project>/notebooks/

# Run a Streamlit app
streamlit run projects/<project>/streamlit/app.py

# Run an R script
Rscript projects/<project>/analysis.R

# Execute SQL against local PostgreSQL
psql -d <database> -f projects/<project>/sql/queries.sql

# Consolidated backend (insurance + olist on single port)
cd backend && bash dev.sh   # serves on port 8080
# /insurance/api/v1/* and /olist/api/v1/*
```

## Consolidated Backend

A unified FastAPI entry point at `backend/main.py` mounts all project backends under path prefixes:

| Path prefix | Sub-app | Standalone port |
|-------------|---------|-----------------|
| `/olist` | `olist_backend` (project 00) | 2050 |
| `/insurance` | `insurance_backend` (project 01) | 2051 |
| `/abtest` | `abtest_backend` (project 03) | 2053 |
| `/kpi` | `kpi_backend` (project 04) | 2054 |
| `/portfolio` | `portfolio_backend` (project 05) | 2055 |
| `/ops` | `ops_backend` (project 06) | 2056 |
| `/health` | Status endpoint listing all services | -- |

**Dev modes:**
- **Standalone**: `cd projects/01-.../backend && uvicorn insurance_backend.main:app --port 2051`
- **Consolidated**: `cd backend && bash dev.sh` (port 8080)
- **Docker**: `docker build -f backend/Dockerfile -t da-portfolio-api . && docker run -p 8080:8080 da-portfolio-api`

**Frontend env var adjustment** (no code changes needed):
| Mode | `INSURANCE_BACKEND_URL` | `OLIST_BACKEND_URL` |
|------|-------------------------|---------------------|
| Standalone | `http://localhost:2051` | `http://localhost:2050` |
| Consolidated | `http://localhost:8080/insurance` | `http://localhost:8080/olist` |
| Production | `https://da-api-xxx.run.app/insurance` | `https://da-api-xxx.run.app/olist` |

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
- Next.js dashboards: Deployed to Vercel. Screenshots in `dashboards/screenshots/`. Live URLs in project README.
- Streamlit: App code in project's `streamlit/` folder, deployed to Cloud Run.
- Notebooks: Renderable via nbviewer/GitHub. Include "View on nbviewer" badge in project README.
- Reports: PDF exports in `reports/`, source files (if editable) alongside them.

### Technical Process Page (Notebook-in-Streamlit Pattern)
For Streamlit projects with supporting Jupyter notebooks, embed the full analytical pipeline as a browsable page inside the dashboard:
1. Convert notebooks to HTML: `jupyter nbconvert --to html --output-dir=streamlit/notebooks_html notebooks/*.ipynb`
2. Store HTML files in `streamlit/notebooks_html/` (committed to git, included in Docker image)
3. Create a "Proceso Técnico" page that renders each notebook in a scrollable `streamlit.components.v1.html()` iframe
4. Each tab shows one notebook with a description card explaining inputs/outputs
5. Re-export HTML whenever notebooks are re-run to keep outputs fresh
6. Update `.dockerignore` with `!**/notebooks_html` if `**/notebooks` is ignored

This pattern adds significant portfolio value -- viewers see the full code, transformations, and intermediate results behind every dashboard visualization without leaving the app.

## Portfolio Project Summaries

| # | Project | Analyst Flavor | Primary Tools | Output Format |
|---|---------|---------------|---------------|---------------|
| 00 | Airbnb CDMX: Market Analysis | Real Estate/Analytics | Next.js, Recharts, Static JSON | Next.js dashboard (zero-backend) |
| 01 | Insurance Claims Dashboard | Financial/Insurance | Next.js, SQL, Python, FastAPI | Next.js dashboard + executive summary |
| 02 | E-Commerce Cohort Analysis | Product/Growth | SQL, Python, Streamlit | Jupyter notebook + Streamlit app |
| 03 | A/B Test Analysis | Product/Growth | Python, Next.js, FastAPI | Next.js dashboard + statistical analysis |
| 04 | Executive KPI Report | Business/General | Python, Next.js, FastAPI | Next.js dashboard + automated PDF reports |
| 05 | Financial Portfolio Tracker | Financial | Python, Next.js, FastAPI | Next.js dashboard + notebooks |
| 06 | Operational Efficiency | Business/General | Next.js, D3.js, FastAPI, Python | Next.js dashboard + analytical notebooks |

## CI/CD & Cloud Run Deployment

### How It Works

Eight GitHub Actions workflows auto-deploy on push to `main`, each with **path filters** so they only run when relevant files change:

| Workflow | File | Deploys to | Service/Project |
|----------|------|------------|-----------------|
| API | `deploy-api.yml` | Cloud Run | `da-portfolio-api` (port 8080) |
| Streamlit | `deploy-streamlit.yml` | Cloud Run | `da-cohort-streamlit` (port 8501) |
| Demo Aesthetics | `deploy-frontend-demo-aesthetics.yml` | Vercel | Project 00 frontend |
| Insurance Claims | `deploy-frontend-insurance.yml` | Vercel | Project 01 frontend |
| A/B Test | `deploy-frontend-abtest.yml` | Vercel | Project 03 frontend |
| Executive KPI | `deploy-frontend-kpi.yml` | Vercel | Project 04 frontend |
| Portfolio Tracker | `deploy-frontend-portfolio.yml` | Vercel | Project 05 frontend |
| Ops Efficiency | `deploy-frontend-ops.yml` | Vercel | Project 06 frontend |

**Merge behavior**: When a branch merges into `main`, GitHub evaluates path filters against *all changed files* in that push. If the merge touches both `backend/` and `projects/02-*/streamlit/`, both workflows fire in parallel. Each workflow is independent.

### Architecture

```
Push to main
    |
    v
GitHub Actions (Workload Identity Federation -- no SA keys)
    |
    +--> deploy-api.yml ---------> Artifact Registry --> Cloud Run (da-portfolio-api)
    |                                                      /olist/* /insurance/* /abtest/*
    |                                                      /kpi/*  /portfolio/* /ops/*
    |
    +--> deploy-streamlit.yml ---> Artifact Registry --> Cloud Run (da-cohort-streamlit)
    |                                                      Streamlit app on :8501
    |
    +--> deploy-frontend-*.yml --> Vercel (6 Next.js dashboards)
                                     projects 00, 01, 03, 04, 05, 06
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
| `cohort-processed/*` | `projects/02-ecommerce-cohort-analysis/data/processed/` | Streamlit |

To update data: `gcloud storage cp <local-file> gs://da-portfolio-data-assets/<prefix>/` then re-trigger the workflow.

### GitHub Secrets (already configured)

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | `project-ad7a5be2-a1c7-4510-82d` |
| `GCP_WIF_PROVIDER` | `projects/451451662791/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-deployer@project-ad7a5be2-a1c7-4510-82d.iam.gserviceaccount.com` |

### Adding a New Service

To deploy a new project to Cloud Run:
1. Create a `Dockerfile` in the project folder (build context is repo root)
2. Copy `deploy-streamlit.yml`, change `SERVICE_NAME`, `paths`, Dockerfile path, and port
3. Push to the same Artifact Registry repo (`da-portfolio-api`) -- no new GCP setup needed

### Dockerfiles

| Service | Dockerfile | Build context | Port |
|---------|-----------|---------------|------|
| Consolidated API | `backend/Dockerfile` | repo root | 8080 |
| Cohort Streamlit | `projects/02-ecommerce-cohort-analysis/Dockerfile` | repo root | 8501 |

Both Dockerfiles use repo root as build context (run `docker build -f <path> .` from root).

## Production & Quality Standards

- Every deployed Next.js dashboard must include an **About / Methodology** page or tab surfacing data sources, transformations, choices made, and limitations
- Every project README must include a **Decisions & Trade-offs** table: what was chosen, alternatives considered, and why
- Tests are mandatory: at minimum backend health tests + data pipeline tests per project
- CI must include lint (ruff) + test (pytest) workflow, not just deploy workflows. Green CI badge required on root README.

## E2E Deploy Gate Tests (`e2e/`)

Playwright tests that run **before** every deploy. They verify the frontend builds and serves correctly **without a backend**.

**Architecture:**
- Root `package.json` exists solely to provide `@playwright/test` -- do not add app deps here
- Each project has its own config in `e2e/<name>.config.ts` with the correct `baseURL` port
- Ports must match `package.json` start scripts: P00/P01=3000, P03=3053, P04=3052, P05=3055, P06=3056, P02=8501

**Key constraints (things that broke before):**
- Tests must NOT assert on backend-dependent data (KPI values, API responses). No backend runs in CI.
- Use `{ exact: true }` or `getByRole()` to avoid Playwright strict mode violations when text appears multiple times
- Spanish accented characters (`a` vs `a`) don't match in regex -- use actual accents or match by role
- `wait-on` uses `tcp:` protocol (not `http://`) to avoid false timeouts from SSR pages returning non-200 without backend
- Post-deploy verification accepts 200, 401, or 308 (Vercel Deployment Protection returns 401 on non-main branches)
- API test job uses `curl ... || true` in retry loops to prevent `set -e` from aborting on connection refused

**When to update `e2e/*.spec.ts`:**
- You rename or remove a heading, route, or tab button that a test checks
- You add a new critical route worth gating deploys on
- You do NOT need to update tests for additions (new charts, sections, etc.)

## Cross-Project Integration

This repo links to but does not duplicate work from:
- `~/portafolio/` -- Astro portfolio website. Each project here should have a companion entry there.
- `~/data-science/` -- ML-focused projects. If analysis here surfaces a prediction use case, note it as "next steps" and point to data-science repo.
- `~/data-enginer/` -- Pipeline projects. If a project here needs infrastructure context, reference the relevant data-enginer doc.
