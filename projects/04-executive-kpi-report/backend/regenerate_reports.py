"""Regenerate retained EN/ES reports using the same data path as the API.

Run from the repository root:
    .venv/bin/python projects/04-executive-kpi-report/backend/regenerate_reports.py
"""

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from kpi_backend import data_loader
from kpi_backend.analytics_engine import mrr_waterfall
from kpi_backend.routers.report import generate_pdf_report


def write_revenue_evidence():
    """Publish the December bridge from the same filtered source as the PDF."""
    source = data_loader.apply_filters(data_loader.monthly_kpis, end_month="2025-12")
    if source.empty:
        source = data_loader.apply_filters(data_loader.monthly_metrics, end_month="2025-12")
    if source.empty:
        raise RuntimeError("No monthly data available for revenue evidence")
    source = source.sort_values("month")
    latest = source.iloc[-1]
    artifact = {
        "schemaVersion": 1,
        "evidenceType": "synthetic",
        "period": latest["month"].strftime("%Y-%m"),
        "reviewedAt": datetime.now(timezone.utc).date().isoformat(),
        "unit": "USD",
        "population": "NovaCRM; all company segments",
        "seed": 42,
        "sources": [
            "projects/04-executive-kpi-report/data-pipeline/01_generate_saas_data.py",
            "projects/04-executive-kpi-report/data-pipeline/02_compute_kpis.py",
            "projects/04-executive-kpi-report/backend/kpi_backend/analytics_engine.py",
        ],
        "method": "mrr_waterfall; starting + new + expansion - contraction - churned = ending",
        "bridge": mrr_waterfall(latest),
    }
    destination = Path(__file__).resolve().parents[1] / "public" / "kpi" / "evidence" / "revenue-bridge.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {destination.name}: {artifact['period']} / seed 42")


async def main():
    write_revenue_evidence()
    report_dir = Path(__file__).resolve().parents[1] / "reports"
    for language in ("en", "es"):
        response = generate_pdf_report(None, None, "2025-12", language, None)
        if isinstance(response, dict):
            raise RuntimeError(response["error"])
        content = b"".join([chunk async for chunk in response.body_iterator])
        destination = report_dir / f"kpi_report_2025-12_{language}.pdf"
        destination.write_bytes(content)
        print(f"Generated {destination.name}: {len(content):,} bytes")


if __name__ == "__main__":
    asyncio.run(main())
