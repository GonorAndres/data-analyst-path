---
tags: [tools, power-bi, dax, dashboard]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Power BI Patterns for Data Analysts

Reference card for recurring Power BI patterns used across portfolio projects.

## DAX Measures Every Dashboard Needs

### Period-over-Period Comparisons

```dax
// Year-over-Year Revenue Change
Revenue YoY % =
VAR CurrentRevenue = [Total Revenue]
VAR PriorYearRevenue = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR('Date'[Date]))
RETURN
    DIVIDE(CurrentRevenue - PriorYearRevenue, PriorYearRevenue, 0)

// Month-over-Month Change
Revenue MoM % =
VAR CurrentRevenue = [Total Revenue]
VAR PriorMonthRevenue = CALCULATE([Total Revenue], DATEADD('Date'[Date], -1, MONTH))
RETURN
    DIVIDE(CurrentRevenue - PriorMonthRevenue, PriorMonthRevenue, 0)
```

### Running Totals

```dax
// Year-to-Date Revenue
Revenue YTD = TOTALYTD([Total Revenue], 'Date'[Date])

// Quarter-to-Date
Revenue QTD = TOTALQTD([Total Revenue], 'Date'[Date])
```

### Conditional KPI Indicators

```dax
// KPI Status (for conditional formatting)
KPI Status =
SWITCH(
    TRUE(),
    [Revenue YoY %] >= 0.10, "Above Target",
    [Revenue YoY %] >= 0, "On Track",
    "Below Target"
)
```

## Data Modeling Best Practices

### Star Schema
- **Fact tables**: transactions, claims, orders (narrow, many rows)
- **Dimension tables**: dates, customers, products, regions (wide, few rows)
- One-to-many relationships from dimension to fact
- Always create a dedicated Date dimension table

### Date Table Template

```dax
DateTable =
ADDCOLUMNS(
    CALENDARAUTO(),
    "Year", YEAR([Date]),
    "Month", FORMAT([Date], "MMMM"),
    "MonthNumber", MONTH([Date]),
    "Quarter", "Q" & QUARTER([Date]),
    "YearMonth", FORMAT([Date], "YYYY-MM"),
    "DayOfWeek", FORMAT([Date], "dddd"),
    "IsWeekend", IF(WEEKDAY([Date], 2) > 5, TRUE, FALSE)
)
```

## Dashboard Layout Patterns

### KPI Summary Page (Page 1 of any dashboard)
```
+-------------------------------------------+
| [Title]              [Date Filter] [Reset] |
+-------------------------------------------+
| [KPI Card] [KPI Card] [KPI Card] [KPI Card]|
+-------------------------------------------+
| [Trend Line Chart - main metric over time] |
+-------------------------------------------+
| [Bar: by category] | [Map/Table: by region]|
+-------------------------------------------+
| Source: ... | Last updated: ...             |
+-------------------------------------------+
```

### Detail/Drill-Down Page (Page 2+)
- Use drill-through from Page 1 visuals
- Show granular data for the selected dimension
- Include a "Back" button (Power BI bookmark)

## Publishing Workflow

1. Build in Power BI Desktop (.pbix)
2. Save .pbix to `dashboards/` folder in project
3. Export screenshots to `dashboards/screenshots/` for README
4. Publish to Power BI Service (free tier: app.powerbi.com)
5. Get shareable link and add to `dashboards/README.md`
6. Re-publish when updated

## Power BI vs Other Tools (When to Choose What)

| Scenario | Best Tool |
|----------|-----------|
| Interactive dashboard for stakeholders | Power BI |
| Quick exploratory analysis | Jupyter notebook |
| Code-heavy custom app | Streamlit |
| One-time report delivery | PDF (Python-generated) |
| Public portfolio hosting | Power BI Service or Tableau Public |
