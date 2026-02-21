---
tags: [workflow, analysis, execution]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Phase 3: Analysis Execution

## Goal

Clean, transform, and analyze data to answer the business question. Keep the analysis focused -- resist the urge to explore every possible angle.

## Data Cleaning Priorities

Analysts spend 60-80% of their time here. Do it systematically:

1. **Handle missing values** -- Decide per column: drop, fill with median/mode, flag as "Unknown"
2. **Remove duplicates** -- Define the deduplication key first
3. **Standardize formats** -- Dates, currencies, categories (e.g., "MX" vs "Mexico" vs "MEX")
4. **Handle outliers** -- Document your treatment. Don't silently remove them.
5. **Validate ranges** -- Negative prices? Future dates? Ages > 150?

## Analysis Approach Selection

Match the business question to the right technique:

| Business Question Pattern | Technique | Tools |
|--------------------------|-----------|-------|
| "How is X trending over time?" | Time series analysis, period comparisons | SQL window functions, line charts |
| "Which groups perform differently?" | Segmentation, group comparison | SQL GROUP BY, t-tests, bar charts |
| "What factors drive X?" | Correlation analysis, cross-tabs | pandas corr(), heatmaps, scatter plots |
| "Did this change work?" | A/B test, before/after comparison | Hypothesis testing (R/Python), CI plots |
| "How do customers behave over time?" | Cohort analysis, retention curves | SQL cohort queries, heatmaps |
| "Where are the bottlenecks?" | Process analysis, Pareto | SQL aggregations, Pareto charts |
| "How should we group customers?" | RFM, rule-based segmentation | SQL NTILE, Python clustering |

## Notebook Structure

Number your notebooks sequentially and keep each focused:

```
01_data_cleaning.ipynb    -- Load raw data, clean, output processed data
02_eda.ipynb              -- Exploratory charts, distributions, correlations
03_core_analysis.ipynb    -- The actual analytical question
04_visualization.ipynb    -- Publication-quality charts for the report/dashboard
```

## SQL-First, Python-Second

For tabular analysis, prefer this workflow:
1. **SQL** for extraction, joins, aggregations, and window functions
2. **Python** for what SQL can't do: complex reshaping, statistical tests, visualizations
3. **Power BI / Streamlit** for the final interactive layer

This mirrors real DA work environments where SQL is the primary tool.

## Documentation While You Work

In notebooks, add markdown cells answering:
- **What** am I calculating in this cell?
- **Why** this approach over alternatives?
- **So what?** What does this intermediate result tell us?

## Anti-Patterns

- Running every possible analysis instead of focusing on the business question
- Over-cleaning data that doesn't need to be perfect for the question at hand
- Spending 3 hours on a fancy visualization before confirming the underlying analysis is correct
- Not saving intermediate processed data (forces re-running expensive cleaning steps)
