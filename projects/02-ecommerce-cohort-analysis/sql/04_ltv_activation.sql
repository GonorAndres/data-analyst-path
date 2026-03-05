-- =============================================================================
-- Script: 04_ltv_activation.sql
-- Business Question: Cual es el valor de vida del cliente por cohorte y que
--                    factores de la primera compra predicen recompra?
-- Purpose: Calculate cumulative LTV by cohort-month and analyze which
--          first-order features (payment type, category, value) correlate
--          with higher repeat-purchase rates.
-- Input Tables: olist_orders, olist_customers, olist_order_items,
--               olist_order_payments, olist_products,
--               product_category_translations
-- Output: Two result sets -- (1) cumulative LTV curves by cohort,
--         (2) activation/repeat rates by first-order characteristics.
-- Dialect: PostgreSQL
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1: Cumulative LTV by cohort-month
-- ─────────────────────────────────────────────────────────────────────────────

WITH delivered_orders AS (
    SELECT
        o.order_id,
        c.customer_unique_id,
        o.order_purchase_timestamp,
        p.total_payment
    FROM olist_orders AS o
    INNER JOIN olist_customers AS c
        ON o.customer_id = c.customer_id
    INNER JOIN (
        SELECT order_id, SUM(payment_value) AS total_payment
        FROM olist_order_payments
        GROUP BY order_id
    ) AS p
        ON o.order_id = p.order_id
    WHERE o.order_status = 'delivered'
),

customer_first_purchase AS (
    SELECT
        customer_unique_id,
        MIN(order_purchase_timestamp) AS first_purchase_date
    FROM delivered_orders
    GROUP BY customer_unique_id
),

cohort_revenue AS (
    -- Revenue per cohort per tenure month
    SELECT
        DATE_TRUNC('month', fp.first_purchase_date)    AS cohort_month,
        (EXTRACT(YEAR FROM AGE(
            DATE_TRUNC('month', d.order_purchase_timestamp),
            DATE_TRUNC('month', fp.first_purchase_date)
        )) * 12
        + EXTRACT(MONTH FROM AGE(
            DATE_TRUNC('month', d.order_purchase_timestamp),
            DATE_TRUNC('month', fp.first_purchase_date)
        )))::INT                                        AS months_since_cohort,
        SUM(d.total_payment)                            AS monthly_revenue,
        COUNT(DISTINCT d.customer_unique_id)            AS active_customers
    FROM delivered_orders AS d
    INNER JOIN customer_first_purchase AS fp
        ON d.customer_unique_id = fp.customer_unique_id
    GROUP BY cohort_month, months_since_cohort
),

cohort_sizes AS (
    SELECT
        DATE_TRUNC('month', first_purchase_date) AS cohort_month,
        COUNT(DISTINCT customer_unique_id)       AS cohort_size
    FROM customer_first_purchase
    GROUP BY cohort_month
),

ltv_by_cohort AS (
    -- Cumulative revenue per customer (LTV) using a running sum
    SELECT
        cr.cohort_month,
        cs.cohort_size,
        cr.months_since_cohort,
        cr.monthly_revenue,
        cr.active_customers,
        SUM(cr.monthly_revenue) OVER (
            PARTITION BY cr.cohort_month
            ORDER BY cr.months_since_cohort
            ROWS UNBOUNDED PRECEDING
        )                                               AS cumulative_revenue,
        ROUND(
            SUM(cr.monthly_revenue) OVER (
                PARTITION BY cr.cohort_month
                ORDER BY cr.months_since_cohort
                ROWS UNBOUNDED PRECEDING
            ) / cs.cohort_size, 2
        )                                               AS ltv_per_customer
    FROM cohort_revenue AS cr
    INNER JOIN cohort_sizes AS cs
        ON cr.cohort_month = cs.cohort_month
)

SELECT
    cohort_month,
    cohort_size,
    months_since_cohort,
    ROUND(monthly_revenue::NUMERIC, 2)     AS monthly_revenue,
    active_customers,
    ROUND(cumulative_revenue::NUMERIC, 2)  AS cumulative_revenue,
    ltv_per_customer
FROM ltv_by_cohort
ORDER BY cohort_month, months_since_cohort;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2: First-order features vs. repeat purchase (activation analysis)
-- ─────────────────────────────────────────────────────────────────────────────

WITH delivered_orders AS (
    SELECT
        o.order_id,
        c.customer_unique_id,
        o.order_purchase_timestamp
    FROM olist_orders AS o
    INNER JOIN olist_customers AS c
        ON o.customer_id = c.customer_id
    WHERE o.order_status = 'delivered'
),

customer_order_seq AS (
    -- Number each customer's orders chronologically
    SELECT
        customer_unique_id,
        order_id,
        ROW_NUMBER() OVER (
            PARTITION BY customer_unique_id
            ORDER BY order_purchase_timestamp
        ) AS order_number,
        COUNT(*) OVER (PARTITION BY customer_unique_id) AS total_orders
    FROM delivered_orders
),

first_orders AS (
    -- Isolate first orders only
    SELECT order_id, customer_unique_id, total_orders
    FROM customer_order_seq
    WHERE order_number = 1
),

first_order_features AS (
    -- Enrich first orders with payment type, category, value, and item count
    SELECT
        fo.customer_unique_id,
        fo.total_orders,
        CASE WHEN fo.total_orders > 1 THEN 1 ELSE 0 END AS is_repeat,
        -- Dominant payment type for the first order
        pay.payment_type                                  AS first_payment_type,
        -- Total value of the first order
        pay.first_order_value,
        -- Number of items in the first order
        itm.item_count,
        -- Category of the first item (by highest price)
        COALESCE(cat.product_category_name_english, pr.product_category_name)
                                                          AS first_category
    FROM first_orders AS fo
    INNER JOIN (
        -- Payment info for the first order (take the dominant type)
        SELECT DISTINCT ON (op.order_id)
            op.order_id,
            op.payment_type,
            SUM(op.payment_value) OVER (PARTITION BY op.order_id) AS first_order_value
        FROM olist_order_payments AS op
        ORDER BY op.order_id, op.payment_value DESC
    ) AS pay
        ON fo.order_id = pay.order_id
    INNER JOIN (
        SELECT order_id, COUNT(*) AS item_count
        FROM olist_order_items
        GROUP BY order_id
    ) AS itm
        ON fo.order_id = itm.order_id
    LEFT JOIN (
        -- Highest-priced item determines the "main" category
        SELECT DISTINCT ON (oi.order_id)
            oi.order_id,
            oi.product_id
        FROM olist_order_items AS oi
        ORDER BY oi.order_id, oi.price DESC
    ) AS top_item
        ON fo.order_id = top_item.order_id
    LEFT JOIN olist_products AS pr
        ON top_item.product_id = pr.product_id
    LEFT JOIN product_category_translations AS cat
        ON pr.product_category_name = cat.product_category_name
),

activation_rates AS (
    -- Repeat rate by first-order feature groups
    SELECT
        'payment_type'                      AS feature,
        first_payment_type                  AS feature_value,
        COUNT(*)                            AS customers,
        SUM(is_repeat)                      AS repeat_customers,
        ROUND(100.0 * SUM(is_repeat) / COUNT(*), 2)
                                            AS repeat_rate_pct,
        ROUND(AVG(first_order_value)::NUMERIC, 2)
                                            AS avg_first_order_value
    FROM first_order_features
    GROUP BY first_payment_type

    UNION ALL

    SELECT
        'item_count_bucket'                 AS feature,
        CASE
            WHEN item_count = 1 THEN '1 item'
            WHEN item_count BETWEEN 2 AND 3 THEN '2-3 items'
            ELSE '4+ items'
        END                                 AS feature_value,
        COUNT(*)                            AS customers,
        SUM(is_repeat)                      AS repeat_customers,
        ROUND(100.0 * SUM(is_repeat) / COUNT(*), 2)
                                            AS repeat_rate_pct,
        ROUND(AVG(first_order_value)::NUMERIC, 2)
                                            AS avg_first_order_value
    FROM first_order_features
    GROUP BY
        CASE
            WHEN item_count = 1 THEN '1 item'
            WHEN item_count BETWEEN 2 AND 3 THEN '2-3 items'
            ELSE '4+ items'
        END

    UNION ALL

    SELECT
        'value_quartile'                    AS feature,
        CASE
            WHEN first_order_value <= 50  THEN 'Q1: <= R$50'
            WHEN first_order_value <= 120 THEN 'Q2: R$51-120'
            WHEN first_order_value <= 250 THEN 'Q3: R$121-250'
            ELSE 'Q4: > R$250'
        END                                 AS feature_value,
        COUNT(*)                            AS customers,
        SUM(is_repeat)                      AS repeat_customers,
        ROUND(100.0 * SUM(is_repeat) / COUNT(*), 2)
                                            AS repeat_rate_pct,
        ROUND(AVG(first_order_value)::NUMERIC, 2)
                                            AS avg_first_order_value
    FROM first_order_features
    GROUP BY
        CASE
            WHEN first_order_value <= 50  THEN 'Q1: <= R$50'
            WHEN first_order_value <= 120 THEN 'Q2: R$51-120'
            WHEN first_order_value <= 250 THEN 'Q3: R$121-250'
            ELSE 'Q4: > R$250'
        END
)

SELECT *
FROM activation_rates
ORDER BY feature, repeat_rate_pct DESC;
