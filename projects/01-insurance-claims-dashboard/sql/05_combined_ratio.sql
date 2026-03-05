/*
 * 05_combined_ratio.sql
 * =====================
 *
 * Business Question:
 *   "Is the portfolio profitable after expenses?"
 *
 * Purpose:
 *   The combined ratio is the gold-standard profitability metric in P&C
 *   insurance. It tells management whether the company is making or losing
 *   money on its underwriting operations:
 *
 *       Combined Ratio = Loss Ratio + Expense Ratio
 *
 *   - Loss Ratio     = incurred losses / earned premium
 *   - Expense Ratio  = underwriting expenses / earned premium
 *
 *   A combined ratio below 100% means underwriting profit; above 100%
 *   means underwriting loss (the company relies on investment income to
 *   stay profitable).
 *
 *   **Assumption**: In the absence of a separate expense table, we use a
 *   flat 30% expense ratio (industry average for U.S. P&C). This can be
 *   refined when actual expense data becomes available.
 *
 * Tables Used:
 *   - triangles      (earned premium, incurred losses)
 *   - ibnr_results   (ultimate losses including IBNR for a forward-looking view)
 *
 * Key Outputs:
 *   - Annual combined ratio by LOB (reported basis)
 *   - Annual combined ratio by LOB (ultimate basis, includes IBNR)
 *   - 3-year rolling combined ratio for trend analysis
 *   - Portfolio-wide aggregated combined ratio
 *
 * Dialect: PostgreSQL  |  Style: CTEs, snake_case
 */


-- ============================================================
-- 0. Parameter: assumed flat expense ratio
-- ============================================================
-- Using a WITH clause to make the assumption explicit and easy to change
WITH params AS (
    SELECT 0.30 AS assumed_expense_ratio
),

-- ============================================================
-- 1. Latest evaluation of incurred losses and premium per LOB-year
-- ============================================================
latest_eval AS (
    SELECT DISTINCT ON (line_of_business, accident_year)
        line_of_business,
        accident_year,
        development_lag,
        incur_loss,
        cum_paid_loss,
        earned_prem_net
    FROM triangles
    WHERE earned_prem_net > 0
    ORDER BY line_of_business, accident_year, development_lag DESC
),

-- ============================================================
-- 2. Compute loss ratio components (reported basis)
-- ============================================================
reported_ratios AS (
    SELECT
        le.line_of_business,
        le.accident_year,
        le.earned_prem_net,
        le.incur_loss                                             AS reported_incurred,
        le.cum_paid_loss,
        -- Loss ratio (reported)
        ROUND(
            100.0 * le.incur_loss / NULLIF(le.earned_prem_net, 0), 2
        )                                                         AS loss_ratio_pct,
        -- Expense ratio (assumed)
        ROUND(p.assumed_expense_ratio * 100, 2)                   AS expense_ratio_pct,
        -- Combined ratio (reported)
        ROUND(
            100.0 * le.incur_loss / NULLIF(le.earned_prem_net, 0)
            + p.assumed_expense_ratio * 100, 2
        )                                                         AS combined_ratio_pct,
        -- Expense dollars for reference
        ROUND(le.earned_prem_net * p.assumed_expense_ratio, 2)    AS assumed_expenses,
        -- Underwriting result = premium - losses - expenses
        ROUND(
            le.earned_prem_net
            - le.incur_loss
            - (le.earned_prem_net * p.assumed_expense_ratio), 2
        )                                                         AS underwriting_result
    FROM latest_eval le
    CROSS JOIN params p
),

-- ============================================================
-- 3. Enrich with ultimate (IBNR-loaded) combined ratio
-- ============================================================
with_ultimate AS (
    SELECT
        rr.*,
        ir.ultimate_cl_incurred,
        ir.ibnr_cl_incurred,
        ROUND(
            100.0 * ir.ultimate_cl_incurred / NULLIF(rr.earned_prem_net, 0), 2
        )                                                         AS ultimate_loss_ratio_pct,
        ROUND(
            100.0 * ir.ultimate_cl_incurred / NULLIF(rr.earned_prem_net, 0)
            + rr.expense_ratio_pct, 2
        )                                                         AS ultimate_combined_ratio_pct,
        -- Ultimate underwriting result
        ROUND(
            rr.earned_prem_net
            - COALESCE(ir.ultimate_cl_incurred, rr.reported_incurred)
            - rr.assumed_expenses, 2
        )                                                         AS ultimate_underwriting_result
    FROM reported_ratios rr
    LEFT JOIN ibnr_results ir
        ON  rr.line_of_business = ir.line_of_business
        AND rr.accident_year    = ir.accident_year
),

-- ============================================================
-- 4. Rolling 3-year combined ratio for trend analysis
-- ============================================================
with_rolling AS (
    SELECT
        *,
        ROUND(
            AVG(combined_ratio_pct) OVER (
                PARTITION BY line_of_business
                ORDER BY accident_year
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 2
        ) AS rolling_3yr_combined_pct,
        ROUND(
            AVG(ultimate_combined_ratio_pct) OVER (
                PARTITION BY line_of_business
                ORDER BY accident_year
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 2
        ) AS rolling_3yr_ultimate_combined_pct,
        -- Year-over-year change in combined ratio
        ROUND(
            combined_ratio_pct
            - LAG(combined_ratio_pct) OVER (
                PARTITION BY line_of_business
                ORDER BY accident_year
            ), 2
        ) AS combined_ratio_yoy_change
    FROM with_ultimate
),

-- ============================================================
-- 5. Profitability classification
-- ============================================================
classified AS (
    SELECT
        *,
        CASE
            WHEN combined_ratio_pct < 95  THEN 'STRONG PROFIT'
            WHEN combined_ratio_pct < 100 THEN 'MARGINAL PROFIT'
            WHEN combined_ratio_pct < 110 THEN 'MARGINAL LOSS'
            ELSE 'SIGNIFICANT LOSS'
        END AS profitability_band,
        CASE
            WHEN combined_ratio_yoy_change IS NULL THEN 'N/A'
            WHEN combined_ratio_yoy_change < -5    THEN 'IMPROVING'
            WHEN combined_ratio_yoy_change > 5     THEN 'DETERIORATING'
            ELSE 'STABLE'
        END AS trend_direction
    FROM with_rolling
)

-- ============================================================
-- Final output: LOB x accident year combined ratio analysis
-- ============================================================
SELECT
    line_of_business,
    accident_year,
    earned_prem_net,
    reported_incurred,
    assumed_expenses,
    loss_ratio_pct,
    expense_ratio_pct,
    combined_ratio_pct,
    underwriting_result,
    ultimate_cl_incurred,
    ibnr_cl_incurred,
    ultimate_loss_ratio_pct,
    ultimate_combined_ratio_pct,
    ultimate_underwriting_result,
    rolling_3yr_combined_pct,
    rolling_3yr_ultimate_combined_pct,
    combined_ratio_yoy_change,
    profitability_band,
    trend_direction
FROM classified
ORDER BY accident_year DESC, combined_ratio_pct DESC;

-- ============================================================
-- Portfolio-level summary (run separately)
-- ============================================================
-- WITH params AS (SELECT 0.30 AS assumed_expense_ratio),
-- portfolio AS (
--     SELECT DISTINCT ON (line_of_business, accident_year)
--         accident_year,
--         incur_loss,
--         earned_prem_net
--     FROM triangles
--     WHERE earned_prem_net > 0
--     ORDER BY line_of_business, accident_year, development_lag DESC
-- )
-- SELECT
--     p.accident_year,
--     SUM(p.earned_prem_net)                                       AS total_premium,
--     SUM(p.incur_loss)                                            AS total_incurred,
--     ROUND(SUM(p.earned_prem_net) * pr.assumed_expense_ratio, 2)  AS total_expenses,
--     ROUND(100.0 * SUM(p.incur_loss) / NULLIF(SUM(p.earned_prem_net), 0), 2)
--                                                                   AS portfolio_loss_ratio,
--     ROUND(100.0 * SUM(p.incur_loss) / NULLIF(SUM(p.earned_prem_net), 0)
--         + pr.assumed_expense_ratio * 100, 2)                      AS portfolio_combined_ratio,
--     ROUND(
--         SUM(p.earned_prem_net)
--         - SUM(p.incur_loss)
--         - SUM(p.earned_prem_net) * pr.assumed_expense_ratio, 2
--     )                                                             AS portfolio_uw_result
-- FROM portfolio p
-- CROSS JOIN params pr
-- GROUP BY p.accident_year, pr.assumed_expense_ratio
-- ORDER BY p.accident_year DESC;
