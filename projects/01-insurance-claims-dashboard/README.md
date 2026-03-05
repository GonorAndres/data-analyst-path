# 01 -- Insurance Claims Dashboard: Reservas y Siniestralidad

## Business Question

**How much should an insurance portfolio reserve for unpaid claims, and which lines of business are profitable?**

This project applies actuarial reserving methods (chain-ladder, Bornhuetter-Ferguson) to real regulatory data from the NAIC Schedule P, decomposing losses by frequency and severity across 6 lines of business. It answers the questions every P&C insurance CFO needs to know: are we reserving enough, and are we pricing correctly?

## Key Findings

- **Private Passenger Auto** and **Product Liability** are the only profitable lines (combined ratio < 100%). Auto's high volume smooths volatility; product liability benefits from favorable reserve development.
- **Medical Malpractice** shows the highest loss ratio (~280%) with extremely long development tails -- claims take 3-5x longer to report than auto claims, creating significant IBNR uncertainty.
- **Paid loss development** factors range from 1.8x (auto, lag 1-2) to 6.1x (med mal, lag 1-2), demonstrating why actuaries need 10+ years of development data for long-tail lines.
- **Chain-Ladder vs. Bornhuetter-Ferguson**: CL produces larger IBNR estimates for recent accident years where little data is available; BF moderates these projections with a-priori loss ratios -- a critical difference for regulatory reporting.
- The portfolio's total IBNR (paid CL) is ~$20.4M across all LOBs, with Private Passenger Auto contributing 76% due to its volume.

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
- **Next.js + Recharts**: Interactive dashboard with dark/light mode

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
The dashboard at `localhost:3051` provides:
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

1. **Re-evaluate Medical Malpractice and Workers' Comp pricing**: Both lines show combined ratios > 200%, suggesting systematic under-pricing or adverse selection.
2. **Implement tail factors for long-tail lines**: Our 10-year development period may be insufficient for med mal and product liability.
3. **Monitor paid-to-incurred ratio as an early warning**: When case reserves diverge significantly from historical patterns, it signals potential reserve inadequacy.
4. **Quantify reserve uncertainty**: The CL and BF methods produce point estimates. A range of estimates (e.g., Mack's method) would better inform capital allocation decisions.

## How to Reproduce

```bash
# 1. Install Python dependencies
pip install -r data-pipeline/requirements.txt

# 2. Run the data pipeline
cd data-pipeline
python3 01_download_cas.py
python3 02_clean_triangles.py
python3 03_generate_claims.py
python3 04_compute_reserves.py

# 3. Verify parquets (4 files in data/processed/)
ls data/processed/

# 4. Run Jupyter notebooks
jupyter notebook notebooks/

# 5. Start the backend API
cd backend && python3 -m uvicorn insurance_backend.main:app --port 2051

# 6. Start the frontend dashboard (in another terminal)
npm install && PORT=3051 npm run dev

# 7. Open http://localhost:3051
```
