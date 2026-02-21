---
tags: [design, dashboard, power-bi, visualization]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Dashboard Design Principles

## The Hierarchy of Dashboard Elements

```
1. KPI Cards (top)       -- The 3-5 numbers that matter most
2. Trend Charts (middle) -- How are those numbers changing?
3. Breakdown Tables (bottom) -- Detail for drill-down
4. Filters (side/top)    -- Let users slice by dimension
```

## The 5-Second Rule

A viewer should understand the main message of your dashboard within 5 seconds of looking at it. If they can't, simplify.

## Color Guidelines

| Use Case | Approach |
|----------|----------|
| Good/Bad performance | Green/Red (or Blue/Orange for colorblind accessibility) |
| Categories | Max 5-7 distinct colors. Use a sequential palette for ordered data. |
| Highlighting | Use ONE accent color to draw attention. Grey out everything else. |
| Background | White or very light grey. Dark backgrounds only if the brand requires it. |

## Power BI Specific Patterns

### DAX Measures to Include in Every Dashboard
- YoY / QoQ / MoM change percentages
- Running totals (TOTALYTD, TOTALQTD)
- Conditional formatting thresholds
- Dynamic titles (show selected filter in title)

### Layout Patterns
- **Z-pattern**: Eye naturally goes top-left -> top-right -> bottom-left -> bottom-right
- **KPI row** at top (cards), **charts** in middle, **detail table** at bottom
- **Navigation**: Use bookmarks and buttons for multi-page dashboards
- **Mobile layout**: Design a separate mobile view (Power BI supports this natively)

## Anti-Patterns to Avoid

- Pie charts with more than 5 slices (use horizontal bar instead)
- 3D effects on any chart
- Dual-axis charts without clear labeling
- Dashboards with more than 8-10 visuals per page
- Color-only encoding (add labels or patterns for accessibility)
