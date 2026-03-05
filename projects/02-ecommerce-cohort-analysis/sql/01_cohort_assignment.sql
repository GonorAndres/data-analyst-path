-- =============================================================================
-- Script: 01_cohort_assignment.sql
-- Business Question: A que cohorte pertenece cada cliente y cual es su historial
--                    de compras?
-- Purpose: Assign each customer to a monthly cohort based on their first
--          delivered purchase, then compute order sequence numbers and tenure.
-- Input Tables: olist_orders, olist_customers
-- Output: One row per customer-order with cohort_month, months_since_cohort,
--         and order_number.
-- Dialect: PostgreSQL
-- =============================================================================

WITH delivered_orders AS (
    -- Only consider orders that were actually delivered
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
    -- Determine each customer's first purchase date (defines their cohort)
    SELECT
        customer_unique_id,
        MIN(order_purchase_timestamp) AS first_purchase_date
    FROM delivered_orders
    GROUP BY customer_unique_id
),

cohort_assignment AS (
    -- Join back to get cohort month and tenure for every order
    SELECT
        d.order_id,
        d.customer_unique_id,
        d.order_purchase_timestamp,
        fp.first_purchase_date,
        DATE_TRUNC('month', fp.first_purchase_date)       AS cohort_month,
        DATE_TRUNC('month', d.order_purchase_timestamp)    AS order_month,
        -- Months elapsed since the customer's cohort month
        (EXTRACT(YEAR FROM AGE(
            DATE_TRUNC('month', d.order_purchase_timestamp),
            DATE_TRUNC('month', fp.first_purchase_date)
        )) * 12
        + EXTRACT(MONTH FROM AGE(
            DATE_TRUNC('month', d.order_purchase_timestamp),
            DATE_TRUNC('month', fp.first_purchase_date)
        )))::INT                                            AS months_since_cohort
    FROM delivered_orders AS d
    INNER JOIN customer_first_purchase AS fp
        ON d.customer_unique_id = fp.customer_unique_id
)

-- Final output: add sequential order number per customer
SELECT
    order_id,
    customer_unique_id,
    order_purchase_timestamp,
    first_purchase_date,
    cohort_month,
    order_month,
    months_since_cohort,
    ROW_NUMBER() OVER (
        PARTITION BY customer_unique_id
        ORDER BY order_purchase_timestamp
    ) AS order_number
FROM cohort_assignment
ORDER BY customer_unique_id, order_purchase_timestamp;
