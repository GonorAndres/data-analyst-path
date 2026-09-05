# Analytical follow-up issues

The September 2026 presentation review corrected the issues below. Remaining source-data limits are recorded in the [evidence ledger](evidence-audit.md).

## Executive KPI anomaly expectation

Resolved: the endpoint now returns the actual mean baseline for z-score detection and median for IQR, with bounds and method-specific evidence. Both-method detections preserve their separate baselines. Charts and regenerated English/Spanish reports use these definitions; focused regression tests cover the calculation and report consistency. Related report corrections fix NRR percentage units, growth commentary, and the MRR bridge identity.

## Research artifact consistency

The marketplace includes all order statuses; the customer-retention analysis includes delivered orders. Narratives and reports now state their distinct populations and payment definitions. Cohort JSON was checked against retained parquet. Marketplace raw inputs remain unavailable locally, so a single merged revenue/customer headline is not presented.

Historical notebook outputs and the technical reference retain review notes where missing source inputs prevent reproduction. Unsupported rollout benefits, causal customer claims, and guaranteed investment improvements have been withdrawn from the current summaries. Future changes must reproduce the original population before replacing those historical outputs. See the ledger for each project's remaining limitations.
