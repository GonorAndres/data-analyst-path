-- =============================================================================
-- Script: 02_retention_matrix.sql
-- Business Question: Cual es la tasa de retencion mensual por cohorte?
-- Purpose: Build a cohort retention matrix showing what percentage of each
--          cohort's customers returned in subsequent months.
-- Input Tables: olist_orders, olist_customers
-- Output: One row per cohort with retention percentages for months 0-11.
-- Dialect: PostgreSQL
-- =============================================================================

WITH delivered_orders AS (
    -- Only consider delivered orders
    SELECT
        o.order_id,
        c.customer_unique_id,
        o.order_purchase_timestamp
    FROM olist_orders AS o
    INNER JOIN olist_customers AS c
        ON o.customer_id = c.customer_id
    WHERE o.order_status = 'delivered'
),

customer_first_purchase AS (
    -- Each customer's cohort-defining first purchase
    SELECT
        customer_unique_id,
        MIN(order_purchase_timestamp) AS first_purchase_date
    FROM delivered_orders
    GROUP BY customer_unique_id
),

cohort_data AS (
    -- Attach cohort month and tenure to every order
    SELECT
        d.customer_unique_id,
        DATE_TRUNC('month', fp.first_purchase_date)    AS cohort_month,
        (EXTRACT(YEAR FROM AGE(
            DATE_TRUNC('month', d.order_purchase_timestamp),
            DATE_TRUNC('month', fp.first_purchase_date)
        )) * 12
        + EXTRACT(MONTH FROM AGE(
            DATE_TRUNC('month', d.order_purchase_timestamp),
            DATE_TRUNC('month', fp.first_purchase_date)
        )))::INT                                        AS months_since_cohort
    FROM delivered_orders AS d
    INNER JOIN customer_first_purchase AS fp
        ON d.customer_unique_id = fp.customer_unique_id
),

cohort_sizes AS (
    -- Total unique customers in each cohort (month 0 by definition)
    SELECT
        cohort_month,
        COUNT(DISTINCT customer_unique_id) AS cohort_size
    FROM cohort_data
    WHERE months_since_cohort = 0
    GROUP BY cohort_month
),

monthly_activity AS (
    -- Distinct customers active in each cohort-month combination
    SELECT
        cohort_month,
        months_since_cohort,
        COUNT(DISTINCT customer_unique_id) AS active_customers
    FROM cohort_data
    GROUP BY cohort_month, months_since_cohort
)

-- Pivot into a retention-rate matrix (months 0 through 11)
SELECT
    s.cohort_month,
    s.cohort_size,
    -- Month 0 is always 100% by construction
    ROUND(MAX(CASE WHEN m.months_since_cohort = 0
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_0,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 1
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_1,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 2
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_2,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 3
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_3,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 4
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_4,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 5
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_5,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 6
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_6,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 7
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_7,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 8
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_8,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 9
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_9,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 10
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_10,
    ROUND(MAX(CASE WHEN m.months_since_cohort = 11
        THEN m.active_customers * 100.0 / s.cohort_size END), 2) AS month_11
FROM cohort_sizes AS s
LEFT JOIN monthly_activity AS m
    ON s.cohort_month = m.cohort_month
GROUP BY s.cohort_month, s.cohort_size
ORDER BY s.cohort_month;
