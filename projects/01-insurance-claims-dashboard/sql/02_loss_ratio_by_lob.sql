/*
 * 02_loss_ratio_by_lob.sql
 * ========================
 *
 * Business Question:
 *   "Which lines of business are profitable?"
 *
 * Purpose:
 *   Loss ratio (LR) = incurred losses / earned premium is the single most
 *   important profitability metric in insurance. An LR above 100% means the
 *   line is paying out more in claims than it collects in premium -- before
 *   any expenses. This query computes:
 *     - Annual loss ratios by line of business
 *     - A rolling 3-year average to smooth volatility
 *     - A profitability flag highlighting lines with LR > 100%
 *
 *   Management should focus remediation efforts on LOBs where the rolling
 *   3-year LR consistently exceeds 100%.
 *
 * Tables Used:
 *   - triangles         (provides earned premium and incurred losses by
 *                         accident year and line of business)
 *   - ibnr_results      (provides ultimate incurred estimates that include
 *                         IBNR, giving a more complete view of losses)
 *
 * Notes:
 *   - We use the LATEST development lag per accident year from the triangles
 *     table so each row reflects the most mature evaluation.
 *   - Where ibnr_results are available, we also show the "ultimate" loss
 *     ratio using Chain-Ladder ultimates (accounts for IBNR).
 *
 * Dialect: PostgreSQL  |  Style: CTEs, snake_case
 */


-- ============================================================
-- 1. Pick the most mature evaluation per accident year & LOB
--    from the triangles table (latest development lag)
-- ============================================================
WITH latest_eval AS (
    SELECT DISTINCT ON (line_of_business, accident_year)
        line_of_business,
        accident_year,
        development_lag,
        incur_loss,
        cum_paid_loss,
        earned_prem_net
    FROM triangles
    ORDER BY line_of_business, accident_year, development_lag DESC
),

-- ============================================================
-- 2. Compute annual loss ratios from reported data
-- ============================================================
annual_loss_ratio AS (
    SELECT
        le.line_of_business,
        le.accident_year,
        le.earned_prem_net,
        le.incur_loss                                            AS reported_incurred,
        le.cum_paid_loss                                         AS cumulative_paid,
        ROUND(
            100.0 * le.incur_loss / NULLIF(le.earned_prem_net, 0), 2
        )                                                        AS loss_ratio_pct,
        ROUND(
            100.0 * le.cum_paid_loss / NULLIF(le.earned_prem_net, 0), 2
        )                                                        AS paid_loss_ratio_pct
    FROM latest_eval le
    WHERE le.earned_prem_net > 0
),

-- ============================================================
-- 3. Enrich with IBNR-loaded ultimate loss ratio (Chain-Ladder)
-- ============================================================
with_ultimate AS (
    SELECT
        alr.*,
        ir.ultimate_cl_incurred,
        ir.ibnr_cl_incurred,
        ROUND(
            100.0 * ir.ultimate_cl_incurred / NULLIF(alr.earned_prem_net, 0), 2
        ) AS ultimate_loss_ratio_pct
    FROM annual_loss_ratio alr
    LEFT JOIN ibnr_results ir
        ON  alr.line_of_business = ir.line_of_business
        AND alr.accident_year   = ir.accident_year
),

-- ============================================================
-- 4. Rolling 3-year average loss ratio to smooth cat years
-- ============================================================
with_rolling AS (
    SELECT
        *,
        ROUND(
            AVG(loss_ratio_pct) OVER (
                PARTITION BY line_of_business
                ORDER BY accident_year
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 2
        ) AS rolling_3yr_lr_pct,
        ROUND(
            AVG(ultimate_loss_ratio_pct) OVER (
                PARTITION BY line_of_business
                ORDER BY accident_year
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 2
        ) AS rolling_3yr_ultimate_lr_pct
    FROM with_ultimate
),

-- ============================================================
-- 5. Flag unprofitable LOB-years
-- ============================================================
flagged AS (
    SELECT
        *,
        CASE
            WHEN loss_ratio_pct > 100         THEN 'UNPROFITABLE'
            WHEN loss_ratio_pct BETWEEN 90 AND 100 THEN 'MARGINAL'
            ELSE 'PROFITABLE'
        END AS annual_profitability_flag,
        CASE
            WHEN rolling_3yr_lr_pct > 100     THEN 'CHRONIC ISSUE'
            WHEN rolling_3yr_lr_pct BETWEEN 90 AND 100 THEN 'WATCH LIST'
            ELSE 'HEALTHY'
        END AS rolling_profitability_flag
    FROM with_rolling
)

-- ============================================================
-- Final output: one row per LOB x accident year, sorted for
-- dashboard consumption (worst performers first within each year)
-- ============================================================
SELECT
    line_of_business,
    accident_year,
    earned_prem_net,
    reported_incurred,
    cumulative_paid,
    loss_ratio_pct,
    paid_loss_ratio_pct,
    ultimate_cl_incurred,
    ibnr_cl_incurred,
    ultimate_loss_ratio_pct,
    rolling_3yr_lr_pct,
    rolling_3yr_ultimate_lr_pct,
    annual_profitability_flag,
    rolling_profitability_flag
FROM flagged
ORDER BY accident_year DESC, loss_ratio_pct DESC;
