# Live Dashboard Gallery

Viewport screenshots (1440x900) of every deployed dashboard in this repo.
Captured with Playwright MCP against the production URLs on 2026-04-12.

Refresh instructions live in the main `CLAUDE.md` under "Environments
& Branching"; the URL registry they are taken from is `ops/urls.yml`.

| File | Project | Live URL | What it shows |
|------|---------|----------|---------------|
| `00_portfolio_hub.png` | 00 demo-aesthetics | https://demo-aesthetics.vercel.app | Editorial typography landing — the hub that links every project |
| `00_airbnb_cdmx_kpis.png` | 00 demo-aesthetics | https://demo-aesthetics.vercel.app/airbnb | Airbnb CDMX KPI row (27,051 listings, MXN 1,793, 4.75/5, 16 dias/mes) |
| `01_reserves_kpis.png` | 01 insurance | https://insurance-claims-dashboard-pi.vercel.app | P&C actuarial KPIs ($155M reserves, 67.2% loss ratio, 97.2% combined, $20M IBNR) |
| `01_development_triangle.png` | 01 insurance | https://insurance-claims-dashboard-pi.vercel.app | Chain-ladder development triangle (cumulative paid losses by accident year x lag) |
| `02_cohort_app_hero.png` | 02 cohort | https://da-cohort-streamlit-451451662791.us-central1.run.app | Olist cohort app landing (91,358 customers, navigation table) |
| `02_retention_heatmap.png` | 02 cohort | https://da-cohort-streamlit-451451662791.us-central1.run.app/retencion_cohortes | Retention heatmap: cohort month x months-since-first-purchase |
| `03_abtest_ship_it.png` | 03 ab-test | https://ab-test-analysis.vercel.app | A/B Test Lab SHIP IT verdict banner with p-value and lift |
| `04_kpi_overview.png` | 04 executive kpi | https://executive-kpi-report.vercel.app | NovaCRM SaaS KPIs (Business Health 70, MRR $969K, ARR $11.6M, sparklines) |
| `04_anomaly_timeline.png` | 04 executive kpi | https://executive-kpi-report.vercel.app | Anomaly detector timeline (critical / warning / info labeled dots) |
| `05_portfolio_overview.png` | 05 financial portfolio | https://financial-portfolio-tracker-iota.vercel.app | Portfolio metrics + asset allocation donut (Sharpe 1.11, max DD -10.49%) |
| `05_efficient_frontier.png` | 05 financial portfolio | https://financial-portfolio-tracker-iota.vercel.app | Markowitz efficient frontier Monte Carlo scatter with optimal + min-var markers |
| `06_nyc311_kpis.png` | 06 ops efficiency | https://operational-efficiency.vercel.app | NYC 311 ops center (3.46M records, 13.3 days avg, 55.7% SLA, top-complaint bars) |
| `06_agency_sankey.png` | 06 ops efficiency | https://operational-efficiency.vercel.app | Complaint -> agency Sankey diagram + per-agency bottleneck table |
