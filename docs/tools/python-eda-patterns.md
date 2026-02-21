---
tags: [tools, python, eda, pandas, visualization]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Python EDA Patterns for Data Analysts

Reference card for exploratory data analysis workflows. Focused on DA work: cleaning, profiling, visualization. Not ML.

## Standard EDA Notebook Flow

```python
# Cell 1: Setup
import pandas as pd
import plotly.express as px
import seaborn as sns
import sys
sys.path.append("../../scripts")
from utils.theme import apply_seaborn_theme, apply_plotly_theme, CATEGORICAL

apply_seaborn_theme()

# Cell 2: Load and profile
df = pd.read_csv("../data/raw/dataset.csv", parse_dates=["date_col"])
print(f"Shape: {df.shape}")
print(f"Date range: {df['date_col'].min()} to {df['date_col'].max()}")
df.info()
df.describe()

# Cell 3: Nulls and duplicates
print(f"Null %:\n{(df.isnull().mean() * 100).round(1).sort_values(ascending=False)}")
print(f"\nDuplicates: {df.duplicated().sum()}")

# Cell 4: Distributions of key numeric columns
for col in ["revenue", "quantity", "cost"]:
    fig = px.histogram(df, x=col, title=f"Distribution of {col}", nbins=50)
    apply_plotly_theme(fig)
    fig.show()

# Cell 5: Categorical breakdowns
for col in ["region", "category", "status"]:
    fig = px.bar(
        df[col].value_counts().reset_index(),
        x="count", y=col, orientation="h",
        title=f"{col} distribution"
    )
    apply_plotly_theme(fig)
    fig.show()

# Cell 6: Time trends
daily = df.groupby(df["date_col"].dt.to_period("M")).agg({"revenue": "sum"}).reset_index()
daily["date_col"] = daily["date_col"].dt.to_timestamp()
fig = px.line(daily, x="date_col", y="revenue", title="Monthly Revenue Trend")
apply_plotly_theme(fig)
fig.show()
```

## Common Pandas Operations for DA

### Cohort Pivot Table
```python
# Retention heatmap from cohort data
cohort_pivot = cohort_data.pivot_table(
    index="cohort_month",
    columns="months_since_first",
    values="customers",
    aggfunc="sum"
)
# Normalize to percentages
cohort_pct = cohort_pivot.div(cohort_pivot[0], axis=0) * 100
```

### Period-over-Period Comparison
```python
df["month"] = df["date"].dt.to_period("M")
monthly = df.groupby("month")["revenue"].sum().reset_index()
monthly["mom_change"] = monthly["revenue"].pct_change() * 100
monthly["yoy_change"] = monthly["revenue"].pct_change(12) * 100
```

### Outlier Detection (IQR Method)
```python
Q1 = df["amount"].quantile(0.25)
Q3 = df["amount"].quantile(0.75)
IQR = Q3 - Q1
outliers = df[(df["amount"] < Q1 - 1.5 * IQR) | (df["amount"] > Q3 + 1.5 * IQR)]
print(f"Outliers: {len(outliers)} ({len(outliers)/len(df)*100:.1f}%)")
```

## Visualization Quick Reference

### Plotly (preferred for interactivity)
```python
# Annotated bar chart with insight callout
fig = px.bar(data, x="category", y="revenue", color="region",
             title="Revenue by Category: Region A leads by 34%")
fig.add_annotation(x="Electronics", y=max_val, text="Top category",
                   showarrow=True, arrowhead=1)
apply_plotly_theme(fig)
```

### Seaborn (preferred for static publication)
```python
# Cohort heatmap
sns.heatmap(cohort_pct, annot=True, fmt=".0f", cmap="Blues",
            linewidths=0.5, cbar_kws={"label": "Retention %"})
plt.title("Customer Retention by Cohort")
plt.xlabel("Months Since First Purchase")
plt.ylabel("Cohort Month")
plt.tight_layout()
plt.savefig("../reports/cohort_heatmap.png", dpi=150)
```

## When Python vs SQL vs R

| Task | Best Tool | Why |
|------|-----------|-----|
| Data extraction from database | SQL | Native to the DB, optimized |
| Joins and aggregations | SQL | Declarative, readable |
| Complex reshaping / pivoting | Python (pandas) | More flexible than SQL |
| Statistical tests | R or scipy | Purpose-built libraries |
| Interactive visualization | Python (plotly) or Streamlit | Easy to iterate |
| Static publication charts | Python (seaborn) or R (ggplot2) | Fine control |
| Quick one-off calculation | SQL or Python | Whatever's faster |
