# A/B Test Lab -- E-Commerce Conversion Experiment Dashboard

> **Analyst Flavor:** Product/Growth | **Tools:** Python, Next.js, FastAPI | **Status:** Complete

## Business Question

Did an e-commerce landing page redesign significantly improve conversion rates? Can we confidently recommend rolling it out to all users -- accounting for statistical significance, practical significance, revenue impact, and segment-level heterogeneous effects?

## Key Findings

- **Aggregate result**: Treatment conversion (12.33%) beats control (12.04%) with p=0.017 -- statistically significant at alpha=0.05, but with a small effect size (Cohen's h = 0.009)
- **Simpson's Paradox**: Aggregate result is positive, but treatment *hurts* returning users (11.82% vs 12.28%). The lift is driven entirely by new users on mobile
- **Revenue uplift**: Treatment converters spend ~$67 vs $61 for control (+9.6% AOV), making the revenue case stronger than the conversion case
- **Device heterogeneity**: Treatment excels on mobile (+8.2% lift) but underperforms on desktop (-4.5%) and tablet (-4.5%)
- **Bayesian confirmation**: P(Treatment > Control) = 99.2%, expected loss if wrong is near zero

## Data Source

- **Base**: [Udacity E-Commerce A/B Test](https://www.kaggle.com/datasets/zhangluyuan/ab-testing) -- ~294K users, binary conversion, Jan 2017
- **Enrichment**: Synthetic columns (device, browser, country, revenue, session duration, pages viewed, user segment, traffic source) added with seed=42 for reproducibility
- **Heterogeneous treatment effects** baked into enrichment to create analytical depth (Simpson's paradox, device interactions)

## Methodology

- **Frequentist**: Two-proportion z-test, chi-squared, Wilson confidence intervals, Cohen's h effect size
- **Bayesian**: Beta-Binomial conjugate model, Monte Carlo P(B>A), expected loss, credible intervals
- **Power analysis**: Sample size calculations, MDE curves, runtime estimation
- **Sequential monitoring**: O'Brien-Fleming spending boundaries, cumulative z-statistic tracking
- **Segment analysis**: Treatment effects by device, country, user segment, traffic source; Simpson's paradox detection

## Architecture

```
Next.js 14 (port 3053)  -->  FastAPI (port 2053)  -->  Enriched Parquet
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

# 3. Backend
cd backend && PYTHONPATH=. uvicorn abtest_backend.main:app --port 2053

# 4. Frontend (separate terminal)
npm install && npm run dev
# Open http://localhost:3053/abtest
```

## Recommendations

1. **Do not ship universally** -- the aggregate lift masks a negative effect on returning users
2. **Ship for mobile new users only** -- strongest positive effect (+8.2% conversion, +9.6% AOV)
3. **Investigate desktop regression** -- the new page underperforms on desktop; run a desktop-specific test
4. **Revenue focus** -- even where conversion lift is marginal, AOV uplift makes the treatment worthwhile for converters

## Skills Demonstrated

- Experimental design and statistical testing rigor (frequentist + Bayesian)
- Simpson's Paradox detection and communication
- Interactive power analysis / experiment design tools
- Sequential monitoring and multiple testing awareness
- Full-stack dashboard (Next.js + FastAPI) with editorial design system
