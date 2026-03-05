# TODO -- Project 02: E-Commerce Cohort Analysis

## Streamlit Dashboard

- [ ] Add sidebar filters: date range picker, minimum cohort size slider, segment selector
- [ ] Add data download buttons (CSV export) on each page for key tables/matrices
- [ ] Implement caching (`@st.cache_data`) on data loaders for faster page transitions
- [ ] Add a "Metodologia" page explaining RFM scoring rules, cohort definitions, and survival model assumptions
- [ ] Add KM survival curves segmented by payment type or state (currently only aggregate)
- [ ] Add cohort-over-cohort comparison chart (select 2-3 cohorts to overlay)
- [ ] Mobile/responsive layout adjustments (metric cards stack poorly on narrow screens)
- [ ] Deploy to Streamlit Cloud and add live link to README

## Analysis Depth

- [ ] Investigate the ~3% repeat buyers: profile them (state, category, payment, review score) vs one-time buyers
- [ ] Add product category analysis: which categories drive repeat purchases?
- [ ] Run statistical tests (chi-squared, Mann-Whitney) on repeat vs non-repeat buyer characteristics
- [ ] Build a simple logistic regression predicting repeat purchase (beyond the activation odds ratios already computed)
- [ ] Add seasonality decomposition to revenue trend (is the 2018 plateau seasonal or structural?)
- [ ] Compute customer acquisition cost proxy using seller fee data

## SQL Queries

- [ ] Add query for basket analysis (frequently co-purchased categories)
- [ ] Add query for time-between-purchases distribution among repeat buyers
- [ ] Optimize retention matrix query with window functions instead of self-join

## Reports & Documentation

- [ ] Finish executive summary PDF with charts embedded
- [ ] Create a 5-slide presentation deck (problem, method, findings, recommendations, next steps)
- [ ] Add nbviewer badges to README for each notebook
- [ ] Record a 3-minute Loom walkthrough of the dashboard for portfolio site

## Integration

- [ ] Add companion entry on portfolio site (~/portafolio/)
- [ ] Link "next steps" prediction use case to data-science repo
- [ ] Connect docs/ folder to Obsidian vault for knowledge base cross-referencing
