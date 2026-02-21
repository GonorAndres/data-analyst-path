# Executive KPI Report

> **Analyst Flavor:** Business/General | **Tools:** Python, Power BI, SQL | **Status:** Planned

## Business Question

How can we automate the generation of a weekly/monthly executive KPI report that tracks the company's health metrics, highlights anomalies, and provides actionable commentary -- replacing manual Excel-based reporting?

## Planned Scope

### Data
- Simulated company operational data (revenue, costs, headcount, customer metrics)
- Multiple data sources merged: SQL database + CSV exports + API pulls
- Time series: at least 12 months of history for trend context

### Analysis
1. **SQL Layer**: KPI calculations from raw operational tables
2. **Python Layer**: Automated report generation (data pull -> calculations -> PDF/slides output), anomaly flagging (simple z-score or IQR method)
3. **Power BI Layer**: Companion dashboard for drill-down beyond the static report

### Deliverables
- [ ] Python script that generates a formatted PDF report from data
- [ ] Power BI dashboard (.pbix + PBI Service link)
- [ ] Sample generated reports (PDF) in reports/output/
- [ ] Cron-ready automation script with config file
- [ ] Documentation: "How to customize KPIs and recipients"

### Skills Demonstrated
- Report automation (Python: fpdf2 or reportlab, jinja2 templates)
- KPI definition and metric hierarchy design
- Anomaly detection for business metrics (practical, not ML-heavy)
- Stakeholder communication: designing reports executives actually read
