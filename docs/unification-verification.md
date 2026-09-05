# Unified frontend verification

Local verification completed on 2026-09-05 and was repeated successfully after approved source cleanup. Production deployment and retirement results are recorded separately in [retirement](retirement.md).

- `npm run build:fast`: passed; one Next.js export, 15 canonical application routes and 44 staged research assets.
- `npm run typecheck:web`: passed.
- `npm run typecheck:functions`: passed.
- `npm run test:e2e`: all 56 Chromium tests passed against the local Pages runtime.
- Additional operations/portfolio checks: 32 failure-state combinations, 20 populated section/viewport checks, and 16 live language/theme switches passed.
- Mobile and desktop screenshots inspected; automated overflow checks cover all eight analyses at 390, 768, and 1440 pixels in both themes.

Browser fixtures cover unavailable, empty, and populated API responses. They do not establish production API availability or certify the correctness of every underlying analytical model. See [analytical follow-ups](analysis-followups.md).

The local Pages runtime emitted broken-pipe messages during browser navigation/teardown; the server remained available and the complete suite passed. Do not interpret this run as having no runtime diagnostics.

After approval, the frontend was deployed, legacy source/hosting retired, and all 21 live health probes passed. No git actions were performed. See the [retirement ledger](retirement.md) for the deployment identity, source recovery archive, and repository/monitoring handoff.
