"""
01_download.py -- Download NYC 311 Service Requests (2024) via Socrata SODA API.

Downloads all 311 service requests for calendar year 2024 from dataset erm2-nwe9,
paginating in chunks of 50,000 rows, and saves to data/raw/nyc311_raw.csv.

Usage:
    python data-pipeline/01_download.py
"""

import time
from pathlib import Path

import pandas as pd
import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"

COLUMNS = [
    "unique_key",
    "created_date",
    "closed_date",
    "due_date",
    "agency",
    "agency_name",
    "complaint_type",
    "descriptor",
    "location_type",
    "incident_zip",
    "city",
    "borough",
    "open_data_channel_type",
    "status",
    "resolution_description",
    "community_board",
]

PAGE_LIMIT = 50_000
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5

# Paths relative to this script's location
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
RAW_DIR = PROJECT_DIR / "data" / "raw"
OUTPUT_FILE = RAW_DIR / "nyc311_raw.csv"


def build_params(offset: int) -> dict:
    """Build query parameters for one page of results."""
    return {
        "$select": ", ".join(COLUMNS),
        "$where": "created_date >= '2024-01-01T00:00:00' AND created_date < '2025-01-01T00:00:00'",
        "$order": "unique_key",
        "$limit": PAGE_LIMIT,
        "$offset": offset,
    }


def fetch_page(session: requests.Session, offset: int) -> list[dict]:
    """Fetch a single page of results with retry logic."""
    params = build_params(offset)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(BASE_URL, params=params, timeout=120)
            resp.raise_for_status()
            return resp.json()
        except (requests.RequestException, ValueError) as exc:
            print(f"  [Attempt {attempt}/{MAX_RETRIES}] Error: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS * attempt)
            else:
                raise RuntimeError(
                    f"Failed to fetch page at offset {offset} after {MAX_RETRIES} attempts"
                ) from exc
    return []  # unreachable, but satisfies type checkers


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("NYC 311 Data Download -- Calendar Year 2024")
    print(f"Endpoint : {BASE_URL}")
    print(f"Page size: {PAGE_LIMIT:,}")
    print(f"Output   : {OUTPUT_FILE}")
    print("=" * 60)

    all_rows: list[dict] = []
    offset = 0
    page_num = 0

    session = requests.Session()
    session.headers.update({"Accept": "application/json"})

    while True:
        page_num += 1
        print(f"\nFetching page {page_num} (offset={offset:,}) ...", end=" ")
        page_data = fetch_page(session, offset)
        n = len(page_data)
        print(f"{n:,} rows")

        if n == 0:
            break

        all_rows.extend(page_data)
        offset += PAGE_LIMIT

        if n < PAGE_LIMIT:
            break

    print("\n" + "-" * 60)
    print(f"Total rows downloaded: {len(all_rows):,}")

    if not all_rows:
        print("No data downloaded. Exiting.")
        return

    df = pd.DataFrame(all_rows)
    # Ensure all expected columns exist (API may omit columns with all nulls)
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = None
    df = df[COLUMNS]

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved to {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1e6:.1f} MB)")
    print("Done.")


if __name__ == "__main__":
    main()
