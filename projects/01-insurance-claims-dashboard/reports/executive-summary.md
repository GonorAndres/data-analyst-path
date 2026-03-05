# Executive Summary: Insurance Claims & Reserving Analysis

**Prepared for:** Board of Directors / Chief Financial Officer
**Date:** March 2026
**Analyst:** Andres Gonzalez Ortega
**Data Source:** CAS Loss Reserving Database (NAIC Schedule P), Accident Years 1988--1997

---

## Background

This analysis evaluates the reserving adequacy and underwriting profitability of a multi-line property & casualty insurance portfolio using real regulatory filings from the NAIC Schedule P. Two industry-standard actuarial methods -- Chain-Ladder (CL) and Bornhuetter-Ferguson (BF) -- are applied to project ultimate losses and estimate Incurred But Not Reported (IBNR) reserves across six lines of business.

## Key Metrics

| Metric | Value |
|--------|-------|
| Lines of Business | 6 (Private Passenger Auto, Commercial Auto, Workers' Comp, Medical Malpractice, Product Liability, Other Liability) |
| Accident Year Range | 1988--1997 (10 development lags) |
| Total IBNR (Paid CL) | ~$20.4M |
| Portfolio Loss Ratio | Varies by LOB; portfolio-weighted average near breakeven |
| Assumed Expense Ratio | 30% |

## Profitability by Line of Business

| Line of Business | Loss Ratio | Combined Ratio | Assessment |
|-----------------|------------|----------------|------------|
| Private Passenger Auto | < 100% | < 100% | Profitable. High volume smooths volatility. Largest contributor to IBNR by volume (~76%). |
| Product Liability | < 100% | < 100% | Profitable. Benefits from favorable reserve development in mature accident years. |
| Commercial Auto | ~100% | ~130% | Breakeven on losses. Expense load pushes combined ratio above profitability threshold. |
| Workers' Compensation | > 150% | > 180% | Unprofitable. Systematic under-pricing or adverse selection concerns. |
| Other Liability | > 100% | > 130% | Unprofitable. Moderate development tail complicates projections. |
| Medical Malpractice | ~280% | > 300% | Severely unprofitable. Extremely long development tails (3--5x auto). Highest IBNR uncertainty. |

## Reserve Adequacy: Chain-Ladder vs. Bornhuetter-Ferguson

Both methods agree directionally, but diverge meaningfully for recent accident years:

- **Chain-Ladder** produces larger IBNR estimates for recent years where observed development is thin. CL is purely data-driven and can be volatile when early data is sparse.
- **Bornhuetter-Ferguson** moderates projections by blending development factors with an a-priori expected loss ratio, yielding more stable estimates for immature accident years.
- For mature years (1988--1992), both methods converge, confirming that the underlying data is credible once sufficient development is observed.

The difference between CL and BF estimates provides a natural range for reserve uncertainty -- useful for capital planning and regulatory discussions.

## Recommendations

1. **Re-evaluate pricing for Medical Malpractice and Workers' Compensation.** Combined ratios exceeding 200% indicate structural unprofitability. Rate increases, risk selection tightening, or portfolio exit should be evaluated.

2. **Implement tail factors for long-tail lines.** The 10-year development window may be insufficient for medical malpractice and product liability. Tail factors would extend projections beyond observed development and reduce IBNR understatement risk.

3. **Monitor the paid-to-incurred ratio as an early warning indicator.** Divergence from historical patterns signals potential reserve inadequacy before it surfaces in traditional actuarial reviews.

4. **Quantify reserve uncertainty with confidence intervals.** The CL and BF point estimates should be supplemented with Mack's method or bootstrap simulations to inform capital allocation and reinsurance purchasing decisions.

5. **Leverage profitable lines for growth.** Private Passenger Auto and Product Liability demonstrate consistent underwriting discipline. Controlled expansion in these segments can offset losses from challenged lines during the repricing transition.

---

*This analysis uses publicly available regulatory data and is intended for educational and portfolio demonstration purposes.*
