# Presentation verification — 2026-09-05

Status: implemented and verified locally; not committed or deployed.

| Check | Result |
|---|---|
| `npm run build:fast` | Passed; 18 static pages generated, 15 canonical application routes |
| Frontend and Functions TypeScript checks | Passed |
| `npm run evidence:check` | Passed; retained source hashes and generated values match |
| Playwright browser suite | 73 passed, no retries, 1.4 minutes |
| KPI anomaly/report Python regression suite | 12 passed |
| Insurance reserve-basis Python regression suite | 4 passed |
| Cohort artifact/parquet parity | All checks passed |
| Research artifacts | 30 notebooks reviewed, 25 existing notebook HTML exports regenerated; bilingual KPI PDFs regenerated; LaTeX PDF rebuilt twice |
| Visual review | Nine desktop home/case captures, insurance mobile and dark; final home, insurance, and KPI captures inspected |

The browser command used the installed Chrome: `CHROMIUM_EXECUTABLE_PATH=/bin/google-chrome npm run test:e2e -- --retries=0`. It verified all eight case roots without API requests, report/source downloads, legacy sections, view history, keyboard controls and focus, filter isolation, populated/empty/error behavior, and responsive layouts in both themes. The local screenshot script blocks APIs and analytics.

The initial browser run exposed a legacy-section navigation regression. Selecting the dashboard's default tab now retains exploration; the final suite includes that regression and passes. Unsupported insurance company-specific method comparisons are disabled and make no comparison request.

Remaining limits: some original project input datasets are unavailable locally. Their historical outputs are explicitly qualified in the [evidence audit](evidence-audit.md), rather than presented as independently reproduced. The insurance story snapshot preserves a dated public API response. Constructed figures and generated SaaS results identify their synthetic provenance.

Non-failing tooling output: one existing FastAPI `regex` deprecation warning; occasional local workerd broken-pipe logs on notebook navigation, with no related browser errors or server failure.
