# Airbnb CDMX Analytics Dashboard

## Business Question

How is Mexico City's short-term rental supply distributed, and which price and host-concentration patterns deserve further investigation?

## Key Findings

- **Cuauhtémoc dominates supply**: 46% of all listings (12,514) sit in a single borough — Roma Norte, Condesa, and Centro Histórico drive the cluster
- **Entire home/apt commands premium pricing**: 71% of listings; price distribution peaks at MXN 1,000–1,500/night vs. MXN 500 for private rooms
- **Enterprise hosts control 40% of supply from 7% of hosts**: Blueground (221 listings), Mr. W (164), and Clau (156) are the top operators — this is a professional market, not casual hosting
- **Asking prices differ by borough**: Higher averages in smaller markets require checks for property mix and outliers before inferring a pricing opportunity.
- **Availability is not occupancy**: The published snapshot has median 30-day availability of 16 days. Unavailable dates may be booked or blocked by hosts; this does not measure realized demand.

## Data Source

- **Source**: Inside Airbnb — Mexico City snapshot, March 2025
- **Size**: 27,051 listings × 79 columns
- **Files**: `listings.csv.gz`, `calendar.csv.gz`, `reviews.csv.gz`
- **Limitations**: Price has 12.9% nulls; ratings have 12.6% nulls (new listings without reviews). Only 16 distinct boroughs (ALCALDÍAS) represented — not neighbourhood-level granularity

## Methodology

- **ETL**: Python (pandas) — price cleaning (`$X,XXX.00` → float), null handling, host segmentation, geo sampling to 3,000 points
- **Frontend**: Shared Next.js 14 application in `../../apps/web`, TypeScript, Tailwind CSS
- **Charts**: Recharts — BarChart (price distribution, neighborhoods), ScatterChart (geo), custom tooltip components
- **Architecture**: Static JSON (5 files < 500 KB total) preloaded at build time via `fs.readFileSync`. No API routes, no database
- **Alternatives considered**: Map library (Leaflet/Mapbox) — deferred for MVP; geo scatter with Recharts ScatterChart used instead

## Results

| Chart | Key Insight |
|---|---|
| Price Histogram | Entire home/apt peaks at MXN 1,000–1,500; private rooms floor at MXN 500 |
| Geo Scatter | Dense cluster in central CDMX; premium listings (amber) ring western edge |
| Neighborhood Ranking | Cuauhtémoc: 12,514 listings; Tláhuac: 40 listings — 300x difference |
| Host Segmentation | 787 enterprise hosts hold 10,778 listings vs. 8,370 casual hosts with 1 each |

## Recommendations

1. **Investigate borough price differences**: Compare similar room types and capacity, inspect missing prices and outliers, and obtain booking evidence before recommending growth campaigns.
2. **Monitor enterprise host concentration**: Top 5 hosts control ~800 listings — platform dependency risk if any large operator delists
3. **Expand availability analysis**: Calendar data (22MB) not fully utilized — analyzing booking lead times and seasonal patterns would surface demand forecasting opportunities

## How to Reproduce

```bash
# 1. Install Python dependencies
# Start from the repository root
cd projects/00-demo-aestehtics/data-pipeline
pip install -r requirements.txt

# 2. Download raw data (requires Google Drive access)
# Place listings.csv.gz, calendar.csv.gz, reviews.csv.gz in data-pipeline/raw-data/

# 3. Run ETL — produces 5 JSON files in public/data/airbnb/
python airbnb_etl.py

# 4. From the repository root, install and start the shared frontend
cd ../../..
npm ci --prefix apps/web
npm run dev
# Airbnb: http://localhost:3000/airbnb/
# Marketplace analysis: http://localhost:3000/olist/
```

For the API-backed Olist analysis, start the consolidated backend in a separate
terminal from the repository root. The static Airbnb analysis does not require it.

```bash
pip install -r backend/requirements.txt
bash backend/dev.sh
# API: http://localhost:8080
```

Build the single static frontend from the repository root:

```bash
npm run build
```

Frontend components live in `apps/web/src/features/market`. The shared site shell,
light/dark themes, and English/Spanish preferences apply to both analyses; the
first-visit defaults are English and light mode. Pipeline outputs remain in this
project's `public/data/airbnb/` and are staged into the shared application.
Legacy frontend source and configuration have been archived outside the repository
and removed. Public artifacts and research remain here; do not recreate a separate frontend.

## Decisions & Trade-offs

| Decision | Alternative | Reason |
|---|---|---|
| Describe asking prices and advertised supply | Infer booked revenue or occupancy | Listing availability includes host blocks and is not a booking ledger. |
| Keep Olist marketplace and cohort populations explicit | Compare their totals as interchangeable | Marketplace ETL retains all order statuses; cohorts include delivered orders only. |

The Airbnb JSON is a historical artifact, updated 2026-03-02; that update date is not the collection date. The stated March 2025 collection date has not been independently reverified against raw files. [Evidence ledger](../../docs/evidence-audit.md).

## Tech Stack

- Python 3.11, pandas 2.x
- Next.js 14.2, TypeScript 5, Tailwind CSS 3.4
- Recharts 2.13, Framer Motion 11, Lucide React
- Static export built through the repository's Cloudflare Pages pipeline; publishing the migration is a separate step
