# Legacy retirement — completed 2026-09-05

The user explicitly approved deployment and the exact legacy cleanup. All source and hosting targets below were retired on 2026-09-05; identities were rechecked before deletion. No git commands, commits, or pushes were performed during retirement. The user subsequently approved committing the migration and opening a PR to remote `main`.

## Execution and recovery record

- Archived and byte-compared 271 source/configuration files before cleanup. Durable archive: `/home/exedev/backups/data-analyst-retirement-20260905/legacy-source.tar.gz`.
- Archive SHA-256: `39d42a3435fff471fc82c1e432b94586e097652bc2177c1ebac31b940aaeee11`.
- Removed 267 superseded source/configuration files first, then four redirect files after hosted retirement. Removed the approved generated caches and empty source directories. Research, public artifacts, backend modules, and user environment files were preserved.
- Post-cleanup production build, both TypeScript checks, and all 56 browser tests passed.
- Deployed to the existing Pages production branch `main`: `https://e85b7268.data-analyst-hub.pages.dev`. Canonical site: `https://data-analyst.gonor.me`; verified build marker `g2A0cC24fBWSUB8Zw9GeN`.
- Live browser checks passed for all eight analyses, shared navigation, language/theme persistence, static datasets, and absence of JavaScript page errors.
- All six exact Vercel deletions succeeded. Provider inventory now contains only the unrelated gmm-explorer, studysoa, and graph-relation-db projects.
- Cloud Run deleted `da-cohort-streamlit`; the `da-*` inventory now contains only `da-portfolio-api`.
- Removed local cohort workflow and disabled GitHub workflow `340937068` (`disabled_manually`). No queued/running legacy workflow executions remained.
- Removed obsolete redirect code and the retired registry entry. At 02:26 UTC, the updated health registry reported **0 failures / 21 probes**, including the canonical routes, proxies, datasets, retained API, and all six backend modules.
- Canonical DNS record `0667c6303fc104562b7e7bd2d2e5c19f` points to `data-analyst-hub.pages.dev` and was preserved. The claims/demos/kpi names already had no authoritative DNS records (NXDOMAIN). No DNS writes were needed. The stale canonical Vercel attachment disappeared with its old project.

Local source can be recovered from the archive. Deleted hosting projects and deployment history are not restored by that archive; recreating them would require an explicit new decision. Retained Pages deployment history remains available for frontend rollback.

### Repository and monitoring handoff

The deployment used the verified local artifact without git inspection. Repository publication is handled by a separately approved feature-branch commit and PR to `main`, without automatic merge. Merge that PR before another automated hub deployment; `main` retains the earlier frontend build workflow until then. The retired cohort workflow is already disabled remotely and cannot run automatically.

The health workflow was found `disabled_inactivity`; it was not re-enabled against the old remote registry, which still lists the retired service. After publishing the corrected registry, re-enable monitoring with explicit approval. No credentials were revoked or removed.

## Local source cleanup

The superseded `src` directory and frontend configuration files were removed from each directory below. The project directories themselves were preserved.

| Superseded frontend root | Replacement feature |
|---|---|
| `projects/00-demo-aestehtics` | `apps/web/src/features/market` |
| `projects/01-insurance-claims-dashboard` | `apps/web/src/features/insurance` |
| `projects/02-ecommerce-cohort-analysis/web` | `apps/web/src/features/cohorts` |
| `projects/03-ab-test-analysis` | `apps/web/src/features/abtest` |
| `projects/04-executive-kpi-report` | `apps/web/src/features/kpi` |
| `projects/05-financial-portfolio-tracker` | `apps/web/src/features/portfolio` |
| `projects/06-operational-efficiency` | `apps/web/src/features/operations` |

Exact frontend configuration names: `package.json`, `package-lock.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `next-env.d.ts`, and `tsconfig.tsbuildinfo`, where present. Generated `.next`, `out`, and `node_modules` directories in those seven roots may also be removed after the source backup is verified.

**Preserve** every `public` directory (active build inputs), Python backend, pipeline, SQL file, notebook, dataset, report, README, and user environment file. In particular, keep `projects/02-ecommerce-cohort-analysis/web/public`; do not delete the whole `web` directory.

Additional obsolete targets:

- `projects/02-ecommerce-cohort-analysis/streamlit`
- `projects/02-ecommerce-cohort-analysis/Dockerfile` (the retired Streamlit image, not the active API Dockerfile)
- `ops/vercel-redirects` and `ops/cohort-redirect` after their hosted services are retired
- `.github/workflows/deploy-cohort-redirect.yml` before cloud retirement, so CI cannot recreate the service
- Unused migrated UI copies in `apps/web/src/features`: `market/components/ui/ThemeToggle.tsx`, `insurance/components/ui/ThemeToggle.tsx`, `abtest/components/ui/ThemeToggle.tsx`, `kpi/components/ui/ThemeToggle.tsx`, `portfolio/components/ui/ThemeToggle.tsx`; `components/ui/TabNav.tsx` in abtest/kpi/portfolio/operations; `kpi/components/ui/LanguageToggle.tsx`; `market/components/olist/BackendWarmup.tsx`.

Before deletion, archive the exact source/configuration targets outside the active repository and verify the archive. Exclude generated caches and user environment files. This supplies recovery without relying on unverified git state. Do not add a runnable legacy-app archive to the repository.

## Confirmed Vercel projects

Account/team: `gonorandres-projects`, matching `team_Vdfs9EBdTrbSruP6Rm3op0QK`. CLI project inspection confirms all six IDs match the existing retirement manifest.

| Project | Exact ID | Latest production URL reported by Vercel |
|---|---|---|
| insurance-claims-dashboard | `prj_4W4jqiF2MFMVNL2hbJEUlRF5NquG` | `https://claims.gonor.me` |
| ab-test-analysis | `prj_bd4chQuPydvL7VZGUh00aMrWs4eg` | `https://ab-test-analysis.vercel.app` |
| executive-kpi-report | `prj_XUdzqOOlVB7WKx8UGJMb4u7rXb2n` | `https://kpi.gonor.me` |
| financial-portfolio-tracker | `prj_sRSJiGCR03kYdWqxPpbXow6BFJ0j` | `https://financial-portfolio-tracker-iota.vercel.app` |
| operational-efficiency | `prj_Vb3uLkMTrRma0ZsC8dgWWtqly9Wg` | `https://operational-efficiency.vercel.app` |
| demo-aesthetics | `prj_iSVaJs6Sg2s6gIC6pEJIy1h6JUgb` | `https://demos.gonor.me` |

Retiring these projects ends service at their attached domains and deployment URLs, including the custom aliases above. This follows the selected policy to retire old URLs rather than preserve redirects. Do not touch unrelated Vercel projects such as gmm-explorer, studysoa, or graph-relation-db.

## Confirmed Cloud Run service

- Project: `project-ad7a5be2-a1c7-4510-82d`
- Region: `us-central1`
- Service: `da-cohort-streamlit`
- UID: `11bbce40-e82f-4620-a618-9c9d676c2247`
- Service URL reported by Cloud Run: `https://da-cohort-streamlit-d3qj5vwxtq-uc.a.run.app`
- Also recorded in this repository: `https://da-cohort-streamlit-451451662791.us-central1.run.app`

Keep `da-portfolio-api`, the Cloudflare Pages project `data-analyst-hub`, its required provider hostname, and research storage. These support the unified site.

## Execution order used

1. Obtain explicit approval for the exact source and hosting deletions above and, separately, the new frontend deployment.
2. Verify the source backup and remove approved obsolete files. Rebuild and rerun tests using only the unified frontend.
3. Deploy the verified new frontend only after deployment approval; smoke-test all eight analyses and both static-data sources on the canonical domain.
4. Retire the six identified Vercel projects and the identified Cloud Run service. Inspect attached custom domains/DNS first and remove only records proven exclusive to those approved legacy services; shared/apex DNS is out of scope.
5. Remove obsolete redirect deployment code and the retired service's health-registry entry. Recheck active API/proxy/data health and confirm the old projects/services no longer appear in provider inventories.
6. Record the actual completed actions, timestamps, and backup location here. Report any failed retirement explicitly; do not label an unverified resource removed.

Git operations remain subject to their own explicit approval.

The unused `apps/web/src/features/abtest/components/abtest/ColdStartBanner.tsx`
is also a cleanup target; the A/B analysis already has per-chart error states.
