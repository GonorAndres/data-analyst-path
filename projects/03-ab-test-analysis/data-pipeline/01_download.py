"""
01_download.py - Download the Udacity A/B Test dataset from Kaggle.

Downloads "zhangluyuan/ab-testing" via kagglehub and copies the raw CSV
to data/raw/ab_data.csv. Falls back to reading from data/raw/ if the
file already exists.

Usage:
    python data-pipeline/01_download.py
"""

from pathlib import Path
import shutil
import sys

# ---------------------------------------------------------------------------
# Paths (relative to project root)
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
RAW_CSV = RAW_DIR / "ab_data.csv"


def download_dataset() -> Path:
    """Download dataset via kagglehub and return the local cache path."""
    try:
        import kagglehub
    except ImportError:
        print(
            "ERROR: kagglehub is not installed. "
            "Install it with:  pip install kagglehub"
        )
        sys.exit(1)

    print("Downloading dataset 'zhangluyuan/ab-testing' from Kaggle ...")
    dataset_path = Path(kagglehub.dataset_download("zhangluyuan/ab-testing"))
    print(f"  kagglehub cache path: {dataset_path}")
    return dataset_path


def main() -> None:
    # Ensure output directory exists
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Fallback: skip download if file already present
    if RAW_CSV.exists():
        print(f"Raw CSV already exists at {RAW_CSV}")
        print(f"  Size: {RAW_CSV.stat().st_size / 1_048_576:.1f} MB")
        print("  Skipping download. Delete the file to re-download.")
        return

    # Download from Kaggle
    cache_path = download_dataset()

    # Locate the CSV inside the downloaded folder
    candidates = list(cache_path.rglob("ab_data.csv"))
    if not candidates:
        # Try any CSV
        candidates = list(cache_path.rglob("*.csv"))
    if not candidates:
        print(f"ERROR: No CSV found in {cache_path}")
        sys.exit(1)

    src = candidates[0]
    print(f"  Source file: {src}")
    shutil.copy2(src, RAW_CSV)
    print(f"  Copied to:  {RAW_CSV}")
    print(f"  Size: {RAW_CSV.stat().st_size / 1_048_576:.1f} MB")
    print("Done.")


if __name__ == "__main__":
    main()
