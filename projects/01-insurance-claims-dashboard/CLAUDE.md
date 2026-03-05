# CLAUDE.md — 01-insurance-claims-dashboard

Project-level instructions for the Insurance Claims / Loss Reserving dashboard.

## Local Development Ports

- **Next.js frontend**: `PORT=3051 npm run dev` → `http://localhost:3051`
- **FastAPI backend**: always run on port **2051**
  ```bash
  cd backend && python3 -m uvicorn insurance_backend.main:app --host 0.0.0.0 --port 2051
  ```
- Only **port 3051** needs to be forwarded to your local machine. Port 2051 is internal — the browser never calls it directly.

## Backend Proxy Architecture

Same pattern as 00-demo. The browser never calls FastAPI directly:

```
Browser → localhost:3051/api/insurance/<path> → Next.js (server-side) → localhost:2051/<path>
```

Defined in `next.config.js` using `rewrites()`. Controlled by `INSURANCE_BACKEND_URL` (server-side env var).

**`.env.local` (dev):**
```
INSURANCE_BACKEND_URL=http://localhost:2051
```

## Data Sources

- **CAS Schedule P**: Real NAIC regulatory filings from the Casualty Actuarial Society. 6 LOBs, accident years 1988-1997, development observed through 2006.
- **Synthetic claims**: ~50K individual claims generated with actuarially-realistic distributions (lognormal severity, Poisson frequency, exponential report lag, gamma settlement).

### Data Pipeline

```bash
cd data-pipeline
python3 01_download_cas.py        # Download 6 CSVs from CAS
python3 02_clean_triangles.py     # Clean → triangles.parquet
python3 03_generate_claims.py     # Generate → claims_synthetic.parquet
python3 04_compute_reserves.py    # Chain-ladder + BF → ibnr_results.parquet + lob_summary.parquet
```

## Dark / Light Mode Contrast Rule

Same rules as 00-demo. Additionally:

- LOB-specific colors (`--lob-auto`, `--lob-workers`, etc.) have separate light/dark values in `globals.css`.
- Ratio classification colors (`--ratio-profitable`, `--ratio-breakeven`, `--ratio-loss`) also have dark-mode overrides.
- Triangle heatmap colors (`--triangle-*`) follow the same pattern as 00-demo's `--heatmap-*` vars.
- After any color change: verify on `#FAFAF8` (light bg) AND `#141414` (dark bg).

## Consolidated Backend

This backend can also run as part of the unified portfolio API at `backend/main.py` (repo root). In that mode, all routes are prefixed with `/insurance` (e.g., `/insurance/api/v1/loss-triangle`). Set `INSURANCE_BACKEND_URL=http://localhost:8080/insurance` in `.env.local` to use the consolidated backend.

## Key Actuarial Concepts

- **Loss Triangle**: Matrix of cumulative losses by accident year (rows) and development lag (columns). Upper-left is observed, lower-right is projected.
- **Chain-Ladder (CL)**: Standard method — multiply observed values by development factors to project ultimate losses.
- **Bornhuetter-Ferguson (BF)**: Moderates CL by blending with an a-priori expected loss ratio.
- **IBNR**: Incurred But Not Reported — the reserve for claims that have occurred but aren't yet in the books.
- **Loss Ratio**: Incurred Losses / Earned Premium. Below 100% = profitable underwriting.
- **Combined Ratio**: Loss Ratio + Expense Ratio. Below 100% = profitable overall.
