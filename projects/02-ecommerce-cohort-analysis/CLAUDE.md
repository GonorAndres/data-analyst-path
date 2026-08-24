# Project 02 -- E-Commerce Cohort Analysis (Olist)

## Quick Context
- **Dataset**: Olist Brazilian E-Commerce (~99K orders, 9 CSVs in `data/raw/`)
- **Live**: https://data-analyst.gonor.me/cohorts/ (Next.js static export, zero backend)
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

## Web dashboard (`web/`)

The Streamlit app under `streamlit/` is **retired**. It was rebuilt as a Next.js
static export served at `data-analyst.gonor.me/cohorts`, merged into the portfolio
hub by `scripts/build-hub.mjs`. Do not add features to it.

The Cloud Run service is not being deleted, so `streamlit/` and the project's
`Dockerfile` stay as a record of the first implementation. `da-cohort-streamlit`
now runs nginx from `ops/cohort-redirect/` and answers 308 to `/cohorts/` for
every path -- its run.app URL was linked from gonor.me, the blog and this repo's
README for months, and deleting the service would 404 all of it. Nothing in CI
builds the Streamlit image any more.

- Dev: `cd web && npm run dev` -> http://localhost:3052/cohorts
- No backend. Everything is read from `web/public/cohorts/data/*.json`.
- Regenerate that JSON: `python data-pipeline/05_build_web_json.py`
- Then verify it still matches the parquet: `python data-pipeline/06_verify_parity.py`
  (needs `pyarrow` + `lifelines`; exits non-zero on any mismatch, cannot run in CI
  because the parquet lives only in GCS)

**The JSON is a tracked build input, not an artifact.** The repo's root `.gitignore`
ignores `*.json` globally; `web/public/cohorts/data/*.json` and `web/src/data/*.json`
are tracked only because of explicit negations there. Remove those and the build still
succeeds and deploys a dashboard with no numbers on it.

**Charts: at most 3 series on one set of axes, otherwise facet.** The seven shared
`--series-*` hues pass colour-vision validation on adjacent pairs only -- three of
them are blues. See the comment block atop `web/src/app/globals.css` and
`web/src/components/charts/Facets.tsx`.

**Retention curves start at month 1.** Month 0 is 100% by construction, and anchoring
an axis there flattens this dataset's sub-1% range into nothing.

## Reference Files
- `../../scripts/utils/theme.py` -- Shared color palette and plotly/seaborn themes
- `../00-demo-aestehtics/data-pipeline/olist_etl.py` -- Reference join pattern (extend, don't copy)
