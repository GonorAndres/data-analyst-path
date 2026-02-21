# E-Commerce Cohort Analysis

> **Analyst Flavor:** Product/Growth | **Tools:** SQL, Python, Streamlit | **Status:** Planned

## Business Question

Which customer cohorts have the highest retention and lifetime value, and what acquisition channels or first-purchase behaviors predict long-term customer engagement -- informing where to focus marketing spend?

## Planned Scope

### Data
- Public e-commerce dataset (Brazilian E-Commerce by Olist on Kaggle, or UK Online Retail)
- Dimensions: customer ID, order date, product category, payment method, geography
- Measures: order value, order count, days between purchases

### Analysis
1. **SQL Layer**: Cohort assignment (by first-purchase month), retention matrix calculation, RFM segmentation
2. **Python Layer**: Cohort visualization (heatmaps), LTV estimation, funnel analysis
3. **Streamlit App**: Interactive cohort explorer with date range and segment filters

### Deliverables
- [ ] Jupyter notebook (full EDA + cohort analysis narrative)
- [ ] SQL scripts with cohort and retention queries
- [ ] Streamlit app for interactive exploration
- [ ] Project README with key findings and recommendations

### Skills Demonstrated
- SQL cohort analysis (self-joins, window functions, date arithmetic)
- Retention and LTV metrics definition
- Interactive data app development (Streamlit)
- Product analytics thinking: funnel, activation, retention
