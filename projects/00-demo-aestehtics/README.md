# Airbnb CDMX Analytics Dashboard

## Business Question

How are Mexico City's short-term rental market structured — and what does pricing, geographic concentration, and host behavior tell us about where demand is strongest and supply is thinning?

## Key Findings

- **Cuauhtémoc dominates supply**: 46% of all listings (12,514) sit in a single borough — Roma Norte, Condesa, and Centro Histórico drive the cluster
- **Entire home/apt commands premium pricing**: 71% of listings; price distribution peaks at MXN 1,000–1,500/night vs. MXN 500 for private rooms
- **Enterprise hosts control 40% of supply from 7% of hosts**: Blueground (221 listings), Mr. W (164), and Clau (156) are the top operators — this is a professional market, not casual hosting
- **Outer boroughs show pricing opportunity**: Tlalpan and Cuajimalpa average MXN 2,493 and MXN 2,151 respectively — despite far fewer listings, suggesting undersupplied premium inventory
- **Low availability signals strong demand**: Median availability of 16 days/month; 87% of listings have review scores above 4.5

## Data Source

- **Source**: Inside Airbnb — Mexico City snapshot, March 2025
- **Size**: 27,051 listings × 79 columns
- **Files**: `listings.csv.gz`, `calendar.csv.gz`, `reviews.csv.gz`
- **Limitations**: Price has 12.9% nulls; ratings have 12.6% nulls (new listings without reviews). Only 16 distinct boroughs (ALCALDÍAS) represented — not neighbourhood-level granularity

## Methodology

- **ETL**: Python (pandas) — price cleaning (`$X,XXX.00` → float), null handling, host segmentation, geo sampling to 3,000 points
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
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

1. **Target Tlalpan/Cuajimalpa for growth campaigns**: High avg price (MXN 2,493/2,151) with low listing counts — new hosts here face less competition with premium pricing room
2. **Monitor enterprise host concentration**: Top 5 hosts control ~800 listings — platform dependency risk if any large operator delists
3. **Expand availability analysis**: Calendar data (22MB) not fully utilized — analyzing booking lead times and seasonal patterns would surface demand forecasting opportunities

## How to Reproduce

```bash
# 1. Install Python dependencies
cd data-pipeline
pip install -r requirements.txt

# 2. Download raw data (requires Google Drive access)
# Place listings.csv.gz, calendar.csv.gz, reviews.csv.gz in data-pipeline/raw-data/

# 3. Run ETL — produces 5 JSON files in public/data/airbnb/
python airbnb_etl.py

# 4. Install Node.js dependencies
cd ..
npm install

# 5. Development server
npm run dev

# 6. Production build
npm run build && npm start
```

## Tech Stack

- Python 3.11, pandas 2.x
- Next.js 14.2, TypeScript 5, Tailwind CSS 3.4
- Recharts 2.13, Framer Motion 11, Lucide React
- Deployed on Vercel (static export)
