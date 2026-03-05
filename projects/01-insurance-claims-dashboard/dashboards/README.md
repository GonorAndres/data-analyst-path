# Insurance Claims Dashboard

## Implementation

This dashboard is built with **Next.js 14 + Recharts**, not Power BI. The decision was driven by full theming control (dark/light mode), server-side API proxying, and deployment flexibility without Windows dependencies.

The browser communicates only with the Next.js server (`localhost:3051`), which proxies API calls to the FastAPI backend (`localhost:2051`) via `next.config.js` rewrites.

## Screenshots

Screenshots are stored in `screenshots/`:

| File | Description |
|------|-------------|
| `dashboard-light-full.png` | Full dashboard in light mode |
| `dashboard-dark-full.png` | Full dashboard in dark mode |
| `triangle-heatmap-light.png` | Loss triangle heatmap detail (light) |
| `triangle-heatmap-dark.png` | Loss triangle heatmap detail (dark) |

## Dashboard Sections

1. **KPI Bar** -- Earned premium, loss ratio, combined ratio, IBNR estimate
2. **Loss Triangle Heatmap** -- Cumulative losses by accident year and development lag, with incurred/paid toggle
3. **IBNR Waterfall** -- Paid + Case Reserve + IBNR = Ultimate decomposition
4. **Frequency-Severity** -- Dual-axis chart: claim count and average claim cost by accident year
5. **Loss Ratio by LOB** -- Reported vs. ultimate loss ratio per line of business
6. **Combined Ratio Trend** -- Stacked area chart (loss ratio + expense ratio)
7. **Severity Distribution** -- Histogram of individual claim amounts and report lag analysis

## How to Run Locally

```bash
# Terminal 1: Backend
cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 2051

# Terminal 2: Frontend
PORT=3051 npm run dev

# Open http://localhost:3051
```
