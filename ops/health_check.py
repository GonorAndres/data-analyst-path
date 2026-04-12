"""Run health checks for every service listed in ops/urls.yml.

Local use:
    pip install pyyaml
    python ops/health_check.py

CI use: invoked by .github/workflows/ops-health.yml every 6h. Writes a markdown
report to $GITHUB_STEP_SUMMARY and exposes these step outputs:
    failed_count  -- integer, number of failed probes
    failed_list   -- comma-separated service ids
    report        -- the full markdown report (multiline)

The script never fails the job itself (exit code is always 0). The workflow
decides what to do with failures based on outputs.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import yaml

ROOT = Path(__file__).resolve().parent.parent
URLS_YML = ROOT / "ops" / "urls.yml"
TIMEOUT = 30  # Cloud Run cold starts can take ~10s
RETRIES = 2


def probe(url: str) -> tuple[int, str]:
    """GET the URL and return (status_code, error_message).

    Retries once on timeout / TCP failure to absorb Cloud Run cold starts.
    status_code == 0 means the request never produced an HTTP response.
    """
    req = Request(url, headers={"User-Agent": "da-portfolio-health/1.0"})
    last_err = ""
    for _ in range(RETRIES):
        try:
            with urlopen(req, timeout=TIMEOUT) as r:
                return r.status, ""
        except HTTPError as e:
            return e.code, f"HTTPError: {e.reason}"
        except URLError as e:
            last_err = f"URLError: {e.reason}"
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
    return 0, last_err


def main() -> int:
    config = yaml.safe_load(URLS_YML.read_text())
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    rows: list[tuple[str, str, str, str, int, str]] = []
    failed: list[str] = []
    total = 0

    for svc in config["services"]:
        total += 1
        base = svc["production_url"].rstrip("/")
        path = svc["health_path"]
        expected = svc.get("expected_status", [200])
        code, err = probe(base + path)
        ok = code in expected
        rows.append((svc["id"], base, path, "OK" if ok else "DOWN", code, err))
        if not ok:
            failed.append(svc["id"])

        for sub in svc.get("sub_services", []):
            total += 1
            sub_code, sub_err = probe(base + sub["path"])
            sub_ok = sub_code == 200
            rows.append(
                (
                    f"{svc['id']}/{sub['id']}",
                    base,
                    sub["path"],
                    "OK" if sub_ok else "DOWN",
                    sub_code,
                    sub_err,
                )
            )
            if not sub_ok:
                failed.append(f"{svc['id']}/{sub['id']}")

    header = (
        f"# DA Portfolio Health\n\n"
        f"Last checked: **{now}**  \n"
        f"Failed: **{len(failed)}** / {total}\n\n"
        "| Service | URL | Path | Status | HTTP | Error |\n"
        "|---------|-----|------|--------|------|-------|\n"
    )
    body = "".join(
        f"| {r[0]} | `{r[1]}` | `{r[2]}` | {r[3]} | {r[4]} | {r[5] if r[3] == 'DOWN' else '-'} |\n"
        for r in rows
    )
    report = header + body

    print(report)

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        Path(summary).write_text(report)

    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a") as f:
            f.write(f"failed_count={len(failed)}\n")
            f.write(f"failed_list={','.join(failed)}\n")
            f.write("report<<HC_EOF\n")
            f.write(report)
            f.write("\nHC_EOF\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
