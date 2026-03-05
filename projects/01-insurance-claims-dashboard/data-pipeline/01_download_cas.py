"""
Download CAS Schedule P loss reserving data from the Casualty Actuarial Society.

Source: https://www.casact.org/publications-research/research/research-resources/loss-reserving-data-pulled-naic-schedule-p

These are real regulatory filings (NAIC Schedule P) used industry-wide for
loss reserving research. Six lines of business, accident years 1988-1997.
"""

import os
import urllib.request

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")

FILES = {
    "ppauto_pos.csv": "https://www.casact.org/sites/default/files/2021-04/ppauto_pos.csv",
    "comauto_pos.csv": "https://www.casact.org/sites/default/files/2021-04/comauto_pos.csv",
    "wkcomp_pos.csv": "https://www.casact.org/sites/default/files/2021-04/wkcomp_pos.csv",
    "medmal_pos.csv": "https://www.casact.org/sites/default/files/2021-04/medmal_pos.csv",
    "othliab_pos.csv": "https://www.casact.org/sites/default/files/2021-04/othliab_pos.csv",
    "prodliab_pos.csv": "https://www.casact.org/sites/default/files/2021-04/prodliab_pos.csv",
}


def main():
    os.makedirs(RAW_DIR, exist_ok=True)

    for filename, url in FILES.items():
        dest = os.path.join(RAW_DIR, filename)
        if os.path.exists(dest):
            print(f"  Already exists: {filename}")
            continue
        print(f"  Downloading {filename} ...")
        urllib.request.urlretrieve(url, dest)
        size_kb = os.path.getsize(dest) / 1024
        print(f"    Saved ({size_kb:.0f} KB)")

    print(f"\nAll files in {RAW_DIR}:")
    for f in sorted(os.listdir(RAW_DIR)):
        if f.endswith(".csv"):
            print(f"  {f}")


if __name__ == "__main__":
    main()
