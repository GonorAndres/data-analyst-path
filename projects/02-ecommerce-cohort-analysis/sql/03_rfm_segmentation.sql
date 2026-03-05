-- =============================================================================
-- Script: 03_rfm_segmentation.sql
-- Business Question: Como se segmentan los clientes por Recencia, Frecuencia
--                    y Valor Monetario?
-- Purpose: Score every customer on Recency, Frequency, and Monetary value
--          using quintiles, then map score combinations to business segments.
-- Input Tables: olist_orders, olist_customers, olist_order_payments
-- Output: Customer-level RFM scores with segment labels, plus a segment
--         summary with counts and averages.
-- Dialect: PostgreSQL
-- =============================================================================

WITH delivered_orders AS (
    -- Delivered orders with payment totals
    SELECT
        o.order_id,
        c.customer_unique_id,
        o.order_purchase_timestamp,
        p.total_payment
    FROM olist_orders AS o
    INNER JOIN olist_customers AS c
        ON o.customer_id = c.customer_id
    INNER JOIN (
        -- Aggregate payments per order (one order can have multiple payments)
        SELECT order_id, SUM(payment_value) AS total_payment
        FROM olist_order_payments
        GROUP BY order_id
    ) AS p
        ON o.order_id = p.order_id
    WHERE o.order_status = 'delivered'
),

reference_date AS (
    -- Use the day after the last purchase as the analysis reference point
    SELECT (MAX(order_purchase_timestamp)::date + INTERVAL '1 day') AS ref_date
    FROM delivered_orders
),

customer_rfm AS (
    -- Calculate raw RFM metrics per customer
    SELECT
        d.customer_unique_id,
        -- Recency: days since last purchase
        EXTRACT(DAY FROM (r.ref_date - MAX(d.order_purchase_timestamp)))::INT
            AS recency_days,
        -- Frequency: number of distinct orders
        COUNT(DISTINCT d.order_id)                  AS frequency,
        -- Monetary: total lifetime spend
        ROUND(SUM(d.total_payment)::NUMERIC, 2)     AS monetary
    FROM delivered_orders AS d
    CROSS JOIN reference_date AS r
    GROUP BY d.customer_unique_id, r.ref_date
),

rfm_scores AS (
    -- Assign quintile scores (1-5); for recency, lower days = better = higher score
    SELECT
        customer_unique_id,
        recency_days,
        frequency,
        monetary,
        -- Recency: NTILE ascending means score 5 = most recent (reverse order)
        NTILE(5) OVER (ORDER BY recency_days DESC)   AS r_score,
        NTILE(5) OVER (ORDER BY frequency ASC)        AS f_score,
        NTILE(5) OVER (ORDER BY monetary ASC)         AS m_score
    FROM customer_rfm
),

rfm_segments AS (
    -- Map score combinations to human-readable segment labels
    SELECT
        customer_unique_id,
        recency_days,
        frequency,
        monetary,
        r_score,
        f_score,
        m_score,
        CASE
            -- Champions: top recency AND (top frequency OR monetary)
            WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4
                THEN 'Champions'
            -- Loyal Customers: high frequency regardless of recency
            WHEN f_score >= 4 AND m_score >= 3
                THEN 'Loyal Customers'
            -- Potential Loyalists: recent and moderate frequency
            WHEN r_score >= 4 AND f_score IN (2, 3)
                THEN 'Potential Loyalists'
            -- New Customers: very recent, low frequency
            WHEN r_score >= 4 AND f_score = 1
                THEN 'New Customers'
            -- At Risk: were good customers, haven't purchased recently
            WHEN r_score IN (2, 3) AND f_score >= 3
                THEN 'At Risk'
            -- Hibernating: below-average recency and frequency
            WHEN r_score IN (2, 3) AND f_score IN (1, 2)
                THEN 'Hibernating'
            -- Lost: haven't purchased in a long time
            WHEN r_score = 1
                THEN 'Lost'
            ELSE 'Other'
        END AS segment
    FROM rfm_scores
)

-- Segment-level summary with counts and average metrics
SELECT
    segment,
    COUNT(*)                                AS customer_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2)
                                            AS pct_of_total,
    ROUND(AVG(recency_days)::NUMERIC, 0)    AS avg_recency_days,
    ROUND(AVG(frequency)::NUMERIC, 2)       AS avg_frequency,
    ROUND(AVG(monetary)::NUMERIC, 2)        AS avg_monetary,
    ROUND(SUM(monetary)::NUMERIC, 2)        AS total_revenue
FROM rfm_segments
GROUP BY segment
ORDER BY total_revenue DESC;
