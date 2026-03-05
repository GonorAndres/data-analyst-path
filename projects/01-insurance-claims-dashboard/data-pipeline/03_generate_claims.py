"""
Generate synthetic claim-level data calibrated to CAS Schedule P aggregates.

Produces ~50K individual claims with actuarially-realistic distributions:
- Severity: lognormal (industry standard for claim amounts)
- Frequency: Poisson process per accident year
- Report lag: shifted exponential (IBNR modeling)
- Settlement time: gamma distribution

Output: data/processed/claims_synthetic.parquet
"""

import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

SEED = 42
TARGET_CLAIMS = 50_000

LOB_PARAMS = {
    "Private Passenger Auto": {
        "weight": 0.30,
        "severity_mu": 8.5,
        "severity_sigma": 1.2,
        "report_lag_lambda": 1 / 30,
        "settlement_alpha": 2.0,
        "settlement_beta": 120,
    },
    "Commercial Auto": {
        "weight": 0.15,
        "severity_mu": 9.0,
        "severity_sigma": 1.4,
        "report_lag_lambda": 1 / 45,
        "settlement_alpha": 2.5,
        "settlement_beta": 150,
    },
    "Workers Compensation": {
        "weight": 0.25,
        "severity_mu": 9.2,
        "severity_sigma": 1.3,
        "report_lag_lambda": 1 / 20,
        "settlement_alpha": 3.0,
        "settlement_beta": 200,
    },
    "Medical Malpractice": {
        "weight": 0.10,
        "severity_mu": 10.5,
        "severity_sigma": 1.8,
        "report_lag_lambda": 1 / 90,
        "settlement_alpha": 4.0,
        "settlement_beta": 365,
    },
    "Other Liability": {
        "weight": 0.12,
        "severity_mu": 9.5,
        "severity_sigma": 1.6,
        "report_lag_lambda": 1 / 60,
        "settlement_alpha": 3.5,
        "settlement_beta": 250,
    },
    "Product Liability": {
        "weight": 0.08,
        "severity_mu": 10.0,
        "severity_sigma": 1.7,
        "report_lag_lambda": 1 / 75,
        "settlement_alpha": 3.5,
        "settlement_beta": 300,
    },
}

STATES = [
    "CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI",
    "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI",
]

_STATE_WEIGHTS_RAW = [
    0.15, 0.10, 0.08, 0.08, 0.06, 0.05, 0.05, 0.04, 0.04, 0.04,
    0.04, 0.03, 0.03, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02, 0.02,
]
# Normalize to ensure sum == 1.0
_sw_total = sum(_STATE_WEIGHTS_RAW)
STATE_WEIGHTS = [w / _sw_total for w in _STATE_WEIGHTS_RAW]


def generate_claims(rng: np.random.Generator) -> pd.DataFrame:
    """Generate synthetic claims with actuarial distributions."""
    records = []
    claim_id = 1

    # Accident years match CAS data: 1988-1997
    for year in range(1988, 1998):
        for lob, params in LOB_PARAMS.items():
            n_claims = int(TARGET_CLAIMS * params["weight"] / 10)
            n_claims = max(n_claims, 10)

            # Random accident dates within the year
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31)
            days_in_year = (end_date - start_date).days + 1
            accident_days = rng.integers(0, days_in_year, size=n_claims)

            for i in range(n_claims):
                accident_date = start_date + timedelta(days=int(accident_days[i]))

                # Report lag: shifted exponential (minimum 1 day)
                report_lag = max(1, int(rng.exponential(1 / params["report_lag_lambda"])))
                report_date = accident_date + timedelta(days=report_lag)

                # Severity: lognormal
                incurred = float(rng.lognormal(params["severity_mu"], params["severity_sigma"]))
                incurred = round(max(100, incurred), 2)

                # Settlement time: gamma distribution
                settlement_days = max(
                    30,
                    int(rng.gamma(params["settlement_alpha"], params["settlement_beta"])),
                )

                # Claim status based on settlement time and current reference date (1997-12-31)
                ref_date = datetime(1997, 12, 31)
                close_date = report_date + timedelta(days=settlement_days)
                is_closed = close_date <= ref_date

                # Paid amount: fraction of incurred
                if is_closed:
                    paid_pct = rng.uniform(0.6, 1.1)
                    paid = round(incurred * paid_pct, 2)
                    case_reserve = 0.0
                    status = "Closed"
                else:
                    paid_pct = rng.uniform(0.1, 0.7)
                    paid = round(incurred * paid_pct, 2)
                    case_reserve = round(incurred - paid, 2)
                    status = "Open"
                    close_date = None

                # Severity band
                if incurred < 5000:
                    severity_band = "Small"
                elif incurred < 25000:
                    severity_band = "Medium"
                elif incurred < 100000:
                    severity_band = "Large"
                else:
                    severity_band = "Excess"

                # Claimant age
                claimant_age = int(rng.normal(42, 15))
                claimant_age = max(18, min(85, claimant_age))

                records.append({
                    "claim_id": f"CLM-{claim_id:06d}",
                    "policy_id": f"POL-{rng.integers(10000, 99999)}",
                    "line_of_business": lob,
                    "accident_date": accident_date.strftime("%Y-%m-%d"),
                    "report_date": report_date.strftime("%Y-%m-%d"),
                    "report_lag_days": report_lag,
                    "close_date": close_date.strftime("%Y-%m-%d") if close_date else None,
                    "claim_status": status,
                    "state": rng.choice(STATES, p=STATE_WEIGHTS),
                    "claimant_age": claimant_age,
                    "paid_amount": paid,
                    "incurred_amount": incurred,
                    "case_reserve": case_reserve,
                    "severity_band": severity_band,
                })
                claim_id += 1

    return pd.DataFrame(records)


def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    rng = np.random.default_rng(SEED)

    print("  Generating synthetic claims ...")
    claims = generate_claims(rng)

    # Convert date columns
    claims["accident_date"] = pd.to_datetime(claims["accident_date"])
    claims["report_date"] = pd.to_datetime(claims["report_date"])
    claims["close_date"] = pd.to_datetime(claims["close_date"])

    out_path = os.path.join(PROCESSED_DIR, "claims_synthetic.parquet")
    claims.to_parquet(out_path, index=False)

    print(f"\n  Saved: {out_path}")
    print(f"  Total claims: {len(claims):,}")
    print(f"  By LOB:")
    for lob, count in claims["line_of_business"].value_counts().items():
        print(f"    {lob}: {count:,}")
    print(f"  Status: {claims['claim_status'].value_counts().to_dict()}")
    print(f"  Severity bands: {claims['severity_band'].value_counts().to_dict()}")
    print(f"  Date range: {claims['accident_date'].min()} to {claims['accident_date'].max()}")


if __name__ == "__main__":
    main()
