# Project 02 -- E-Commerce Cohort Analysis (Olist)

## Quick Context
- **Dataset**: Olist Brazilian E-Commerce (~99K orders, 9 CSVs in `data/raw/`)
- **Public route**: https://data-analyst.gonor.me/cohorts/ (static cohort data, no backend required for this route)
- **Key caveat**: Only ~3% of customers are repeat buyers. Frame analysis as "what differentiates the returning 3%?"
- **Always use `customer_unique_id`**, not `customer_id` (one person can have multiple customer_ids)
- **Language**: Shared English/Spanish visitor-facing UI; original notebooks retain their Spanish narrative and English code/variable names
- **Style**: Shared analytical site shell, Inter typography, semantic light/dark themes; English and light mode are first-visit defaults

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

## Shared Web Dashboard (`../../apps/web`)

Active frontend source lives in `apps/web/src/features/cohorts` and
`apps/web/src/app/cohorts` relative to the repository root. The six cohort pages
share the site's navigation, theme, and locale preferences. `/cohorts/` and the
API-backed `/olist/` analysis are two parts of one e-commerce case study.

Start the frontend from the repository root:

```bash
npm ci --prefix apps/web
npm run dev
# http://localhost:3000/cohorts/
```

The cohort pages use static JSON and need no backend. For `/olist/` and the other
API-backed analyses, start the consolidated API in a separate terminal from the
repository root:

```bash
pip install -r backend/requirements.txt
bash backend/dev.sh
# http://localhost:8080
```

The previous `web/src/` frontend, `streamlit/` application, obsolete frontend
configuration, project Dockerfile, and old cohort deployment workflow have been
archived outside the repository and removed. Preserve `web/public/` as an active
staging input, along with pipelines, notebooks, and research. Do not recreate the
legacy applications. Hosting retirement and publication are separate operations;
consult `../../docs/retirement.md` for their verified status.

- Static artifacts remain in `web/public/cohorts/data/*.json` and `web/public/cohorts/notebooks_html/`; the shared application's staging step copies them into its generated public directory.
- Regenerate that JSON: `python data-pipeline/05_build_web_json.py`
- Then verify it still matches the parquet: `python data-pipeline/06_verify_parity.py`
  (needs `pyarrow` + `lifelines`; exits non-zero on any mismatch, cannot run in CI
  because the parquet lives only in GCS)

**The JSON is a tracked build input, not an artifact.** The repo's root `.gitignore`
ignores `*.json` globally; `web/public/cohorts/data/*.json` and
`../../apps/web/src/features/cohorts/data/*.json` are included only because of
explicit negations there. Remove those and the build still
succeeds and deploys a dashboard with no numbers on it.

**Charts: at most 3 series on one set of axes, otherwise facet.** The seven shared
`--series-*` hues pass colour-vision validation on adjacent pairs only -- three of
them are blues. Keep the facet/series limits when changing the shared palette in
`apps/web/src/app/globals.css`; see the rationale in
`apps/web/src/features/cohorts/components/charts/Facets.tsx` (repository-relative paths).

**Retention curves start at month 1.** Month 0 is 100% by construction, and anchoring
an axis there flattens this dataset's sub-1% range into nothing.

## Reference Files
- `../../scripts/utils/theme.py` -- Shared color palette and plotly/seaborn themes
- `../00-demo-aestehtics/data-pipeline/olist_etl.py` -- Reference join pattern (extend, don't copy)
