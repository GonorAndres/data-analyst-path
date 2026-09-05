# 01 -- Insurance Claims Dashboard: Reservas y Siniestralidad

## Business Question

**How much should an insurance portfolio reserve for unpaid claims, and which lines of business are profitable?**

This project applies actuarial reserving methods (chain-ladder, Bornhuetter-Ferguson) to real regulatory data from the NAIC Schedule P, decomposing losses by frequency and severity across 6 lines of business. It answers the questions every P&C insurance CFO needs to know: are we reserving enough, and are we pricing correctly?

## Key Findings

- **Two evidence types:** Schedule P triangles are regulatory aggregates; individual claim severity, frequency, and reporting-lag views use generated claims and do not describe actual policyholders.
- Paid Chain-Ladder estimates **ultimate minus paid**, including outstanding case reserves as well as IBNR. Incurred Chain-Ladder estimates **ultimate minus reported incurred**. These quantities must not share an unexplained IBNR label.
- Combined ratios add an **assumed 30% expense ratio**. Loss ratios below 100% alone do not establish underwriting profitability.
- Chain-Ladder and Bornhuetter-Ferguson are alternative point estimates. Their difference is method sensitivity, not a confidence interval or evidence of reserve adequacy.
- Local processed insurance parquet was unavailable in the 2026-09-05 audit. The case uses a separately identified API snapshot; earlier dollar totals and LOB rankings are withdrawn here pending independent reproduction and monetary-unit verification.

## Data Source

| Attribute | Value |
|-----------|-------|
| **Source** | CAS Loss Reserving Database -- NAIC Schedule P |
| **Period** | Accident years 1988-1997, development observed through 2006 |
| **Size** | 6 LOBs, ~30 companies, 3,000 triangle rows + 50,000 synthetic claims |
| **Nature** | Real regulatory filings (incurred + paid triangles) + synthetic claim-level data calibrated to CAS aggregates |
| **Limitations** | Schedule P is aggregate-level (no individual claims); synthetic data uses simplified distributional assumptions; expense ratio assumed at 30% (varies by company/LOB in practice) |

## Methodology

### Tools
- **Python** (pandas, numpy, scipy, chainladder-python): Data pipeline, reserve computation, claim generation
- **SQL** (PostgreSQL dialect): 5 analytical queries covering claims, loss ratios, triangles, and combined ratios
- **Jupyter Notebooks**: 5 notebooks documenting the analytical narrative
- **FastAPI**: Backend API serving processed data
- **Next.js + Recharts**: Shared frontend in `../../apps/web`, with common light/dark themes and English/Spanish preferences

### Approach
1. **Data ingestion**: Downloaded 6 CAS Schedule P CSVs, cleaned column naming inconsistencies (each Part uses different suffixes), selected 5 representative companies per LOB by premium volume.
2. **Synthetic claim generation**: Created ~50K individual claims using lognormal severity, Poisson frequency, exponential report lag, and gamma settlement distributions -- calibrated to match CAS aggregate patterns.
3. **Reserve estimation**: Built loss triangles truncated to the 12/31/1997 valuation date, computed volume-weighted age-to-age development factors, projected ultimates using both chain-ladder and Bornhuetter-Ferguson methods.
4. **Profitability analysis**: Computed loss ratios (reported vs. ultimate), combined ratios (with 30% assumed expense ratio), and frequency-severity decomposition by LOB and accident year.

### Alternatives Considered
- **chainladder-python library**: Used for verification; manual implementation chosen for educational transparency.
- **Mack's method** for confidence intervals: Deferred to a future iteration.
- **Stochastic bootstrapping**: Out of scope for this DA-focused project (belongs in data-science repo).
- **Power BI**: Originally planned, but Next.js + Recharts chosen for full control over dark/light mode theming, server-side data proxying, and seamless deployment without Windows/PBI Desktop dependency.

## Results

### Interactive Dashboard
The dashboard at `http://localhost:3000/insurance/` provides:
- KPI bar with earned premium, loss ratio, combined ratio, and IBNR estimate
- Loss triangle heatmap with incurred/paid toggle and IBNR annotations
- IBNR waterfall showing Paid + Case Reserve + IBNR = Ultimate
- Frequency-severity dual-axis chart by accident year
- Loss ratio by LOB with reported vs. ultimate toggle
- Combined ratio trend with stacked area (loss + expense)
- Claim severity distribution and report lag analysis

### Notebooks
| # | Notebook | Key Output |
|---|----------|------------|
| 01 | Data Ingestion and Cleaning | CAS data provenance, schema documentation |
| 02 | Claims Exploration | Severity distributions, report lag patterns, outlier detection |
| 03 | Frequency-Severity | Pure premium decomposition, YoY driver analysis |
| 04 | Loss Triangles | Step-by-step chain-ladder, CL vs. BF comparison |
| 05 | Loss Ratios and Combined | Profitability analysis, waterfall decomposition |

[![nbviewer](https://img.shields.io/badge/render-nbviewer-orange.svg)](https://nbviewer.org/github/GonorAndres/data-analyst-path/blob/main/projects/01-insurance-claims-dashboard/notebooks/01_data_ingestion_cleaning.ipynb) [![nbviewer](https://img.shields.io/badge/render-nbviewer-orange.svg)](https://nbviewer.org/github/GonorAndres/data-analyst-path/blob/main/projects/01-insurance-claims-dashboard/notebooks/02_eda_claims_exploration.ipynb) [![nbviewer](https://img.shields.io/badge/render-nbviewer-orange.svg)](https://nbviewer.org/github/GonorAndres/data-analyst-path/blob/main/projects/01-insurance-claims-dashboard/notebooks/03_frequency_severity.ipynb) [![nbviewer](https://img.shields.io/badge/render-nbviewer-orange.svg)](https://nbviewer.org/github/GonorAndres/data-analyst-path/blob/main/projects/01-insurance-claims-dashboard/notebooks/04_loss_triangles.ipynb) [![nbviewer](https://img.shields.io/badge/render-nbviewer-orange.svg)](https://nbviewer.org/github/GonorAndres/data-analyst-path/blob/main/projects/01-insurance-claims-dashboard/notebooks/05_loss_ratios_combined.ipynb)

## Recommendations

1. Reproduce selected-company triangles at the stated valuation date and verify units before comparing reserve methods.
2. Evaluate tail development, company mix, and the assumed 30% expense ratio before making pricing recommendations.
3. Keep simulated claim-level illustrations separate from observed regulatory evidence.
4. Assess uncertainty statistically; do not interpret the CL/BF gap as a confidence interval.

## Decisions & Trade-offs

| Decision | Alternative | Reason |
|---|---|---|
| Separate observed triangles and simulated claims | Blend them into one finding | The sources support different inferences. |
| Identify method and expense assumptions | Publish unconditional profitability rankings | Historical selected-company aggregates do not establish current profitability. |

[Evidence ledger](../../docs/evidence-audit.md).

## How to Reproduce

```bash
# 1. Install Python dependencies
cd projects/01-insurance-claims-dashboard
pip install -r data-pipeline/requirements.txt

# 2. Run the data pipeline
cd data-pipeline
python3 01_download_cas.py
python3 02_clean_triangles.py
python3 03_generate_claims.py
python3 04_compute_reserves.py

# 3. Verify parquets (4 files in data/processed/)
cd ..
ls data/processed/

# 4. Run Jupyter notebooks
jupyter notebook notebooks/

# 5. From the repository root, start the consolidated backend
cd ../..
pip install -r backend/requirements.txt
bash backend/dev.sh
# API: http://localhost:8080/insurance/
```

In another terminal, from the repository root:

```bash
npm ci --prefix apps/web
npm run dev
# Open http://localhost:3000/insurance/
```

Edit dashboard components in `apps/web/src/features/insurance`; the shared shell,
theme tokens, and language preference belong to `apps/web`. English and light
mode are the first-visit defaults. Browser requests use `/api/insurance`, which
the shared development server forwards to the consolidated backend. Superseded
frontend source and configuration have been archived outside the repository and
removed; backend, public artifacts, and research remain here.
