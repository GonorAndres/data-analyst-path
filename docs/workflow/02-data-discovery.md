---
tags: [workflow, data-discovery, profiling]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Phase 2: Data Discovery and Assessment

## Goal

Find, profile, and assess available data sources before writing a single analytical query. Understand what you have, what you're missing, and what limitations will constrain your analysis.

## Data Profiling Checklist

For every dataset you touch, answer these before proceeding:

| Question | Why It Matters |
|----------|---------------|
| How many rows and columns? | Scope the analysis effort |
| What is the grain? (one row = one what?) | Prevents aggregation errors |
| What date range does it cover? | Determines what trends you can analyze |
| What percentage of values are null per column? | Flags data quality issues early |
| Are there duplicates? By what key? | Can inflate metrics silently |
| What are the unique values in categorical columns? | Reveals cardinality, typos, encoding issues |
| Is there a data dictionary or schema doc? | Saves hours of guessing column meanings |

## Quick Profiling with Python

```python
import pandas as pd

df = pd.read_csv("data/raw/dataset.csv")

# One-liner summary
print(f"Shape: {df.shape}")
print(f"Date range: {df['date_col'].min()} to {df['date_col'].max()}")
print(f"\nNull percentages:\n{(df.isnull().sum() / len(df) * 100).round(1)}")
print(f"\nDuplicates: {df.duplicated().sum()}")
print(f"\nData types:\n{df.dtypes}")
```

## Quick Profiling with SQL

```sql
-- Row count and date range
SELECT
    COUNT(*) AS total_rows,
    MIN(created_at) AS earliest,
    MAX(created_at) AS latest,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM orders;

-- Null percentage per column
SELECT
    COUNT(*) AS total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE email IS NULL) / COUNT(*), 1) AS email_null_pct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE phone IS NULL) / COUNT(*), 1) AS phone_null_pct
FROM customers;
```

## Data Source Quality Assessment

Rate each source on these dimensions before relying on it:

| Dimension | Green | Yellow | Red |
|-----------|-------|--------|-----|
| Completeness | <5% nulls in key fields | 5-20% nulls | >20% nulls |
| Freshness | Updated daily/weekly | Monthly | Stale (>3 months) |
| Accuracy | Validated against source | Spot-checked | Unknown |
| Consistency | Matches other sources | Minor discrepancies | Contradictions |
| Documentation | Schema + dictionary exist | Partial docs | Nothing |

## Common Data Gotchas

- **Time zones**: Dates stored without timezone info. Always confirm: UTC? Local? Server time?
- **Currency**: Mixed currencies in a single column. Always check for implicit conversions.
- **Encoding**: Special characters in names (accents in Spanish data). Use `utf-8` everywhere.
- **Survivorship bias**: Dataset only contains current customers, not churned ones.
- **Changing definitions**: A "customer" in 2023 might have a different definition than in 2025.

## Output: Data Assessment Memo

Before starting analysis, write a short memo (even 5 bullet points) covering:
- Sources identified and their quality rating
- Key limitations and assumptions
- Missing data that would improve the analysis
- Recommended approach given the data constraints
