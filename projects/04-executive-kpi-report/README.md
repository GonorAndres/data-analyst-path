# 04 -- Executive KPI Report: Automated SaaS Metrics Dashboard

> **Analyst Flavor:** Business/General | **Tools:** Python, Next.js, FastAPI | **Status:** Complete

**Live demo:** [executive-kpi-report.vercel.app](https://executive-kpi-report.vercel.app)

## Business Question

**How can a data analyst build an end-to-end executive reporting system that tracks SaaS business health, flags anomalies automatically, forecasts key metrics, and generates bilingual PDF reports -- replacing manual Excel-based reporting?**

This project simulates the work a data analyst would do at a mid-market B2B SaaS company: building a real-time KPI dashboard, setting up anomaly detection, producing time-series forecasts, and automating PDF executive reports -- all from raw data to production-ready deliverables.

## Key Findings

- **MRR grew from $420K to approximately $700K+ over 24 months** (Jan 2024 -- Dec 2025), with a decelerating growth rate that mirrors typical SaaS scaling curves (from ~4% MoM early to ~1.5% MoM later).
- **Two narrative events drive the most interesting analytics**: a Q3 2024 pricing-change churn spike (logo churn spiked ~2% above baseline, NPS dropped ~10 points) and a Q2 2025 product launch boost (new MRR +40%, expansion MRR +70%, CAC improved via inbound). The anomaly detection system correctly flags both events.
- **Enterprise segment generates ~45% of MRR from only ~15% of customers**, producing an NRR above 110% -- the classic "land and expand" pattern. Starter segment shows NRR below 100%, flagging it as a net-negative retention tier.
- **Holt-Winters exponential smoothing is the right model for 24 data points** -- complex models (ARIMA, Prophet) overfit. The 95% confidence intervals are wide, and that honesty is the correct analytical answer given the limited history.
- **Composite health score (0--100) weighting six dimensions** (MRR growth 20%, NRR 20%, churn 15%, NPS 15%, Rule of 40 15%, LTV:CAC 15%) provides a single executive-readable signal that synthesizes 12 underlying KPIs.

## Data Source

| Attribute | Value |
|-----------|-------|
| **Source** | Synthetic dataset generated programmatically (`data-pipeline/01_generate_saas_data.py`) |
| **Company** | NovaCRM -- fictional mid-market B2B SaaS ($5M--$12M ARR range) |
| **Period** | January 2024 -- December 2025 (24 months) |
| **Size** | 24 monthly rows + 72 segment rows (3 segments x 24 months), 30+ metrics per row |
| **Segments** | Starter (55% of customers, 15% of MRR), Professional (30% / 40%), Enterprise (15% / 45%) |
| **Granularity** | Monthly, with per-segment breakdowns |
| **Reproducibility** | Seeded via `np.random.default_rng(42)` |
| **Limitations** | Synthetic data cannot capture real-world correlations between macroeconomic conditions and SaaS churn. No public dataset exists with real SaaS operational metrics (MRR, churn, NPS, CAC) -- industry benchmarks (OpenView, SaaStr) are published only as aggregated statistics, not row-level time series. |

## Methodology

### Tools

- **Python** (pandas, numpy, scipy, statsmodels, fpdf2, plotly, kaleido): Data generation, KPI computation, anomaly detection, forecasting, PDF report generation
- **FastAPI**: Backend API with 6 routers (overview, revenue, customers, forecast, anomalies, report)
- **Next.js 14 + TypeScript + Tailwind CSS + Recharts**: Interactive dashboard with dark/light mode
- **Jinja2**: Bilingual report templates for executive summary and recommendations sections
- **SWR + Framer Motion**: Data fetching with caching and animated transitions

### Approach

1. **Data generation** (`01_generate_saas_data.py`): Built a SaaS metric simulator producing monthly_metrics.parquet (24 rows x 30 cols) and segment_metrics.parquet (72 rows x 30 cols). Metrics include MRR, ARR, NRR, logo/revenue churn, NPS, CAC, LTV, DAU/MAU, support tickets, gross margin, burn rate, runway, and Rule of 40. Two embedded narrative events create ground truth for anomaly detection validation.

2. **KPI computation** (`02_compute_kpis.py`): Derived MoM and YoY percent changes, rolling 3-month and 6-month averages, z-scores against trailing 6-month windows, traffic-light statuses (green/yellow/red vs configurable targets), and a weighted composite health score (0--100) for all 25 key metrics.

3. **Anomaly detection** (`analytics_engine.py`): Dual-method approach using z-score (parametric, good for normally distributed metrics) and IQR (non-parametric, robust to outliers). Anomalies classified as critical (|z| > 3), warning (|z| > 2), or info. The system correctly flags the Q3 2024 churn spike and Q2 2025 product launch as unusual events.

4. **Forecasting** (`analytics_engine.py`): Holt-Winters exponential smoothing with additive trend via statsmodels, falling back to simple exponential smoothing if unavailable. 6-month horizon with 95% confidence intervals that widen with forecast horizon. Applied to MRR, ARR, NRR, logo churn, NPS, and CAC.

5. **Automated commentary** (`commentary.py`): Template-based bilingual (EN/ES) natural-language generation producing executive summaries, revenue analysis, customer health narratives, and anomaly explanations from structured data. Tone adapts to metric values (e.g., "strong" vs "concerning" based on health score thresholds).

6. **PDF report generation** (`report_generator.py`): Multi-section executive PDF using fpdf2 with cover page, executive summary, KPI dashboard table (with traffic-light status colors), revenue analysis with MRR waterfall chart (plotly-to-PNG via kaleido), customer health, anomaly alerts table, forecast section, and data-driven recommendations. Available in English and Spanish.

7. **Interactive dashboard** (Next.js): 8-tab interface (About, Overview, Revenue, Customers, Forecast, Anomalies, Report, Technical) with segment/date/comparison filters, sparklines on every KPI card, and embedded Jupyter notebook HTML for full analytical transparency.

### Alternatives Considered

| Decision | Chosen | Alternatives | Why |
|----------|--------|-------------|-----|
| Forecasting model | Holt-Winters (additive trend) | ARIMA, Prophet, LSTM | Only 24 monthly data points -- complex models overfit; Holt-Winters is simple and interpretable |
| Anomaly detection | Z-score + IQR dual method | Isolation Forest, DBSCAN | Statistical methods are transparent and explainable to executives; ML methods are overkill for monthly KPI data |
| PDF generation | fpdf2 + plotly/kaleido charts | ReportLab, WeasyPrint, LaTeX | fpdf2 is lightweight with fine layout control; plotly integration gives publication-quality charts |
| NLG commentary | Template-based f-string logic | LLM-generated, rule-based NLG | Templates are deterministic, auditable, and do not require API calls; appropriate for standardized reports |
| Frontend framework | Next.js + Recharts | Streamlit, Dash | Full control over UI/UX, dark/light mode, bilingual support, and deployment to Vercel |
| Data source | Synthetic with seeded RNG | Public datasets | No public SaaS operational dataset exists with MRR, churn, NPS, CAC at row level |

## Results

### Interactive Dashboard

The dashboard at [executive-kpi-report.vercel.app](https://executive-kpi-report.vercel.app) provides:

- **Overview tab**: Composite health score (0--100), 12 KPI cards with sparklines and traffic-light status (green/yellow/red), auto-generated executive commentary
- **Revenue tab**: MRR waterfall breakdown (new, expansion, contraction, churned), ARR trend vs target, revenue by segment over time, net revenue retention trend
- **Customers tab**: Logo vs revenue churn trends, NPS trajectory with zone indicators, customer concentration Lorenz curve with Gini coefficient, support ticket volume and resolution time
- **Forecast tab**: 6-month Holt-Winters projections for MRR, ARR, NRR, logo churn, NPS, and CAC with 95% confidence intervals
- **Anomalies tab**: Automatically flagged data points with severity classification (critical/warning/info), anomaly timeline, and detail table with z-scores
- **Report tab**: Configurable PDF report generator -- select language (EN/ES), sections to include, and download a formatted executive PDF
- **Technical tab**: 9 embedded Jupyter notebooks showing the full analytical pipeline from data generation through report automation

### Notebooks

| # | Notebook | Purpose |
|---|----------|---------|
| 01 | `01_data_generation.ipynb` | Synthetic NovaCRM dataset creation with SaaS-realistic patterns |
| 02 | `02_eda_saas_metrics.ipynb` | Distribution validation, correlation analysis, baseline pattern identification |
| 03 | `03_anomaly_detection.ipynb` | Z-score methodology on deseasonalized residuals, severity classification |
| 04 | `04_forecasting.ipynb` | Exponential smoothing model selection, accuracy evaluation |
| 05 | `05_report_automation.ipynb` | End-to-end report pipeline: data load, health score, commentary, PDF export |
| 06 | `06_backend_architecture.ipynb` | FastAPI app structure, router design, data loader patterns |
| 07 | `07_kpi_calculations.ipynb` | Formulas for all 12 KPIs, traffic-light thresholds, health score weighting |
| 08 | `08_analytics_algorithms.ipynb` | Dual anomaly detection (z-score + IQR), Holt-Winters parameter tuning |
| 09 | `09_pdf_report_pipeline.ipynb` | fpdf2 layout engine, plotly-to-PNG conversion, bilingual Jinja2 templates |

### Sample PDF Reports

Pre-generated reports are available in `reports/`:
- `kpi_report_2025-12_en.pdf` -- English executive report for the Dec 2025 period
- `kpi_report_2025-12_es.pdf` -- Spanish executive report for the same period

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check with dataset row counts and available filters |
| `GET /api/v1/filters` | Available segments and months for frontend dropdowns |
| `GET /api/v1/overview` | KPI cards, health score, executive commentary |
| `GET /api/v1/revenue` | MRR waterfall, ARR trend, segment breakdown, NRR |
| `GET /api/v1/customers` | Churn trends, NPS, Lorenz curve, support tickets |
| `GET /api/v1/forecast` | Holt-Winters projections with 95% CI for 6 metrics |
| `GET /api/v1/anomalies` | Z-score and IQR flagged anomalies with severity |
| `GET /api/v1/report/generate` | PDF generation endpoint (streaming download) |

All endpoints accept optional query parameters: `segment`, `start_month`, `end_month`, `lang`.

## Recommendations

These are the types of data-driven recommendations the system generates automatically based on KPI thresholds:

1. **Reduce churn in the Starter segment**: With NRR below 100% and the highest logo churn rate across segments, implement a proactive retention program with early-warning alerts based on product usage patterns. Focus on onboarding quality and time-to-value.
2. **Capitalize on Enterprise expansion**: Enterprise NRR exceeds 110%, meaning existing accounts are growing revenue without new sales effort. Invest in customer success resources for this segment to accelerate upselling.
3. **Institutionalize anomaly monitoring**: The Q3 2024 pricing-change churn spike took several months to fully resolve. An automated alert system (like the one built here) would have flagged the issue in month 1 rather than month 3.
4. **Extend forecasting horizon as data accumulates**: With only 24 months of history, confidence intervals are necessarily wide. Once 36+ months are available, re-evaluate ARIMA or seasonal decomposition models for tighter projections.
5. **Add an event exclusion mechanism**: The anomaly detection system flags the Q2 2025 product launch as "anomalous" -- because it is statistically unusual -- but it was a planned event. Production systems need a way to annotate known events so they are contextualized rather than alarmed on.

## How to Reproduce

### Prerequisites
- Python 3.12+
- Node.js 18+

### Data Pipeline

```bash
cd projects/04-executive-kpi-report

# Create and activate Python environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Generate synthetic data
python data-pipeline/01_generate_saas_data.py
# Output: data/processed/monthly_metrics.parquet, segment_metrics.parquet

# Compute derived KPIs
python data-pipeline/02_compute_kpis.py
# Output: data/processed/monthly_kpis.parquet, segment_kpis.parquet
```

### Backend

```bash
cd backend
uvicorn kpi_backend.main:app --host 0.0.0.0 --port 8052
# API available at http://localhost:8052
# Health check: http://localhost:8052/health
```

### Frontend

```bash
cd projects/04-executive-kpi-report
npm install
npm run dev
# Dashboard at http://localhost:3052
```

### Generate PDF Reports

```bash
# Via API endpoint
curl "http://localhost:8052/api/v1/report/generate?lang=en" -o report_en.pdf
curl "http://localhost:8052/api/v1/report/generate?lang=es" -o report_es.pdf
```

### Convert Notebooks to HTML (for Technical tab)

```bash
jupyter nbconvert --to html --output-dir=public/notebooks_html notebooks/*.ipynb
```

## Decisions & Trade-offs

| Decision | What was chosen | Alternatives considered | Rationale |
|----------|----------------|------------------------|-----------|
| Data source | Synthetic with seeded RNG | Public datasets, anonymized real data | No public dataset exists with real SaaS operational metrics at row level; synthetic data with known events enables anomaly detection validation |
| Health score weights | MRR growth 20%, NRR 20%, churn 15%, NPS 15%, Rule of 40 15%, LTV:CAC 15% | Equal weights, PCA-derived weights | Weights follow Bessemer/a16z SaaS frameworks; revenue metrics weighted higher because they are the strongest leading indicator of business viability |
| Traffic-light thresholds | Configurable per-KPI targets with 5% yellow zone | Fixed industry benchmarks, percentile-based | Configurable targets allow each company to set their own standards; the 5% buffer zone prevents noisy toggling between green and red |
| Bilingual support | Full EN/ES with template-based commentary | English only, LLM translation | Demonstrates internationalization as a first-class concern; template-based approach is deterministic and auditable |
| Chart library (frontend) | Recharts | Plotly.js, D3, Nivo | Recharts is React-native, lightweight, and sufficient for the chart types needed (line, bar, waterfall, area) |
| Chart library (PDF) | Plotly + kaleido server-side rendering | Matplotlib, fpdf2 built-in drawing | Plotly produces publication-quality charts; kaleido enables headless PNG export without a browser |

## Tech Stack

`Next.js 14` | `FastAPI` | `Python` | `TypeScript` | `Tailwind CSS` | `Recharts` | `pandas` | `statsmodels` | `fpdf2` | `Plotly` | `SWR` | `Framer Motion` | `Jinja2` | `scipy` | `kaleido`
