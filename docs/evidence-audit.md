---
tags: [portfolio, evidence, methodology]
status: review
created: 2026-09-05
updated: 2026-09-05
---

# Portfolio evidence ledger

This review separates observed data, simulated demonstrations, and model-based scenarios. An artifact date is not an observation date. API-derived snapshots preserve what the service returned; they do not replace independent reproduction from raw data.

| Case | Evidence and reproducible source | Verified basis / limitation |
|---|---|---|
| Airbnb CDMX | `projects/00-demo-aestehtics/public/data/airbnb/kpis.json` and companion aggregates | 27,051 listings; mean advertised price MXN 1,792.54; median 30-day availability 16. Artifact updated 2026-03-02. Stated March 2025 collection date not reverified from raw files. Availability includes host blocks; no observed bookings or realized revenue. |
| Insurance | `projects/01-insurance-claims-dashboard/data-pipeline/02_clean_triangles.py`, `03_generate_claims.py`, `04_compute_reserves.py`; dated `public/insurance/evidence/paid-development.json` API snapshot | Schedule P aggregates and synthetic individual claims are separate populations. Local processed tables unavailable. Paid ultimate minus paid is projected unpaid loss, including case reserves; incurred ultimate minus incurred is an IBNR estimate. Dollar scaling and earlier ~$20.4M headline remain unverified. Combined ratios assume 30% expenses. CL/BF differences are not confidence intervals. |
| Olist marketplace | `projects/00-demo-aestehtics/data-pipeline/olist_etl.py` | Keeps all order statuses; groups payments per order and assigns cohorts by customer_unique_id. Local marketplace parquet unavailable. Categories use the first item, so order-level category totals are not item-level sales totals. |
| Olist cohorts | `projects/02-ecommerce-cohort-analysis/data/processed/` and `web/public/cohorts/data/meta.json` | Verified local parquet: 96,478 delivered orders, 93,358 customers, 2016-09-15–2018-08-29; published payment total R$15,419,773.75. 2,801 repeat customers (5,921 orders), 90,557 single-order customers. Mean customer revenue R$308.53 vs R$160.73. Mean of customer-level AOV R$145.85 vs R$160.73. Survival table has 92,523 eligible rows, a distinct denominator. |
| A/B experiment | `projects/03-ab-test-analysis/data-pipeline/03_enrich.py` | Seed 42 simulates dimensions and revenue AND overwrites conversion: 1.5% of eligible mobile-treatment non-converters flip to 1; subsequently 8% of eligible returning-treatment converters flip to 0. These are probabilities on eligible subsets, not population percentage-point effects. Local enriched parquet unavailable; original experiment outcomes and production rollout effects cannot be inferred. |
| Executive KPIs | `projects/04-executive-kpi-report/data-pipeline/01_generate_saas_data.py` and `02_compute_kpis.py` | Generated SaaS transactions/customers, not company operating evidence. Anomalies must carry the actual detection baseline/method; synthetic changes support demonstrations, not causal management claims. |
| Financial portfolio | `projects/05-financial-portfolio-tracker/backend/portfolio_backend/` | Historical adjusted prices, fixed weights, assumed 4.5% risk-free rate, frictionless returns; no local price cache available. Monte Carlo probabilities are conditional on GBM assumptions, and optimized weights are in-sample. No out-of-sample improvement or hedge guarantee established. |
| NYC 311 | `projects/06-operational-efficiency/data-pipeline/03_enrich.py` | Requested 2024 public records; no local processed table available to verify totals. SLA requires both due and closed dates; absent deadlines are unknown. Resolution times exclude still-open cases. Sankey displays dimensions/current status, not event histories. |

## Definitions that must travel with figures

- **Olist:** marketplace includes all statuses; cohorts include delivered orders only. Payments per order are not net profit, platform commission, or item-only revenue. Customer identity is `customer_unique_id`, not order-specific `customer_id`. Missing future cohort periods are censored, not zero.
- **Activation:** verified voucher odds ratio 1.424462, 95% interval 1.111223–1.826000, from `activation_coefficients.parquet`; this is observational association in odds. It does not show that issuing vouchers increases repeat purchases.
- **Insurance:** show paid/incurred basis, method, valuation date, source units, and the assumed expense ratio. Synthetic severity and reporting lags cannot substantiate observed company behavior.
- **Insurance method compatibility:** BF ultimates use paid development with an assumed expected loss ratio of 65%; residuals are expressed against the selected paid/incurred observations. Company-specific BF and method comparison requests return unavailable (422), because precomputed estimates have no company dimension. Missing BF rows stay unknown. The comparison sums precomputed per-line estimates, while the triangle fits CL to pooled selected observations; these can differ. Four regression tests cover basis identities, common comparison denominators, company scope, and missing BF estimates.
- **Experiments:** use original vs modified-outcome labels prominently. Aggregate/segment disagreement alone is not sufficient to diagnose Simpson's paradox. Revenue per assigned user is distinct from converter-only order value.
- **Recommendations:** proposed interventions require validation; no uplift, savings, rollout benefit, or investment performance has been demonstrated by these case studies.

## Reproduction and publication

Validation on 2026-09-05: the cohort parity script passed all checks, including cohort funnel counts, Lorenz concentration, Kaplan–Meier estimates and intervals, and geographic aggregates. The corrected notebook narratives were exported to the existing public HTML paths without rerunning unavailable source datasets. The LaTeX PDF was rebuilt in two successful passes (168 pages).

Run the project pipelines/notebooks with their documented source inputs, then regenerate static JSON and notebook HTML. For cohorts, run `data-pipeline/06_verify_parity.py` to compare published JSON with parquet. Preserve raw missingness and report population filters beside metrics. Update the narrative and executive report together when a finding changes. Historical notebook outputs are retained as research records with review notes; values lacking their original inputs must not be promoted as newly reproduced findings.

The LaTeX reference contains historical examples and is subordinate to these evidence corrections. Its front-matter review note identifies withdrawn interpretations; its PDF must be rebuilt twice when source changes.
