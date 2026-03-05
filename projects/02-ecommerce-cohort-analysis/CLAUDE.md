# Project 02 -- E-Commerce Cohort Analysis (Olist)

## Quick Context
- **Dataset**: Olist Brazilian E-Commerce (~99K orders, 9 CSVs in `data/raw/`)
- **Key caveat**: Only ~3% of customers are repeat buyers. Frame analysis as "what differentiates the returning 3%?"
- **Always use `customer_unique_id`**, not `customer_id` (one person can have multiple customer_ids)
- **Language**: Spanish narrative, English code/variable names/headers
- **Style**: Corporate/executive (boardroom-ready)

## Notebook Order
1. `01_data_ingestion_cleaning.ipynb` -- Load, join, clean, produce parquets
2. `02_eda_exploratory.ipynb` -- Macro trends, distributions, geographic patterns
3. `03_cohort_retention.ipynb` -- Retention matrices, survival curves, statistical tests
4. `04_rfm_ltv_activation.ipynb` -- RFM segments, LTV, activation analysis

## Key Data Files
- `data/raw/` -- 9 Olist CSVs
- `data/processed/orders_enriched.parquet` -- Master analytical table (from NB01)
- `data/processed/customers_summary.parquet` -- Customer-level summary (from NB01)
- `data/processed/cohort_retention_matrix.parquet` -- From NB03
- `data/processed/rfm_segments.parquet` -- From NB04

## Streamlit
- Port: 8502
- Entry: `streamlit run streamlit/app.py --server.port 8502`
- Multi-page app under `streamlit/pages/`

## Reference Files
- `../../scripts/utils/theme.py` -- Shared color palette and plotly/seaborn themes
- `../00-demo-aestehtics/data-pipeline/olist_etl.py` -- Reference join pattern (extend, don't copy)
