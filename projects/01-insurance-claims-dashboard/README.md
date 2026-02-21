# Insurance Claims Dashboard

> **Analyst Flavor:** Financial/Insurance | **Tools:** Power BI, SQL (PostgreSQL), Python | **Status:** Planned

## Business Question

How can an insurance company identify high-risk claim segments, monitor loss ratios by line of business, and detect emerging trends in claim frequency and severity -- enabling underwriters and claims managers to make proactive decisions?

## Planned Scope

### Data
- Synthetic insurance claims dataset (or Kaggle insurance datasets) enriched with actuarial context
- Dimensions: policy type, geography, claimant demographics, claim date, adjuster, status
- Measures: claim amount, incurred loss, reserves, premiums earned

### Analysis
1. **SQL Layer**: Extract and transform raw claims data. Calculate loss ratios, frequency/severity splits, development triangles
2. **Python Layer**: Data cleaning, outlier detection, trend decomposition
3. **Power BI Layer**: Interactive dashboard with filters by line of business, geography, time period

### Deliverables
- [ ] Power BI dashboard (.pbix + published to PBI Service)
- [ ] SQL queries with documented business logic
- [ ] Executive summary (1-page PDF)
- [ ] Dashboard screenshots for GitHub README

### Skills Demonstrated
- Actuarial domain knowledge (loss ratios, triangles, frequency vs severity)
- Power BI DAX measures and relationships
- SQL window functions for running totals and period comparisons
- Dashboard design: drill-down hierarchy, KPI cards, conditional formatting
