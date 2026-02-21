---
tags: [design, visualization, charts, reference]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Chart Selection Guide

Quick reference: match what you want to show to the right chart type.

## Decision Matrix

| Intent | Best Chart | Avoid | Notes |
|--------|-----------|-------|-------|
| **Compare** values across categories | Horizontal bar | Pie chart (>5 slices) | Sort bars by value, not alphabetically |
| **Show trend** over time | Line chart | Bar chart for time series | Use consistent time intervals |
| **Show composition** (parts of whole) | Stacked bar or treemap | 3D pie | Only if parts sum to 100% |
| **Show distribution** | Histogram or box plot | Bar of averages | Show spread, not just center |
| **Show relationship** | Scatter plot | Line chart | Line implies time or order |
| **Show ranking** | Horizontal bar (sorted) | Vertical bar | Easier to read category labels |
| **Show geographic** patterns | Choropleth map | Bubble map | Use sequential color scale |
| **Show single metric** (KPI) | Big number card | Table row | Add trend arrow or sparkline |
| **Show change** | Waterfall chart | Stacked bar | Good for explaining revenue bridges |
| **Show flow/process** | Sankey or funnel | Pie chart | Shows where drop-offs happen |

## Number Formatting Standards

| Type | Format | Example |
|------|--------|---------|
| Currency (large) | Abbreviated with unit | $1.2M, $340K |
| Currency (small) | Two decimals | $47.50 |
| Percentage | One decimal | 12.3% |
| Count (large) | Abbreviated | 1.5K, 2.3M |
| Dates | ISO or readable | 2025-01 or Jan 2025 |
| Ratios | Two decimals | 0.85, 1.23 |

## Annotation Patterns

### Insight Callout
Point to the most important part of the chart with a short sentence:
- "Revenue peaked in Q4 at $1.2M"
- "Churn spikes after day 30"
- "Region A outperforms by 34%"

### Benchmark Line
Add a dashed horizontal line for targets, averages, or industry benchmarks.

### Highlighted Category
Grey out all bars/lines except the one you're discussing. This focuses attention.

## Color Accessibility

- Never rely on color alone to convey meaning
- Test with a colorblind simulator (e.g., Coblis)
- Use Blue/Orange instead of Red/Green for good/bad when possible
- Add patterns or labels as secondary encoding

## Portfolio-Specific Tips

- Every chart in the repo should use the shared palette from `scripts/utils/theme.py`
- Save all charts at 150+ dpi for crisp README screenshots
- Name chart files descriptively: `revenue_by_region_q4.png` not `chart1.png`
- Include alt-text in README image tags for accessibility
