/*
 * 03_frequency_severity.sql
 * =========================
 *
 * Business Question:
 *   "Are losses driven by more claims or larger claims?"
 *
 * Purpose:
 *   Pure premium (loss cost per exposure) can be decomposed as:
 *
 *       Pure Premium = Frequency x Severity
 *
 *   where Frequency = claim count / exposure (here proxied by policy count)
 *   and Severity = average loss per claim. Understanding which component is
 *   driving loss trends tells management whether to focus on:
 *     - Loss prevention / risk selection  (if frequency is rising)
 *     - Claims management / reserving      (if severity is rising)
 *
 *   This query produces year-over-year trends for both components by line
 *   of business, plus the resulting pure premium, and flags which driver
 *   is growing faster.
 *
 * Tables Used:
 *   - claims_synthetic   (individual claim records with paid/incurred amounts)
 *   - triangles          (earned premium used as an exposure proxy where
 *                          policy counts are unavailable)
 *
 * Notes:
 *   - Accident year is derived from the accident_date column.
 *   - We proxy exposure using earned premium from the triangles table,
 *     yielding "loss rate" rather than pure frequency per policy.
 *   - Both paid and incurred bases are provided so analysts can choose.
 *
 * Dialect: PostgreSQL  |  Style: CTEs, snake_case
 */


-- ============================================================
-- 1. Aggregate claim-level data to LOB x accident year
-- ============================================================
WITH claims_agg AS (
    SELECT
        line_of_business,
        EXTRACT(YEAR FROM accident_date)::INT  AS accident_year,
        COUNT(*)                                AS claim_count,
        ROUND(AVG(paid_amount), 2)              AS avg_paid_severity,
        ROUND(AVG(incurred_amount), 2)          AS avg_incurred_severity,
        ROUND(SUM(paid_amount), 2)              AS total_paid,
        ROUND(SUM(incurred_amount), 2)          AS total_incurred,
        -- Severity-band mix for context
        SUM(CASE WHEN severity_band = 'Small'  THEN 1 ELSE 0 END) AS small_count,
        SUM(CASE WHEN severity_band = 'Medium' THEN 1 ELSE 0 END) AS medium_count,
        SUM(CASE WHEN severity_band = 'Large'  THEN 1 ELSE 0 END) AS large_count,
        SUM(CASE WHEN severity_band = 'Excess' THEN 1 ELSE 0 END) AS excess_count
    FROM claims_synthetic
    GROUP BY line_of_business, EXTRACT(YEAR FROM accident_date)
),

-- ============================================================
-- 2. Get earned premium per LOB x accident year as exposure proxy
-- ============================================================
premium_base AS (
    SELECT DISTINCT ON (line_of_business, accident_year)
        line_of_business,
        accident_year,
        earned_prem_net
    FROM triangles
    WHERE earned_prem_net > 0
    ORDER BY line_of_business, accident_year, development_lag DESC
),

-- ============================================================
-- 3. Join claims with premium to compute frequency and pure premium
-- ============================================================
freq_sev AS (
    SELECT
        ca.line_of_business,
        ca.accident_year,
        ca.claim_count,
        pb.earned_prem_net,
        -- Frequency: claims per $1M of earned premium
        ROUND(
            ca.claim_count * 1000000.0 / NULLIF(pb.earned_prem_net, 0), 4
        )                                             AS frequency_per_1m_premium,
        ca.avg_paid_severity,
        ca.avg_incurred_severity,
        ca.total_paid,
        ca.total_incurred,
        -- Pure premium per $1 of exposure
        ROUND(
            ca.total_incurred / NULLIF(pb.earned_prem_net, 0), 6
        )                                             AS pure_premium_rate,
        -- Severity-band percentages
        ROUND(100.0 * ca.small_count  / NULLIF(ca.claim_count, 0), 1) AS pct_small,
        ROUND(100.0 * ca.medium_count / NULLIF(ca.claim_count, 0), 1) AS pct_medium,
        ROUND(100.0 * ca.large_count  / NULLIF(ca.claim_count, 0), 1) AS pct_large,
        ROUND(100.0 * ca.excess_count / NULLIF(ca.claim_count, 0), 1) AS pct_excess
    FROM claims_agg ca
    LEFT JOIN premium_base pb
        ON  ca.line_of_business = pb.line_of_business
        AND ca.accident_year    = pb.accident_year
),

-- ============================================================
-- 4. Year-over-year growth rates to identify the loss driver
-- ============================================================
with_yoy AS (
    SELECT
        *,
        -- Frequency YoY change
        ROUND(
            100.0 * (
                frequency_per_1m_premium
                - LAG(frequency_per_1m_premium) OVER w
            ) / NULLIF(LAG(frequency_per_1m_premium) OVER w, 0), 2
        ) AS frequency_yoy_pct,
        -- Severity YoY change (incurred basis)
        ROUND(
            100.0 * (
                avg_incurred_severity
                - LAG(avg_incurred_severity) OVER w
            ) / NULLIF(LAG(avg_incurred_severity) OVER w, 0), 2
        ) AS severity_yoy_pct,
        -- Pure premium YoY change
        ROUND(
            100.0 * (
                pure_premium_rate
                - LAG(pure_premium_rate) OVER w
            ) / NULLIF(LAG(pure_premium_rate) OVER w, 0), 2
        ) AS pure_premium_yoy_pct
    FROM freq_sev
    WINDOW w AS (PARTITION BY line_of_business ORDER BY accident_year)
),

-- ============================================================
-- 5. Flag the dominant loss driver per LOB-year
-- ============================================================
driver_flagged AS (
    SELECT
        *,
        CASE
            WHEN frequency_yoy_pct IS NULL OR severity_yoy_pct IS NULL
                THEN 'N/A (first year)'
            WHEN ABS(COALESCE(frequency_yoy_pct, 0)) > ABS(COALESCE(severity_yoy_pct, 0))
                THEN 'FREQUENCY DRIVEN'
            WHEN ABS(COALESCE(severity_yoy_pct, 0)) > ABS(COALESCE(frequency_yoy_pct, 0))
                THEN 'SEVERITY DRIVEN'
            ELSE 'BALANCED'
        END AS primary_loss_driver
    FROM with_yoy
)

-- ============================================================
-- Final output
-- ============================================================
SELECT
    line_of_business,
    accident_year,
    claim_count,
    earned_prem_net,
    frequency_per_1m_premium,
    avg_paid_severity,
    avg_incurred_severity,
    pure_premium_rate,
    frequency_yoy_pct,
    severity_yoy_pct,
    pure_premium_yoy_pct,
    primary_loss_driver,
    pct_small,
    pct_medium,
    pct_large,
    pct_excess
FROM driver_flagged
ORDER BY line_of_business, accident_year;
