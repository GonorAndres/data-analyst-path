# A/B Test Lab -- E-Commerce Conversion Experiment Dashboard

> **Analyst Flavor:** Product/Growth | **Tools:** Python, Next.js, FastAPI | **Status:** Complete

## Business Question

Did an e-commerce landing page redesign significantly improve conversion rates? Can we confidently recommend rolling it out to all users -- accounting for statistical significance, practical significance, revenue impact, and segment-level heterogeneous effects?

## Key Findings

- **Evidence classification: modified-outcome demonstration.** Conversion outcomes themselves are changed in `data-pipeline/03_enrich.py`; this is not a reanalysis of the original experiment's treatment effect.
- The seeded enrichment flips 1.5% of mobile-treatment non-converters into converters, then flips 8% of returning-treatment converters back. These probabilities apply to eligible rows, not to the whole population.
- Device, customer segment, and revenue are simulated. Their treatment differences illustrate analytical methods; they do not establish customer behavior or commercial revenue gains.
- An aggregate/segment disagreement can indicate heterogeneous effects. It is not sufficient by itself to establish Simpson's paradox, which requires checking the direction within the relevant strata and their weights.
- Exact conversion rates, p-values, and posterior probabilities must be recomputed from the enriched parquet for the selected population. That parquet was unavailable in the 2026-09-05 local evidence audit; historical headline numbers are withdrawn from this summary.

## Data Source

- **Base**: [Udacity E-Commerce A/B Test](https://www.kaggle.com/datasets/zhangluyuan/ab-testing) -- ~294K users, binary conversion, Jan 2017
- **Enrichment**: Synthetic columns (device, browser, country, revenue, session duration, pages viewed, user segment, traffic source) AND modified `converted` outcomes, with seed=42 for reproducibility
- **Heterogeneous treatment effects** baked into enrichment to create analytical depth (Simpson's paradox, device interactions)

## Methodology

- **Frequentist**: Two-proportion z-test, chi-squared, Wilson confidence intervals, Cohen's h effect size
- **Bayesian**: Beta-Binomial conjugate model, Monte Carlo P(B>A), expected loss, credible intervals
- **Power analysis**: Sample size calculations, MDE curves, runtime estimation
- **Sequential monitoring**: O'Brien-Fleming spending boundaries, cumulative z-statistic tracking
- **Segment analysis**: Treatment effects by device, country, user segment, traffic source; Simpson's paradox detection

## Architecture

```
apps/web (port 3000)  -->  Consolidated FastAPI (port 8080)  -->  Enriched Parquet
    |                            |
    Tab-based dashboard          6 statistical endpoints
    SWR data fetching            scipy + numpy computations
    Recharts visualizations      No heavy ML libraries
```

## Dashboard Tabs

| Tab | Content |
|-----|---------|
| Executive Overview | Verdict card (SHIP/DON'T SHIP), KPIs, revenue projection, SRM test |
| Frequentist | Confidence intervals, p-value, Cohen's h, multi-metric comparison |
| Bayesian | Posterior distributions, P(B>A), expected loss, credible intervals |
| Segments | Treatment effect by dimension, heatmap, Simpson's Paradox visualization |
| Power & Design | Interactive calculator with sliders, MDE curve, runtime estimator |
| Sequential | Cumulative conversion, O'Brien-Fleming boundaries, p-value evolution |

## How to Reproduce

```bash
# 1. Setup
cd projects/03-ab-test-analysis
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Data pipeline (requires Kaggle credentials)
python data-pipeline/01_download.py
python data-pipeline/02_clean.py
python data-pipeline/03_enrich.py

# 3. From the repository root, start the consolidated backend
cd ../..
pip install -r backend/requirements.txt
bash backend/dev.sh
# API: http://localhost:8080/abtest/
```

In a separate terminal, from the repository root:

```bash
npm ci --prefix apps/web
npm run dev
# Open http://localhost:3000/abtest/
```

Frontend code lives in `apps/web/src/features/abtest`. It uses the common site
shell, light/dark themes, and English/Spanish preferences; English and light mode
are the first-visit defaults. Browser requests use `/api/abtest` through the
shared development proxy. Project pipelines, notebooks, and `public/` artifacts
remain here. Legacy frontend source and configuration have been archived outside
the repository and removed.

## Recommendations

1. Use the demonstration to specify a new experiment with original outcomes, a primary metric, minimum worthwhile effect, and planned segment checks.
2. Validate allocation, exposure, and stopping rules before interpreting a treatment estimate.
3. Evaluate revenue per assigned user, including non-converters; converter-only average order value can reflect selection effects.
4. Treat all rollout decisions here as hypothetical. The generated segment and revenue patterns cannot justify a production launch.

## Decisions & Trade-offs

| Decision | Alternative | Reason |
|---|---|---|
| Label modified outcomes at the opening | Describe only extra columns as synthetic | Readers need to know that even conversion estimates are simulated. |
| Present segment checks as exploratory | Treat every subgroup p-value as confirmatory | Multiple comparisons and designed heterogeneity limit interpretation. |

Evidence definitions and audit limits: [portfolio evidence ledger](../../docs/evidence-audit.md).

## Skills Demonstrated

- Experimental design and statistical testing rigor (frequentist + Bayesian)
- Simpson's Paradox detection and communication
- Interactive power analysis / experiment design tools
- Sequential monitoring and multiple testing awareness
- Full-stack dashboard (Next.js + FastAPI) within the shared bilingual, light/dark design system
