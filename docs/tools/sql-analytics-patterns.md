---
tags: [tools, sql, analytics, patterns]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# SQL Analytics Patterns

Reference card for common analytical SQL patterns. PostgreSQL dialect (note BigQuery differences where relevant).

## Cohort Retention

```sql
WITH first_purchase AS (
    SELECT
        customer_id,
        DATE_TRUNC('month', MIN(order_date)) AS cohort_month
    FROM orders
    GROUP BY customer_id
),
monthly_activity AS (
    SELECT
        o.customer_id,
        DATE_TRUNC('month', o.order_date) AS activity_month
    FROM orders o
    GROUP BY o.customer_id, DATE_TRUNC('month', o.order_date)
)
SELECT
    fp.cohort_month,
    EXTRACT(MONTH FROM AGE(ma.activity_month, fp.cohort_month)) AS months_since_first,
    COUNT(DISTINCT ma.customer_id) AS active_customers
FROM first_purchase fp
JOIN monthly_activity ma ON fp.customer_id = ma.customer_id
GROUP BY fp.cohort_month, months_since_first
ORDER BY fp.cohort_month, months_since_first;
```

## Running Totals and Period Comparisons

```sql
-- YoY comparison with window functions
SELECT
    date_trunc('month', order_date) AS month,
    SUM(revenue) AS monthly_revenue,
    LAG(SUM(revenue), 12) OVER (ORDER BY date_trunc('month', order_date)) AS revenue_prior_year,
    ROUND(
        (SUM(revenue) - LAG(SUM(revenue), 12) OVER (ORDER BY date_trunc('month', order_date)))
        / NULLIF(LAG(SUM(revenue), 12) OVER (ORDER BY date_trunc('month', order_date)), 0) * 100,
        1
    ) AS yoy_pct_change
FROM orders
GROUP BY date_trunc('month', order_date)
ORDER BY month;
```

## Percentile / Distribution Analysis

```sql
-- P50, P75, P95 of claim amounts by category
SELECT
    category,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY amount) AS p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY amount) AS p75,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY amount) AS p95,
    AVG(amount) AS mean_amount,
    COUNT(*) AS n
FROM claims
GROUP BY category;
```

## RFM Segmentation

```sql
WITH rfm AS (
    SELECT
        customer_id,
        NTILE(5) OVER (ORDER BY MAX(order_date) DESC) AS recency_score,
        NTILE(5) OVER (ORDER BY COUNT(*)) AS frequency_score,
        NTILE(5) OVER (ORDER BY SUM(amount)) AS monetary_score
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY customer_id
)
SELECT
    customer_id,
    recency_score,
    frequency_score,
    monetary_score,
    recency_score + frequency_score + monetary_score AS rfm_total,
    CASE
        WHEN recency_score >= 4 AND frequency_score >= 4 THEN 'Champions'
        WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'New Customers'
        WHEN recency_score <= 2 AND frequency_score >= 4 THEN 'At Risk'
        WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Lost'
        ELSE 'Mid-Tier'
    END AS segment
FROM rfm;
```
