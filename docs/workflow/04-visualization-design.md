---
tags: [workflow, visualization, charts]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Phase 4: Visualization and Dashboard Design

## Goal

Transform analytical findings into visual outputs that communicate insights clearly. Every chart must answer a question, not just display data.

## The 5-Second Rule

A viewer should understand the main message of your chart within 5 seconds. If they can't:
- Simplify the chart type
- Add a title that states the insight (not the metric)
- Remove decorative elements
- Use annotations to highlight the key takeaway

## Chart Selection Guide

| You Want to Show... | Use This Chart | Avoid |
|---------------------|---------------|-------|
| Comparison across categories | Horizontal bar chart | Pie chart with >5 slices |
| Trend over time | Line chart | Area chart (unless stacked) |
| Distribution | Histogram or box plot | Bar chart of averages only |
| Relationship between 2 variables | Scatter plot | Line chart (implies time) |
| Part-to-whole (few parts) | Stacked bar or treemap | 3D pie chart |
| Geographic data | Choropleth map | Bubble map (harder to read) |
| Ranking | Horizontal bar (sorted) | Vertical bar (hard to read labels) |
| KPI snapshot | Card / big number | Table with too many metrics |

## Chart Anatomy Checklist

Every chart in the portfolio must have:

- [ ] **Title that states the insight**: "Revenue grew 23% YoY in Q4" not "Revenue by Quarter"
- [ ] **Labeled axes** with units (e.g., "Revenue (USD thousands)")
- [ ] **Source annotation**: small text at bottom: "Source: Company sales database, Jan-Dec 2025"
- [ ] **Insight annotation**: callout or arrow pointing to the key finding
- [ ] **Consistent color palette**: use `scripts/utils/theme.py` across all projects
- [ ] **Legend** only if needed (prefer direct labeling on the chart)

## Dashboard vs. Report vs. Slides

| Format | When to Use | Design Principle |
|--------|------------|-----------------|
| **Dashboard** (Power BI) | Ongoing monitoring, self-service exploration | Interactive filters, KPI cards at top, drill-down |
| **Report** (PDF/Markdown) | One-time deep-dive, formal deliverable | Narrative flow, charts embedded in text, recommendations at end |
| **Slides** (PowerPoint/PDF) | Executive presentation, stakeholder meeting | 1 idea per slide, minimal text, speak to the chart |

## Color Palette Reference

See [[../../../scripts/utils/theme.py]] for the shared palette.

| Color | Hex | Use For |
|-------|-----|---------|
| Primary Blue | #2563EB | Main data series |
| Purple | #7C3AED | Secondary series |
| Green | #059669 | Positive / on-target |
| Red | #DC2626 | Negative / off-target |
| Amber | #D97706 | Warning / highlight |
| Grey | #6B7280 | Context / baseline |

## Common Visualization Mistakes (from Research)

1. **Cluttered dashboards** -- More than 8-10 visuals per page. Cut ruthlessly.
2. **Rainbow palettes** -- Stick to 5-7 colors max. Use sequential palettes for ordered data.
3. **No axis labels** -- Every axis needs a label with units.
4. **3D effects** -- Never. They distort perception of values.
5. **Dual-axis charts** -- Only use if absolutely necessary and label both axes clearly.
6. **Color-only encoding** -- Add patterns or labels for accessibility.
