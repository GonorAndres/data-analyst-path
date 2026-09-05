# E-Commerce Cohort Analysis -- Olist Brazilian E-Commerce

> **Analyst Flavor:** Product/Growth | **Tools:** SQL, Python, Next.js, Recharts, lifelines | **Status:** Complete

**Live:** [data-analyst.gonor.me/cohorts](https://data-analyst.gonor.me/cohorts/) — six pages: overview,
retention, segments, geography, methodology, and the notebooks themselves.

## Business Question

Which customer cohorts retain best, what first-purchase behaviors predict long-term engagement, and where should Olist focus retention efforts -- given that only 3% of customers ever make a second purchase?

## Key Findings

1. **Extremely low repeat rate (3.0%)**: of 93,358 unique customers, 2,801 made a second purchase.
   They are worth **1.92x** a single-purchase customer in *total* revenue (R$309 vs R$161) — but that
   is because they place ~2.1 orders, not because they spend more per order. Per order they spend
   **0.91x** as much (R$146 vs R$161), and their *first* order was 10% smaller than a
   one-and-done customer's. The high spenders are disproportionately the ones who never come back.

2. **The barrier is entirely the second purchase**: 3.0% reach a 2nd order, but 8.1% of those reach a
   3rd and 20.6% of *those* reach a 4th. Conversion recovers sharply once someone returns once, so
   there is one step to fix rather than a leaky funnel.

3. **Repurchase decelerates but never stops**: the Kaplan-Meier curve loses 1.23pp in the first
   quarter and ~0.6pp in every quarter after, out to two years. This **corrects an earlier reading**
   of this same dataset, which called the return probability "practically nil" after six months; the
   curve does not support that. Median survival does not exist — S(t) plateaus near 95%. Among
   customers who *did* return, the median wait was **82 days**.

4. **Revenue is concentrated, but not in the "high value" segment**: Gini **0.479**, with the top 20%
   of spenders holding **53.5%** of revenue. Yet RFM's `Alto Valor` segment is only **117 customers
   and 0.4% of revenue**; the single largest segment (`Potencial Leal`, 54,329 customers) carries 58%
   of the base and 56% of revenue. There is no loyal core to defend here — it has to be built.

5. **LTV is, in practice, the first purchase**: cumulative revenue per customer can only move in a
   month where someone orders again, so the two largest segments (~62,000 customers) have an LTV
   curve consisting of a single point.

6. **Delivery time correlates with retention across states (r = -0.543, 24 states)**: states that
   deliver faster do retain somewhat better. This is a state-level association over 24 units of
   observation, not an identified effect — São Paulo differs from the north of Brazil in far more
   than logistics.

7. **Voucher payment is the strongest positive activation signal** (OR 1.42, interval excluding 1).
   Of 15 first-order features tested, 10 have a 95% interval that excludes no-effect.

## Data Source

- **Dataset**: [Brazilian E-Commerce by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) (Kaggle)
- **Size**: 99,441 orders, 93,358 unique customers, 112,650 line items
- **Period**: September 2016 -- August 2018 (delivered orders)
- **Scope**: filtered to 96,478 delivered orders
- **Limitations**: the ~3% repeat rate means retention estimates are thin in the tail; right-censoring
  is handled with Kaplan-Meier. Frequency is near-constant, so RFM's F dimension carries little
  information and the segments separate mostly on recency and monetary value.

## Methodology

| Layer | Tools | Approach |
|-------|-------|----------|
| Data Ingestion | pandas, pyarrow | 9 CSVs joined into master analytical table with 30 derived columns |
| EDA | Plotly, pandas | 10 interactive visualizations covering volume, revenue, geography, delivery, reviews |
| Cohort Analysis | seaborn, lifelines, scipy | Retention matrices (count + revenue), Kaplan-Meier survival, log-rank tests, chi-squared |
| Segmentation | statsmodels, scipy | RFM quintile scoring (7 segments), logistic regression activation analysis, Lorenz/Gini |
| SQL | PostgreSQL | 5 standalone scripts: cohort assignment, retention matrix, RFM, LTV/activation, geographic |
| Web build | `data-pipeline/05_build_web_json.py` | Pre-aggregates 36 MB of parquet into 276 KB of JSON (~38 KB gzipped) |
| Dashboard | Shared Next.js application, Recharts | Six static pages at `/cohorts` within `../../apps/web`; cohort data requires no backend |
| Verification | `data-pipeline/06_verify_parity.py` | Re-derives every figure from parquet and diffs against the published JSON |

**Differentiation from Project 00**: Project 00 explores Olist's *funnel and conversion* through an
editorial dashboard. This project is the statistical one -- confidence intervals, survival curves,
log-rank tests, chi-squared, logistic-regression odds ratios -- with the notebooks published alongside.

## Decisions & Trade-offs

| Decision | Alternatives considered | Why |
|---|---|---|
| Static JSON, no backend | Keep Streamlit on Cloud Run; FastAPI + Next.js | All three filters (cohort range, size floor, RFM segment) are **subsets** of an already-aggregated matrix — nothing recomputed from the 96,478 orders. So the interactivity survives a static export, which removes a stateful service, its cold starts and its cost. |
| Rebuild rather than proxy Streamlit | Reverse-proxy `/cohorts` to Cloud Run | A proxy would have kept the container, the cold start and a second design language on the same domain. |
| Ship counts, not percentages | Pre-computed percentages | The cohort-size filter needs the month-0 headcount, and a division in the client is free. |
| Ship sums, not means (geography) | Per-state averages | A mean cannot be re-aggregated over a date range; each mean travels as numerator + denominator. |
| Censored cells blank, not 0% | `unstack(fill_value=0)`, as before | A cohort acquired in Aug 2018 has no month 12. Counting it as 0% retention pulled the average's tail toward zero for reasons of calendar, not behaviour. **This is the one figure that deliberately differs from the previous dashboard.** |
| Binned RFM scatter | 93,358 raw points | At that density the scatter is a solid cloud; a recency × frequency grid says the same thing in 120 marks. |
| KM precomputed in the pipeline | Estimate in the browser | The estimator is a cumulative product over ordered event times — a poor thing to redo on every filter change for a curve that never varies. |
| log-log confidence bounds | Plain Greenwood on S(t) | The plain form can stray outside [0, 1], which is not drawable for a probability. Matches `lifelines`' default, so the numbers are comparable. |
| ≤3 series per chart, else facet | Recolour with a wider palette | The palette's 7 hues only pass validation on *adjacent* pairs; 3 of them are blues. Even Okabe-Ito clears all-pairs only with a warning, so the fix is structural. See `../../apps/web/src/features/cohorts/components/charts/Facets.tsx`. |
| Retention charts start at month 1 | Include month 0 | Month 0 is 100% by construction; anchoring the axis there flattens a sub-1% range into the bottom pixel. |

## Results

### Notebooks (4)
- `01_data_ingestion_cleaning.ipynb` -- Data profiling, joins, derived columns, parquet export
- `02_eda_exploratory.ipynb` -- 10 visualizations: trends, distributions, geography, delivery, reviews
- `03_cohort_retention.ipynb` -- Retention matrices, survival curves, statistical tests (9 analyses)
- `04_rfm_ltv_activation.ipynb` -- RFM segments, LTV curves, activation odds ratios (7 analyses)

All four are published in the dashboard at `/cohorts/notebooks`.

### SQL Scripts (5)
- `01_cohort_assignment.sql` -- First-purchase cohort assignment with ROW_NUMBER()
- `02_retention_matrix.sql` -- Monthly retention rates via CASE-WHEN pivot
- `03_rfm_segmentation.sql` -- NTILE(5) RFM scoring with segment labels
- `04_ltv_activation.sql` -- Cumulative LTV + first-order feature repeat rates
- `05_geographic_retention.sql` -- State-level retention with delivery metrics

### Dashboard (`/cohorts`)
1. **Resumen** -- KPI cards, retention heatmap, revenue and acquisition trends, repeat-purchase funnel
2. **Retención** -- heatmap (customers/revenue toggle), average curve with 95% CI, best vs worst cohort, Kaplan-Meier with confidence band and splits by payment type and state
3. **Segmentos** -- segment sizes, Lorenz curve and Gini, RFM map, LTV small multiples, activation odds ratios with intervals
4. **Geografía** -- state ranking against the national median, retention curves, delivery vs repurchase
5. **Metodología** -- definitions, calculation logic, data source, limitations
6. **Proceso técnico** -- the four notebooks

Every chart has a "Ver datos" table view, and every card states the "so what?" underneath it.

## Recommendations

1. **Treat the second purchase as the only retention objective.** Conversion to a 3rd order runs at
   2.7x the 1st-to-2nd rate, and to a 4th at 6.9x; almost the whole loss is in one step.

2. **Time the intervention inside the first quarter.** Among customers who returned, the median wait
   was 82 days and 27% came back within 30. Repurchase does keep trickling for two years, so a
   later touch is not wasted — but the first quarter is where the density is.

3. **Do not build the programme around the "high value" segment.** It is 117 customers and 0.4% of
   revenue. The top 20% of spenders — 53.5% of revenue — is the segment worth designing for, and it
   is defined by spend, not by RFM tier.

4. **Use first-order features for targeting, not as levers.** Voucher payment (OR 1.42), review score
   and category are the only signals available before a customer disappears. They are observational:
   they say who to contact, not what to change.

5. **Treat delivery as a plausible lever with weak evidence.** r = -0.543 across 24 states is
   suggestive and cheap to act on where volume is high and delivery slow, but it is not an
   identified effect and should not be sold as one.

## How to Reproduce

```bash
# 1. Install dependencies
cd projects/02-ecommerce-cohort-analysis
pip install -r requirements.txt

# 2. Download Olist data (or copy from data/raw/ if already present)
kaggle datasets download -d olistbr/brazilian-ecommerce -p data/raw/ --unzip

# 3. Run notebooks in order
cd notebooks
jupyter nbconvert --execute 01_data_ingestion_cleaning.ipynb
jupyter nbconvert --execute 02_eda_exploratory.ipynb
jupyter nbconvert --execute 03_cohort_retention.ipynb
jupyter nbconvert --execute 04_rfm_ltv_activation.ipynb

# 4. Rebuild the dashboard's JSON, then check it still matches the parquet
cd ..
python data-pipeline/05_build_web_json.py
python data-pipeline/06_verify_parity.py     # non-zero exit on any mismatch

# 5. From the repository root, run the shared frontend
cd ../..
npm ci --prefix apps/web
npm run dev
# http://localhost:3000/cohorts/
```

The frontend now lives in `apps/web/src/features/cohorts` and the shared
`apps/web/src/app/cohorts` routes. Cohort retention and `/olist/` marketplace
performance belong to the same e-commerce case study, with common navigation,
light/dark themes, and English/Spanish preferences. English and light mode are
the first-visit defaults; notebooks retain their original language.

Static artifacts remain in this project's `web/public/cohorts/`, including data
JSON and exported notebooks. The shared app stages those files for development
and builds. The old frontend, Streamlit application, and obsolete container
configuration have been archived outside the repository and removed. Research
and public artifacts remain; hosting retirement and deployment are separate operations.

To use the other API-backed analyses, run the consolidated backend in a separate
terminal from the repository root. `/cohorts/` itself does not require it:

```bash
pip install -r backend/requirements.txt
bash backend/dev.sh
# http://localhost:8080
```

## Skills Demonstrated

- SQL cohort analysis (self-joins, window functions, CTEs, NTILE, ROW_NUMBER)
- Survival analysis (Kaplan-Meier, log-log confidence bounds, log-rank tests, right-censoring)
- Statistical testing (chi-squared, Pearson/Spearman correlation, z-tests, Wilson CIs)
- Logistic regression for activation analysis (odds ratios, interval-based interpretation)
- RFM segmentation and revenue concentration (Lorenz/Gini)
- Pre-aggregation design: turning a stateful dashboard into a static export without losing interactivity
- Accessible chart design: validated palettes, CVD-safe series limits, table views for every figure
- Product analytics thinking: cohorts, retention, activation, LTV, funnels
