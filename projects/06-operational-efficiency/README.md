# Eficiencia Operacional NYC 311

> **Analyst Flavor:** Business/Operations | **Tools:** Next.js, D3.js, FastAPI, Python | **Status:** Active

## Business Question

Where are the bottlenecks in NYC's 311 service request pipeline, which agencies consistently miss SLA targets, and what resource allocation changes could improve resolution times -- enabling city operations managers to prioritize improvement initiatives?

## Key Findings

1. **SLA Compliance**: Overall compliance rate calculated across all agencies with defined SLAs, with significant variance between agencies
2. **Pareto Concentration**: A small fraction of complaint types generates ~80% of total volume -- targeting these yields outsized operational gains
3. **Bottleneck Detection**: Specific agency + complaint type combinations show resolution times 3-5x the city median
4. **Geographic Patterns**: Borough-level analysis reveals differential service quality across NYC's five boroughs
5. **Temporal Patterns**: Clear day-of-week and hourly seasonality in request volume, with implications for staffing

## Data Source

- **NYC 311 Service Requests** (2024): ~3.5M rows from NYC Open Data via Socrata SODA API
- **Dataset**: `erm2-nwe9` on `data.cityofnewyork.us`
- **Period**: January 1 -- December 31, 2024
- **Key columns**: created_date, closed_date, due_date, agency, complaint_type, borough, status, resolution_description

## Methodology

### Data Pipeline (3-stage ETL)
1. **Download** (`data-pipeline/01_download.py`): Socrata API pagination, 50K rows/page
2. **Clean** (`data-pipeline/02_clean.py`): Date parsing, deduplication, anomaly fixes
3. **Enrich** (`data-pipeline/03_enrich.py`): Resolution times, SLA flags, process stages, temporal features

### Backend (FastAPI)
- Pure analytics engine (`ops_engine.py`) with 11 functions
- 6 API endpoints: overview, bottleneck, departments, geographic, trends, pareto
- 5-dimension filtering: agency, complaint type, borough, channel, month

### Frontend (Next.js 14 + D3.js)
- Bloomberg Terminal / Ops Center dark theme
- 6 custom D3 visualizations: Sankey flow, choropleth map, gauge charts, Pareto chart, heatmaps, seasonality grid
- 7 dashboard tabs including embedded Jupyter notebooks ("Proceso Tecnico")

### Analytical Notebooks (4 notebooks)
1. Ingesta y limpieza
2. Analisis exploratorio (EDA)
3. Analisis de cumplimiento SLA con pruebas estadisticas
4. Mineria de procesos y deteccion de cuellos de botella

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, D3.js, Tailwind CSS, Framer Motion, SWR |
| Backend | FastAPI, pandas, numpy, scipy |
| Data | Socrata SODA API, Parquet (PyArrow) |
| Notebooks | Jupyter, plotly, scikit-learn |

## How to Reproduce

### 1. Data Pipeline
```bash
cd data-pipeline
python 01_download.py    # Downloads ~3.5M rows from NYC Open Data (~10 min)
python 02_clean.py       # Cleans and deduplicates -> parquet
python 03_enrich.py      # Adds resolution times, SLA flags, process stages
```

### 2. Backend
```bash
cd backend
uvicorn ops_backend.main:app --port 2056 --reload
# Verify: curl http://localhost:2056/health
```

### 3. Notebooks (optional)
```bash
# Execute and convert to HTML for dashboard embedding
jupyter nbconvert --execute --to html --output-dir=public/notebooks_html notebooks/*.ipynb
```

### 4. Frontend
```bash
npm install
npm run dev
# Open http://localhost:3056/operations
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `OPS_BACKEND_URL` | `http://localhost:2056` | Backend API URL (Next.js rewrite) |
| `NEXT_PUBLIC_OPS_API_URL` | `/api/ops` | Client-side API base |

## Skills Demonstrated

- Process mining and bottleneck identification (Sankey flow analysis)
- SLA compliance analysis with statistical testing (z-tests, Bonferroni correction)
- Pareto analysis (80/20 rule) for operational prioritization
- Custom D3.js data visualizations (not off-the-shelf chart libraries)
- Full-stack development: Next.js + FastAPI + pandas pipeline
- Bloomberg Terminal-inspired dark UI design
- Geographic analysis with choropleth mapping
