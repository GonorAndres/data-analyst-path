/*
 * 01_claims_summary.sql
 * =====================
 *
 * Business Question:
 *   "What does our claims landscape look like by line of business and status?"
 *
 * Purpose:
 *   Provide a high-level snapshot of the claims portfolio so underwriters and
 *   claims managers can quickly assess volume, open-vs-closed mix, average
 *   severity, and total financial exposure across each line of business.
 *
 * Tables Used:
 *   - claims_synthetic  (one row per claim)
 *
 * Key Metrics:
 *   - Total claim count and open/closed split
 *   - Average paid and incurred severity
 *   - Total paid, total incurred, and total case reserves
 *   - Severity band distribution within each LOB
 *
 * Dialect: PostgreSQL  |  Style: CTEs, snake_case
 */


-- ============================================================
-- 1. Core counts and dollar totals per LOB x status
-- ============================================================
WITH claims_by_lob_status AS (
    SELECT
        line_of_business,
        claim_status,
        COUNT(*)                            AS claim_count,
        ROUND(AVG(paid_amount), 2)          AS avg_paid,
        ROUND(AVG(incurred_amount), 2)      AS avg_incurred,
        ROUND(SUM(paid_amount), 2)          AS total_paid,
        ROUND(SUM(incurred_amount), 2)      AS total_incurred,
        ROUND(SUM(case_reserve), 2)         AS total_case_reserve
    FROM claims_synthetic
    GROUP BY line_of_business, claim_status
),

-- ============================================================
-- 2. Pivot open / closed counts into separate columns per LOB
-- ============================================================
lob_pivot AS (
    SELECT
        line_of_business,
        SUM(claim_count)                                                 AS total_claims,
        SUM(CASE WHEN claim_status = 'Open'   THEN claim_count ELSE 0 END) AS open_claims,
        SUM(CASE WHEN claim_status = 'Closed' THEN claim_count ELSE 0 END) AS closed_claims,
        ROUND(
            100.0
            * SUM(CASE WHEN claim_status = 'Open' THEN claim_count ELSE 0 END)
            / NULLIF(SUM(claim_count), 0),
            1
        )                                                                AS pct_open,
        ROUND(SUM(total_paid), 2)                                        AS total_paid,
        ROUND(SUM(total_incurred), 2)                                    AS total_incurred,
        ROUND(SUM(total_case_reserve), 2)                                AS total_case_reserve,
        ROUND(SUM(total_paid)   / NULLIF(SUM(claim_count), 0), 2)       AS avg_paid_severity,
        ROUND(SUM(total_incurred) / NULLIF(SUM(claim_count), 0), 2)     AS avg_incurred_severity
    FROM claims_by_lob_status
    GROUP BY line_of_business
),

-- ============================================================
-- 3. Severity-band distribution per LOB
-- ============================================================
severity_distribution AS (
    SELECT
        line_of_business,
        severity_band,
        COUNT(*)                       AS band_count,
        ROUND(AVG(incurred_amount), 2) AS avg_incurred_in_band,
        ROUND(SUM(incurred_amount), 2) AS total_incurred_in_band
    FROM claims_synthetic
    GROUP BY line_of_business, severity_band
),

-- ============================================================
-- 4. Grand totals for portfolio-level context
-- ============================================================
portfolio_totals AS (
    SELECT
        'ALL LINES'                   AS line_of_business,
        SUM(total_claims)             AS total_claims,
        SUM(open_claims)              AS open_claims,
        SUM(closed_claims)            AS closed_claims,
        ROUND(
            100.0 * SUM(open_claims) / NULLIF(SUM(total_claims), 0), 1
        )                             AS pct_open,
        SUM(total_paid)               AS total_paid,
        SUM(total_incurred)           AS total_incurred,
        SUM(total_case_reserve)       AS total_case_reserve,
        ROUND(SUM(total_paid)      / NULLIF(SUM(total_claims), 0), 2) AS avg_paid_severity,
        ROUND(SUM(total_incurred)  / NULLIF(SUM(total_claims), 0), 2) AS avg_incurred_severity
    FROM lob_pivot
)

-- ============================================================
-- Result set A: LOB-level summary + portfolio grand total
-- ============================================================
SELECT *
FROM (
    SELECT * FROM lob_pivot
    UNION ALL
    SELECT * FROM portfolio_totals
) AS combined
ORDER BY
    CASE WHEN line_of_business = 'ALL LINES' THEN 1 ELSE 0 END,
    total_incurred DESC;


-- ============================================================
-- Result set B (run separately): Severity-band breakdown per LOB
-- ============================================================
-- SELECT
--     sd.line_of_business,
--     sd.severity_band,
--     sd.band_count,
--     sd.avg_incurred_in_band,
--     sd.total_incurred_in_band,
--     ROUND(
--         100.0 * sd.band_count
--         / NULLIF(lp.total_claims, 0), 1
--     ) AS pct_of_lob_claims
-- FROM severity_distribution sd
-- JOIN lob_pivot lp USING (line_of_business)
-- ORDER BY sd.line_of_business,
--          CASE sd.severity_band
--              WHEN 'Small'  THEN 1
--              WHEN 'Medium' THEN 2
--              WHEN 'Large'  THEN 3
--              WHEN 'Excess' THEN 4
--          END;
