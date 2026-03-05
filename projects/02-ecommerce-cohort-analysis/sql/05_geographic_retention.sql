-- =============================================================================
-- Script: 05_geographic_retention.sql
-- Business Question: Que estados tienen mejor retencion y como se relaciona
--                    con los tiempos de entrega?
-- Purpose: Analyze retention rates, delivery performance, and review scores
--          by customer state, then rank states to identify geographic patterns.
-- Input Tables: olist_orders, olist_customers, olist_order_items,
--               olist_order_payments
-- Output: One row per state with retention rate, delivery metrics, AOV,
--         review score, and ranking.
-- Dialect: PostgreSQL
-- =============================================================================

WITH delivered_orders AS (
    -- Base table: delivered orders with customer state
    SELECT
        o.order_id,
        c.customer_unique_id,
        c.customer_state,
        o.order_purchase_timestamp,
        o.order_delivered_customer_date,
        o.order_estimated_delivery_date
    FROM olist_orders AS o
    INNER JOIN olist_customers AS c
        ON o.customer_id = c.customer_id
    WHERE o.order_status = 'delivered'
      AND o.order_delivered_customer_date IS NOT NULL
),

state_metrics AS (
    -- Aggregate order-level metrics by state
    SELECT
        d.customer_state,
        COUNT(DISTINCT d.order_id)                      AS total_orders,
        COUNT(DISTINCT d.customer_unique_id)             AS total_customers,
        -- Revenue and AOV
        ROUND(SUM(p.order_total)::NUMERIC, 2)            AS total_revenue,
        ROUND(AVG(p.order_total)::NUMERIC, 2)            AS avg_order_value,
        -- Delivery performance: average days to deliver
        ROUND(AVG(
            EXTRACT(DAY FROM (
                d.order_delivered_customer_date - d.order_purchase_timestamp
            ))
        )::NUMERIC, 1)                                   AS avg_delivery_days,
        -- Delivery reliability: % delivered on or before estimated date
        ROUND(100.0 * COUNT(*) FILTER (
            WHERE d.order_delivered_customer_date <= d.order_estimated_delivery_date
        ) / COUNT(*), 2)                                 AS on_time_pct
    FROM delivered_orders AS d
    INNER JOIN (
        SELECT order_id, SUM(payment_value) AS order_total
        FROM olist_order_payments
        GROUP BY order_id
    ) AS p
        ON d.order_id = p.order_id
    GROUP BY d.customer_state
),

customer_order_counts AS (
    -- Count orders per customer per state for retention calculation
    SELECT
        customer_unique_id,
        customer_state,
        COUNT(DISTINCT order_id) AS order_count
    FROM delivered_orders
    GROUP BY customer_unique_id, customer_state
),

state_retention AS (
    -- Retention = customers with 2+ orders / total customers per state
    SELECT
        customer_state,
        COUNT(DISTINCT customer_unique_id)               AS total_customers,
        COUNT(DISTINCT customer_unique_id) FILTER (
            WHERE order_count >= 2
        )                                                AS repeat_customers,
        ROUND(100.0 *
            COUNT(DISTINCT customer_unique_id) FILTER (WHERE order_count >= 2)
            / COUNT(DISTINCT customer_unique_id), 2
        )                                                AS retention_rate_pct
    FROM customer_order_counts
    GROUP BY customer_state
),

state_ranking AS (
    -- Rank states by retention rate (only states with meaningful volume)
    SELECT
        customer_state,
        retention_rate_pct,
        repeat_customers,
        total_customers,
        RANK() OVER (ORDER BY retention_rate_pct DESC)   AS retention_rank
    FROM state_retention
    WHERE total_customers >= 50  -- filter out tiny states for stability
)

-- Final output: combine retention ranking with delivery and revenue metrics
SELECT
    sr.customer_state,
    sr.retention_rank,
    sr.retention_rate_pct,
    sr.repeat_customers,
    sr.total_customers,
    sm.total_orders,
    sm.total_revenue,
    sm.avg_order_value,
    sm.avg_delivery_days,
    sm.on_time_pct
FROM state_ranking AS sr
INNER JOIN state_metrics AS sm
    ON sr.customer_state = sm.customer_state
ORDER BY sr.retention_rank, sr.customer_state;
