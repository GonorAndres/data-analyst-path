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
```

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
| 01 | Insurance Claims Dashboard | Financial/Insurance | Power BI, SQL, Python | .pbix + PBI Service + screenshots |
| 02 | E-Commerce Cohort Analysis | Product/Growth | SQL, Python, Streamlit | Jupyter notebook + Streamlit app |
| 03 | A/B Test Analysis | Product/Growth | R, Python | R Markdown + Jupyter notebook |
| 04 | Executive KPI Report | Business/General | Python, Power BI | Automated PDF + Power BI dashboard |
| 05 | Financial Portfolio Tracker | Financial | Python, Streamlit | Streamlit app + notebook |
| 06 | Operational Efficiency | Business/General | SQL, Power BI | Power BI dashboard + exec summary slides |

## Cross-Project Integration

This repo links to but does not duplicate work from:
- `~/portafolio/` -- Astro portfolio website. Each project here should have a companion entry there.
- `~/data-science/` -- ML-focused projects. If analysis here surfaces a prediction use case, note it as "next steps" and point to data-science repo.
- `~/data-enginer/` -- Pipeline projects. If a project here needs infrastructure context, reference the relevant data-enginer doc.
