# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Comprehensive **Data Analyst portfolio and knowledge base** for an actuarial science graduate (UNAM, Mexico) targeting hybrid DA roles (business/financial/product analyst). The repo combines:
- **6 end-to-end portfolio projects** spanning insurance, e-commerce, finance, and operations domains
- **Knowledge base** documenting the full analyst workflow (stakeholder question -> delivered insights)
- **Multiple output formats**: Power BI dashboards (.pbix + PBI Service links), Streamlit apps, Jupyter notebooks, automated PDF reports, executive slide decks

This repo is distinct from sibling repos: `data-science/` (ML/predictive modeling) and `data-enginer/` (pipelines/infrastructure). The DA repo focuses on **business storytelling, visualization, and stakeholder communication** -- not model building or ETL infrastructure.

## Repository Layout

```
data-analyst/
├── docs/                        # Knowledge base (Obsidian-compatible)
│   ├── workflow/                 # End-to-end analyst workflow guides
│   ├── tools/                   # Power BI, SQL analytics, Python EDA, R stats patterns
│   ├── templates/               # Reusable project README, exec summary, stakeholder brief
│   └── design/                  # Dashboard design principles, chart selection
├── projects/                    # 6 portfolio projects (each self-contained)
│   ├── 01-insurance-claims-dashboard/   # Power BI + SQL (actuarial domain)
│   ├── 02-ecommerce-cohort-analysis/    # SQL + Python (product analyst angle)
│   ├── 03-ab-test-analysis/             # R + Python (statistical rigor)
│   ├── 04-executive-kpi-report/         # Automated reporting (Python + Power BI)
│   ├── 05-financial-portfolio-tracker/  # Streamlit app (finance + analytics)
│   └── 06-operational-efficiency/       # SQL + Power BI (process optimization)
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
- **R**: tidyverse, ggplot2, broom. For statistical testing and actuarial-adjacent work.
- **Power BI**: Primary BI tool. .pbix files in repo + published to Power BI Service for interactive viewing.
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

A unified FastAPI entry point at `backend/main.py` mounts both project backends under path prefixes:

| Path prefix | Sub-app | Standalone port |
|-------------|---------|-----------------|
| `/insurance` | `insurance_backend` (project 01) | 2051 |
| `/olist` | `olist_backend` (project 00) | 2050 |

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
- Power BI dashboards include a "How to Read This Dashboard" text box

### Knowledge Base (docs/)
- Obsidian-compatible markdown with `[[wikilinks]]` for cross-references
- YAML frontmatter: `tags`, `status` (draft/review/complete), `created`, `updated`
- Workflow docs focus on the end-to-end process: from stakeholder asks a question to delivering insights
- Differentiated from `data-enginer/docs/`: NO infrastructure, pipelines, or cloud architecture content

### Output Delivery
- Power BI: .pbix files committed + screenshots in `dashboards/screenshots/` + PBI Service publish links in `dashboards/README.md`
- Streamlit: App code in project's `streamlit/` folder, deployed to Streamlit Cloud when polished
- Notebooks: Renderable via nbviewer/GitHub. Include "View on nbviewer" badge in project README
- Reports: PDF exports in `reports/`, source files (if editable) alongside them

## Portfolio Project Summaries

| # | Project | Analyst Flavor | Primary Tools | Output Format |
|---|---------|---------------|---------------|---------------|
| 01 | Insurance Claims Dashboard | Financial/Insurance | Next.js, SQL, Python | Next.js dashboard + executive summary |
| 02 | E-Commerce Cohort Analysis | Product/Growth | SQL, Python, Streamlit | Jupyter notebook + Streamlit app |
| 03 | A/B Test Analysis | Product/Growth | R, Python | R Markdown + Jupyter notebook |
| 04 | Executive KPI Report | Business/General | Python, Power BI | Automated PDF + Power BI dashboard |
| 05 | Financial Portfolio Tracker | Financial | Python, Streamlit | Streamlit app + notebook |
| 06 | Operational Efficiency | Business/General | SQL, Power BI | Power BI dashboard + exec summary slides |

## CI/CD & Cloud Run Deployment

### How It Works

Two GitHub Actions workflows auto-deploy on push to `main`, each with **path filters** so they only run when relevant files change:

| Workflow | File | Triggers on | Deploys | Cloud Run Service |
|----------|------|-------------|---------|-------------------|
| API | `.github/workflows/deploy-api.yml` | `backend/**`, project 00/01 backends + data | Consolidated FastAPI (insurance + olist) | `da-portfolio-api` (port 8080) |
| Streamlit | `.github/workflows/deploy-streamlit.yml` | `projects/02-*/streamlit/**`, data, requirements, Dockerfile | Cohort Analysis dashboard | `da-cohort-streamlit` (port 8501) |

**Merge behavior**: When a branch merges into `main`, GitHub evaluates path filters against *all changed files* in that push. If the merge touches both `backend/` and `projects/02-*/streamlit/`, both workflows fire in parallel. Each workflow is independent.

### Architecture

```
Push to main
    |
    v
GitHub Actions (Workload Identity Federation -- no SA keys)
    |
    +--> deploy-api.yml -----> Artifact Registry --> Cloud Run (da-portfolio-api)
    |                                                  /insurance/*  /olist/*
    |
    +--> deploy-streamlit.yml -> Artifact Registry --> Cloud Run (da-cohort-streamlit)
                                                       Streamlit app on :8501
```

### GCP Resources

- **Project**: `project-ad7a5be2-a1c7-4510-82d` (number: `451451662791`)
- **Region**: `us-central1`
- **Artifact Registry**: `us-central1-docker.pkg.dev/<PROJECT_ID>/da-portfolio-api/`
- **WIF Pool/Provider**: `github-pool` / `github-provider` (scoped to `GonorAndres/data-analyst-path`)
- **Service Account**: `github-deployer@<PROJECT_ID>.iam.gserviceaccount.com` (roles: `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`)

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

## Cross-Project Integration

This repo links to but does not duplicate work from:
- `~/portafolio/` -- Astro portfolio website. Each project here should have a companion entry there.
- `~/data-science/` -- ML-focused projects. If analysis here surfaces a prediction use case, note it as "next steps" and point to data-science repo.
- `~/data-enginer/` -- Pipeline projects. If a project here needs infrastructure context, reference the relevant data-enginer doc.
