# CLAUDE.md — 01-insurance-claims-dashboard

Project-level instructions for the Insurance Claims / Loss Reserving dashboard.

## Shared Application Development

The frontend is owned by `../../apps/web`; insurance components live in
`apps/web/src/features/insurance` relative to the repository root. Start the
shared frontend from the repository root:

```bash
npm ci --prefix apps/web
npm run dev
# http://localhost:3000/insurance/
```

In a separate terminal, also from the repository root:

```bash
pip install -r backend/requirements.txt
bash backend/dev.sh
# Consolidated API on http://localhost:8080
```

Browser access is through port 3000; the shared development server forwards API
requests to port 8080. Do not introduce a separate project frontend or backend
development port.

## Backend Proxy Architecture

The browser uses the shared application's same-origin API path:

```
Browser → localhost:3000/api/insurance/<path> → shared Next.js proxy → localhost:8080/insurance/<path>
```

Development rewrites are defined in `apps/web/next.config.js`. Production API
proxying belongs to the repository's Cloudflare Pages Functions. Project-specific
frontend environment variables are not needed for local development.

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

## Shared Theme and Language Rules

Use the common site shell, Inter typography, semantic surfaces, and shared
English/Spanish preference. English and light mode are the first-visit defaults.
Translate visitor-facing React content explicitly; retain original research
artifacts and their language.

- LOB-specific colors (`--lob-auto`, `--lob-workers`, etc.) have separate light/dark values in `apps/web/src/app/globals.css`.
- Ratio classification colors (`--ratio-profitable`, `--ratio-breakeven`, `--ratio-loss`) also have dark-mode overrides.
- Triangle heatmap colors (`--triangle-*`) and market heatmaps (`--heatmap-*`) use the shared theme tokens.
- After any color change, verify both shared themes, including chart labels, tooltips, and projected cells. Do not hardcode project-specific page backgrounds.

## Consolidated Backend

The supported development entrypoint is `backend/main.py` at the repository
root, started by `bash backend/dev.sh`. Insurance routes are mounted under
`/insurance`, for example `/insurance/api/v1/loss-triangle`. Backend source,
pipelines, notebooks, and existing `public/` artifacts remain project-owned.
Superseded frontend source/configuration copies have been archived outside the
repository and removed. Do not recreate a project-local frontend or treat local
cleanup as proof of deployment or hosting retirement; consult `../../docs/retirement.md`.

## Key Actuarial Concepts

- **Loss Triangle**: Matrix of cumulative losses by accident year (rows) and development lag (columns). Upper-left is observed, lower-right is projected.
- **Chain-Ladder (CL)**: Standard method — multiply observed values by development factors to project ultimate losses.
- **Bornhuetter-Ferguson (BF)**: Moderates CL by blending with an a-priori expected loss ratio.
- **IBNR**: Incurred But Not Reported — the reserve for claims that have occurred but aren't yet in the books.
- **Loss Ratio**: Incurred Losses / Earned Premium. Below 100% = profitable underwriting.
- **Combined Ratio**: Loss Ratio + Expense Ratio. Below 100% = profitable overall.
