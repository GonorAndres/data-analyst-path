# Analytical follow-up issues

These require project-level analytical review beyond the shared frontend migration.

## Executive KPI anomaly expectation

The backend's anomaly response derives an `expected` value with `value / (1 + zscore * 0.1)` rather than returning the expectation from the detector. This should be replaced by the detector's actual baseline, with an explicit method and tests against known series. Review the anomaly chart and exported report together when correcting it.

## Research artifact consistency

The e-commerce analyses use related Olist data with different preparation and aggregation choices. They are grouped for visitors but not numerically merged. Reconcile denominators and time coverage before presenting their metrics as directly comparable.

Some historical project READMEs, notebooks, and generated reports contain earlier dates, counts, architecture descriptions, or styling. They remain research artifacts; verify provenance before revising quantitative claims. The UI migration deliberately does not invent replacements for undocumented values.
