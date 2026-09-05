# Case-study presentation

The portfolio is organized for a hiring manager to understand the analyst's question, evidence, reasoning, and limits before using a dashboard. It contains seven cases and eight analytical entry points; Olist's marketplace and retention views share a case but retain separate populations.

## Reading and exploration

Every root analysis route opens a case narrative. `?view=explore` opens its existing dashboard and `?view=methods` opens source material and reports. Historical `?section=` bookmarks open exploration; selecting its default section retains `view=explore`. Nested cohort and notebook routes remain accessible. Browser back, forward, and reload preserve the view.

Narratives and evidence snapshots do not depend on API availability. Exploration retains domain-specific filters and explicit loading, error, and empty states. Filters do not modify the fixed story snapshots. General reading guidance must not masquerade as a finding computed for the current selection.

The shared case experience owns narrative navigation, provenance, reading order, and research links. Domain chart containers delegate to `AnalysisFigure`, which gives exploration a common title, description, chart, and interpretation hierarchy. `EvidenceFigure` provides the case-specific explanations. Light/dark and English/Spanish preferences remain shared across routes.

## Editorial system

Use the shared Inter family, warm paper surfaces, charcoal text, and restrained blue accent. Project identity comes from the question and appropriate figure, not a separate theme. Text should state the business question, explain what was observed, distinguish inference from evidence, and describe a defensible next action. Figures use labeled quantities, sources, observation windows, and visible assumptions. Synthetic data and modified outcomes are identified near the affected content.

The insurance diagram distinguishes observed development from unobserved periods and projected unpaid loss from pure IBNR. The cohort diagram distinguishes cumulative repeat purchasing from monthly activity. Constructed experiment and portfolio figures are explanatory scenarios, not measured experiment or historical return results. The 311 diagram explains current request status without claiming measured intermediate durations.

## Evidence maintenance

`apps/web/src/lib/case-studies.ts` owns typed bilingual editorial content, classifications, and research links. The existing project registry retains route ownership. Snapshot inputs remain with original research; `scripts/build-evidence-snapshots.mjs` creates the small narrative JSON and records SHA-256 hashes of every input.

Run `npm run evidence:build` after intentionally updating the retained artifacts. Review the numerical and population changes and update the review date. `npm run evidence:check` verifies deterministic reproduction; the production build runs this check before exporting. The insurance capture is API-derived and does not claim independent raw-source verification. Original API field names are retained in that artifact, with corrected interpretation in the UI.

The static asset stage preserves old notebook URLs and exposes original notebooks, reports, and pipeline source under `/research/projects/<project>/`. The audit and technical reference are available under `/research/`. Update original project artifacts, not generated `apps/web/public` or `dist` copies. New research source paths participate in collision detection.

## Verification

Run the production build, both TypeScript checks, evidence check, and the browser suite. The case-study tests cover every narrative without API requests, synthetic/observed classifications, view history, legacy section bookmarks, research downloads, keyboard figure controls, and both languages/themes. Existing dashboard tests use exploration routes and continue checking populated/error/empty states, filter isolation, reports, and 390/768/1440-pixel layouts.

KPI baseline and report changes have focused Python tests. Reproduce KPI PDFs with `projects/04-executive-kpi-report/backend/regenerate_reports.py` after regenerating seeded data when needed. Cohort parity checks compare published JSON with retained parquet. Rebuild the LaTeX reference twice whenever its sources change.

Deployment and git actions require separate user authorization.
