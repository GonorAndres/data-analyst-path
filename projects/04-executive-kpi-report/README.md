# Executive KPI Report: from revenue movements to management questions

**Evidence:** deterministic synthetic scenario · **Period:** January 2024–December 2025 · **Audience:** business and finance teams

[Case study](https://data-analyst.gonor.me/kpi/) · [Explore](https://data-analyst.gonor.me/kpi/?view=explore) · [English report](reports/kpi_report_2025-12_en.pdf) · [Spanish report](reports/kpi_report_2025-12_es.pdf)

## Business Question

Which revenue movements and customer changes deserve investigation in a monthly executive review, and how can the evidence be presented consistently across a dashboard and a report?

NovaCRM is fictional. This project demonstrates the analysis and communication workflow; it does not establish real customer behavior, intervention impact, or time saved.

## Key Findings

Verified against the seed-42 generation scripts and the regenerated reports on September 5, 2026:

- Generated MRR rises from **$439,758.43 in January 2024 to $969,692.39 in December 2025**. December growth is **1.8346% month over month**; the report rounds this to 1.8%. The $420,000 generator starting balance precedes the first monthly observation.
- December NRR is **112.348%**, stored as the ratio 1.12348. Reporting it as 1.1% would change its meaning: the scenario models net expansion of existing-account revenue.
- Scanning all 24 months across the API's 12 metrics gives **13 unique flagged metric-month observations** with default z-score/IQR settings. July 2024 revenue churn is critical by the descriptive severity rule. This demonstrates detection on the constructed scenario; it is not an estimate of production precision or recall.
- Starter NRR ranges from **90.871% to 99.725%** and Enterprise from **109.675% to 114.810%** in the generated segment table. These segment differences come from simulator assumptions and suggest questions to investigate, not validated targeting recommendations.
- The December dashboard/report health score is **73.5/100** using the current API formula. Its weights, scales and targets are illustrative choices, not a validated business-health index.

## Data Source

| Attribute | Definition |
|---|---|
| Source | [Seeded generation script](data-pipeline/01_generate_saas_data.py), using `np.random.default_rng(42)` |
| Company | NovaCRM, fictional B2B SaaS company |
| Coverage | 24 monthly observations and 72 segment-month observations |
| Segments | Starter, Professional and Enterprise; shares and behavior are configured assumptions |
| Scenario events | A pricing-change disturbance in Q3 2024 and a product-launch disturbance in Q2 2025 |
| Limitations | Short synthetic history; constructed correlations and events; no external benchmark calibration, causal identification or measured intervention outcomes |

Synthetic data was chosen to make inputs and assumptions inspectable. No claim is made that suitable public SaaS datasets do not exist.

## Methodology

1. **Define the population.** Company-wide monthly metrics feed the overview, forecasts, anomaly scan and PDF. Date filters select the analysis window.
2. **Explain revenue movement.** The MRR bridge reconciles starting MRR + new + expansion − contraction − churn to ending MRR. Monetary values are USD; rates such as NRR remain decimal ratios internally.
3. **Compare observations with descriptive baselines.** Z-score uses the selected series mean and sample standard deviation, with default flagging at `|z| >= 2`. IQR uses fences `Q1 − 1.5 × IQR` and `Q3 + 1.5 × IQR`, with the median shown as its reference. A point flagged by both retains both sets of evidence and counts once. Severity uses `|z| > 3` for critical, `|z| > 2` for warning, and info otherwise. Baselines include the observation being assessed; they are neither forecasts nor business targets.
4. **Separate scenarios from validated forecasts.** The backend fits additive-trend exponential smoothing without seasonality when statsmodels succeeds, with simple exponential smoothing as fallback. Its nominal 95% bands use residual spread and an imposed horizon-widening factor; empirical coverage has not been established. ARIMA/Prophet comparisons were not run.
5. **Generate a consistent report.** The API and PDF use the same anomaly scan and calculation functions. Plain Python templates in `commentary.py` generate bilingual text; retained Jinja2 templates are reference artifacts, not the production renderer.

The pre-aggregation script also computes trailing-six-month z-scores and a differently scaled health score. Those research fields are **not** the current API anomaly baseline or dashboard/report health score. Notebook examples must be read with their review notes.

### Filter scope

`start_month` and `end_month` affect the monthly population. The accepted `segment` parameter does **not** change company-wide overview, forecast, anomaly or PDF results. On revenue/customer endpoints it affects the segment breakdown or concentration input; aggregate series remain company-wide. The dashboard's controls therefore do not imply every figure uses every filter.

## Results

The case study introduces the business question and evidence; **Explore** retains revenue, customer, forecast, anomaly and report views. Methods links expose nine research notebooks.

The retained [English PDF](reports/kpi_report_2025-12_en.pdf) and [Spanish PDF](reports/kpi_report_2025-12_es.pdf) cover January 2024–December 2025, with headline KPI values for December. They include the reconciled MRR figure, source disclosures, formatted targets and anomaly baselines. Figures depend on Plotly/Kaleido rendering; the regeneration environment includes Chrome.

The [December revenue-bridge evidence](public/kpi/evidence/revenue-bridge.json) is generated alongside the reports from the same calculation. It records USD components, population, period, seed and source paths for the case-study figure.

| Notebook | Role |
|---|---|
| [01 — Data generation](notebooks/01_data_generation.ipynb) | Simulator assumptions and constructed events |
| [02 — EDA](notebooks/02_eda_saas_metrics.ipynb) | Exploratory distributions, segments and revenue components |
| [03 — Anomalies](notebooks/03_anomaly_detection.ipynb) | Z-score/IQR examples and threshold sensitivity |
| [04 — Forecasting](notebooks/04_forecasting.ipynb) | Forecast examples and proposed evaluation |
| [05 — Report automation](notebooks/05_report_automation.ipynb) | Assembly workflow and review corrections |
| [06 — Backend](notebooks/06_backend_architecture.ipynb) | API architecture and population scope |
| [07 — KPIs](notebooks/07_kpi_calculations.ipynb) | Formula examples and production-definition differences |
| [08 — Algorithms](notebooks/08_analytics_algorithms.ipynb) | Detector and forecast examples |
| [09 — PDF pipeline](notebooks/09_pdf_report_pipeline.ipynb) | Layout and rendering workflow |

These notebooks are research walkthroughs with unexecuted cells, not a saved validation run. Their HTML was republished with September 2026 review notes; current numerical findings above were checked separately against the pipeline and backend.

Browser API paths are namespaced under `/api/kpi/api/v1/`: `overview`, `revenue`, `customers`, `forecast`, `anomalies`, and `report/generate`. The consolidated backend mounts the corresponding routes under `/kpi/api/v1/`.

## Recommendations

- Investigate revenue churn alongside acquisition and expansion rather than treating aggregate growth as sufficient evidence of retention.
- In real data, validate whether the constructed segment differences persist before funding a retention or expansion intervention.
- Annotate known events and review alerts with owners. This scenario does not establish how much earlier a real team would detect an issue.
- Backtest forecast errors and interval coverage before using projections for budgeting.
- Calibrate health-score weights and targets with stakeholders, then test sensitivity to alternative choices.

These are proposed next steps; no business impact has been demonstrated.

## Decisions & Trade-offs

| Decision | Choice | Alternative considered | Reason and limit |
|---|---|---|---|
| Data | Seeded synthetic scenario | Licensed or anonymized operational data | Reproducible demonstration; weak external validity |
| Alerting | Z-score and IQR | More complex detectors | Transparent comparisons; global baselines can flag trends and miss shifts |
| Forecasting | Additive-trend smoothing | Seasonal models, ARIMA, Prophet | Small interpretable example; no evidence of superiority |
| Health score | Six weighted dimensions | Equal weights or stakeholder-calibrated score | Explicit assumptions; API scales differ from historical pipeline examples |
| Reporting | fpdf2 and Plotly/Kaleido | HTML-to-PDF or LaTeX | Shared numerical source with the API; static charts require a working renderer |
| Commentary | Deterministic Python templates | Manual writing or generated prose | Auditable rules; requires editorial review to avoid unsupported interpretations |

## How to Reproduce

Use Python 3.12+ and Node.js 22+. From the repository root:

```bash
.venv/bin/pip install -r projects/04-executive-kpi-report/requirements.txt
.venv/bin/python projects/04-executive-kpi-report/data-pipeline/01_generate_saas_data.py
.venv/bin/python projects/04-executive-kpi-report/data-pipeline/02_compute_kpis.py
.venv/bin/python projects/04-executive-kpi-report/backend/regenerate_reports.py
PYTHONPATH=projects/04-executive-kpi-report/backend .venv/bin/python -m pytest projects/04-executive-kpi-report/backend/tests -q
```

Create the virtual environment first if absent. Tests additionally require pytest; HTML exports require nbconvert. Kaleido chart export requires its compatible Chrome installation.

Start the consolidated backend with `bash backend/dev.sh` and the shared frontend with `npm run dev`. To refresh notebook HTML without claiming execution:

```bash
.venv/bin/jupyter nbconvert --to html --output-dir=projects/04-executive-kpi-report/public/kpi/notebooks_html projects/04-executive-kpi-report/notebooks/*.ipynb
```

Edit source artifacts under this project. The shared application's public assets are staged from these originals.
