# E-Commerce Cohort Analysis -- Olist Brazilian E-Commerce

> **Analyst Flavor:** Product/Growth | **Tools:** SQL, Python, Streamlit, Plotly, lifelines | **Status:** Complete

## Business Question

Which customer cohorts retain best, what first-purchase behaviors predict long-term engagement, and where should Olist focus retention efforts -- given that only 3% of customers ever make a second purchase?

## Key Findings

1. **Extremely low repeat rate (3.0%)**: Of 93,358 unique customers, only 2,801 made a second purchase. However, repeat customers spend 1.8x more per order on average, making retention the highest-leverage growth opportunity.

2. **Voucher payment predicts retention**: Customers paying with voucher on their first order have 1.42x higher odds of returning (statistically significant). Credit card and boleto show no meaningful difference.

3. **Delivery is the strongest retention lever**: States with shorter average delivery times (e.g., SP, PR) consistently show higher month-3 retention rates. The delivery-retention correlation is visible across all geographic analyses.

4. **Revenue is highly concentrated (Lorenz/Gini)**: A small fraction of customers generates disproportionate revenue. The Champions segment (0.1% of customers) contributes outsized LTV (R$545/customer at 12 months vs R$160 average).

5. **Late deliveries suppress reviews and retention**: Orders delivered late average significantly lower review scores, and lower first-order review scores correlate with lower repeat probability.

## Data Source

- **Dataset**: [Brazilian E-Commerce by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) (Kaggle)
- **Size**: 99,441 orders, 93,358 unique customers, 112,650 line items
- **Period**: September 2016 -- October 2018
- **Scope**: Filtered to 96,478 delivered orders for analysis
- **Limitations**: Low repeat rate (~3%) means retention curves have wide confidence intervals. Right-censoring handled with Kaplan-Meier survival analysis.

## Methodology

| Layer | Tools | Approach |
|-------|-------|----------|
| Data Ingestion | pandas, pyarrow | 9 CSVs joined into master analytical table with 30 derived columns |
| EDA | Plotly, pandas | 10 interactive visualizations covering volume, revenue, geography, delivery, reviews |
| Cohort Analysis | seaborn, lifelines, scipy | Retention matrices (count + revenue), Kaplan-Meier survival, log-rank tests, chi-squared |
| Segmentation | statsmodels, scipy | RFM quintile scoring (7 segments), logistic regression activation analysis, Lorenz/Gini |
| SQL | PostgreSQL | 5 standalone scripts: cohort assignment, retention matrix, RFM, LTV/activation, geographic |
| Dashboard | Streamlit, Plotly | 4-page executive app with KPI cards, insight boxes, interactive filters |

**Differentiation from Project 00**: Project 00 explored Olist through an editorial Next.js dashboard with basic cohort/RFM computations. This project adds statistical depth -- confidence intervals, survival curves, log-rank tests, chi-squared tests, logistic regression odds ratios -- and delivers analytical narratives through Jupyter notebooks.

## Results

### Notebooks (4)
- `01_data_ingestion_cleaning.ipynb` -- Data profiling, joins, derived columns, parquet export
- `02_eda_exploratory.ipynb` -- 10 visualizations: trends, distributions, geography, delivery, reviews
- `03_cohort_retention.ipynb` -- Retention matrices, survival curves, statistical tests (9 analyses)
- `04_rfm_ltv_activation.ipynb` -- RFM segments, LTV curves, activation odds ratios (7 analyses)

### SQL Scripts (5)
- `01_cohort_assignment.sql` -- First-purchase cohort assignment with ROW_NUMBER()
- `02_retention_matrix.sql` -- Monthly retention rates via CASE-WHEN pivot
- `03_rfm_segmentation.sql` -- NTILE(5) RFM scoring with segment labels
- `04_ltv_activation.sql` -- Cumulative LTV + first-order feature repeat rates
- `05_geographic_retention.sql` -- State-level retention with delivery metrics

### Streamlit Dashboard
4-page executive app (`streamlit run streamlit/app.py --server.port 8502`):
1. **Resumen Ejecutivo** -- KPI cards, revenue trends, retention funnel
2. **Retencion por Cohortes** -- Heatmaps (toggle count/revenue), survival curves
3. **Segmentos de Clientes** -- RFM scatter, LTV curves, activation odds ratios, Lorenz/Gini
4. **Analisis Geografico** -- State rankings, delivery vs. retention scatter

## Recommendations

1. **Launch a 30-day post-purchase re-engagement campaign**: The median time between 1st and 2nd purchase is ~90 days. A targeted email/push sequence starting at day 30 could capture customers before they lapse.

2. **Expand voucher/discount incentives for first-time buyers**: Voucher payment is the strongest positive predictor of repeat purchase (OR=1.42). Consider offering voucher credits on first delivery confirmation.

3. **Prioritize logistics in high-volume, low-retention states**: States with high order volume but below-average retention (often correlated with longer delivery times) represent the biggest improvement opportunity.

4. **Investigate Champion cohort characteristics**: The 0.1% Champions segment generates disproportionate value. Understanding their acquisition source and first-order behavior could inform targeting.

5. **Improve delivery estimation accuracy**: Late deliveries (8.1% of orders) correlate with lower reviews and lower retention. Better delivery estimates could reduce perceived lateness even without faster shipping.

## How to Reproduce

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Download Olist data (or copy from data/raw/ if already present)
kaggle datasets download -d olistbr/brazilian-ecommerce -p data/raw/ --unzip

# 3. Run notebooks in order
cd notebooks
jupyter nbconvert --execute 01_data_ingestion_cleaning.ipynb
jupyter nbconvert --execute 02_eda_exploratory.ipynb
jupyter nbconvert --execute 03_cohort_retention.ipynb
jupyter nbconvert --execute 04_rfm_ltv_activation.ipynb

# 4. Launch dashboard
cd ../streamlit
streamlit run app.py --server.port 8502
```

## Skills Demonstrated

- SQL cohort analysis (self-joins, window functions, CTEs, NTILE, ROW_NUMBER)
- Survival analysis (Kaplan-Meier, log-rank tests, right-censoring)
- Statistical testing (chi-squared, Pearson/Spearman correlation, z-tests, Wilson CIs)
- Logistic regression for activation analysis (odds ratios, feature significance)
- RFM segmentation and revenue concentration (Lorenz/Gini)
- Interactive dashboard development (Streamlit, Plotly)
- Product analytics thinking: cohorts, retention, activation, LTV, funnels
