/*
 * 04_triangle_pivot.sql
 * =====================
 *
 * Business Question:
 *   "What does the loss development pattern look like?"
 *
 * Purpose:
 *   Actuaries and reserving analysts need to see how losses develop over
 *   time in the classic "triangle" format -- accident years as rows and
 *   development lags as columns. This query pivots the long-format
 *   triangles table into the standard wide layout for both:
 *     - Incurred loss triangle  (case reserves + paid)
 *     - Cumulative paid loss triangle
 *
 *   These triangles are the foundation for Chain-Ladder, Bornhuetter-Ferguson,
 *   and other reserving methods.
 *
 * Tables Used:
 *   - triangles  (long format: one row per accident_year x development_lag)
 *
 * Notes:
 *   - Development lags 1 through 10 are pivoted into columns. Adjust the
 *     FILTER clauses if the data contains more lags.
 *   - Age-to-age factors (link ratios) are computed from the incurred
 *     triangle to show the implicit development pattern.
 *   - A separate CTE produces volume-weighted average factors across all
 *     accident years (the standard all-year weighted average selection).
 *
 * Dialect: PostgreSQL  |  Style: CTEs, snake_case
 */


-- ============================================================
-- 1. Incurred loss triangle (wide format)
--    Rows: line_of_business x accident_year
--    Columns: dev lags 1-10
-- ============================================================
WITH incurred_triangle AS (
    SELECT
        line_of_business,
        accident_year,
        MAX(incur_loss) FILTER (WHERE development_lag = 1)  AS incurred_lag_01,
        MAX(incur_loss) FILTER (WHERE development_lag = 2)  AS incurred_lag_02,
        MAX(incur_loss) FILTER (WHERE development_lag = 3)  AS incurred_lag_03,
        MAX(incur_loss) FILTER (WHERE development_lag = 4)  AS incurred_lag_04,
        MAX(incur_loss) FILTER (WHERE development_lag = 5)  AS incurred_lag_05,
        MAX(incur_loss) FILTER (WHERE development_lag = 6)  AS incurred_lag_06,
        MAX(incur_loss) FILTER (WHERE development_lag = 7)  AS incurred_lag_07,
        MAX(incur_loss) FILTER (WHERE development_lag = 8)  AS incurred_lag_08,
        MAX(incur_loss) FILTER (WHERE development_lag = 9)  AS incurred_lag_09,
        MAX(incur_loss) FILTER (WHERE development_lag = 10) AS incurred_lag_10
    FROM triangles
    GROUP BY line_of_business, accident_year
),

-- ============================================================
-- 2. Cumulative paid loss triangle (wide format)
-- ============================================================
paid_triangle AS (
    SELECT
        line_of_business,
        accident_year,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 1)  AS paid_lag_01,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 2)  AS paid_lag_02,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 3)  AS paid_lag_03,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 4)  AS paid_lag_04,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 5)  AS paid_lag_05,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 6)  AS paid_lag_06,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 7)  AS paid_lag_07,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 8)  AS paid_lag_08,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 9)  AS paid_lag_09,
        MAX(cum_paid_loss) FILTER (WHERE development_lag = 10) AS paid_lag_10
    FROM triangles
    GROUP BY line_of_business, accident_year
),

-- ============================================================
-- 3. Age-to-age (link ratio) factors for incurred losses
--    Factor from lag N to lag N+1 = loss at N+1 / loss at N
-- ============================================================
incurred_factors AS (
    SELECT
        line_of_business,
        accident_year,
        ROUND(incurred_lag_02 / NULLIF(incurred_lag_01, 0), 4) AS ata_01_02,
        ROUND(incurred_lag_03 / NULLIF(incurred_lag_02, 0), 4) AS ata_02_03,
        ROUND(incurred_lag_04 / NULLIF(incurred_lag_03, 0), 4) AS ata_03_04,
        ROUND(incurred_lag_05 / NULLIF(incurred_lag_04, 0), 4) AS ata_04_05,
        ROUND(incurred_lag_06 / NULLIF(incurred_lag_05, 0), 4) AS ata_05_06,
        ROUND(incurred_lag_07 / NULLIF(incurred_lag_06, 0), 4) AS ata_06_07,
        ROUND(incurred_lag_08 / NULLIF(incurred_lag_07, 0), 4) AS ata_07_08,
        ROUND(incurred_lag_09 / NULLIF(incurred_lag_08, 0), 4) AS ata_08_09,
        ROUND(incurred_lag_10 / NULLIF(incurred_lag_09, 0), 4) AS ata_09_10
    FROM incurred_triangle
),

-- ============================================================
-- 4. Volume-weighted average age-to-age factors across all
--    accident years (standard actuarial "all-year weighted")
-- ============================================================
weighted_avg_factors AS (
    SELECT
        line_of_business,
        ROUND(SUM(incurred_lag_02) / NULLIF(SUM(incurred_lag_01), 0), 4) AS wtd_ata_01_02,
        ROUND(SUM(incurred_lag_03) / NULLIF(SUM(incurred_lag_02), 0), 4) AS wtd_ata_02_03,
        ROUND(SUM(incurred_lag_04) / NULLIF(SUM(incurred_lag_03), 0), 4) AS wtd_ata_03_04,
        ROUND(SUM(incurred_lag_05) / NULLIF(SUM(incurred_lag_04), 0), 4) AS wtd_ata_04_05,
        ROUND(SUM(incurred_lag_06) / NULLIF(SUM(incurred_lag_05), 0), 4) AS wtd_ata_05_06,
        ROUND(SUM(incurred_lag_07) / NULLIF(SUM(incurred_lag_06), 0), 4) AS wtd_ata_06_07,
        ROUND(SUM(incurred_lag_08) / NULLIF(SUM(incurred_lag_07), 0), 4) AS wtd_ata_07_08,
        ROUND(SUM(incurred_lag_09) / NULLIF(SUM(incurred_lag_08), 0), 4) AS wtd_ata_08_09,
        ROUND(SUM(incurred_lag_10) / NULLIF(SUM(incurred_lag_09), 0), 4) AS wtd_ata_09_10
    FROM incurred_triangle
    GROUP BY line_of_business
)

-- ============================================================
-- Result set A: Incurred loss triangle + individual ATA factors
-- ============================================================
SELECT
    it.line_of_business,
    it.accident_year,
    it.incurred_lag_01,
    it.incurred_lag_02,
    it.incurred_lag_03,
    it.incurred_lag_04,
    it.incurred_lag_05,
    it.incurred_lag_06,
    it.incurred_lag_07,
    it.incurred_lag_08,
    it.incurred_lag_09,
    it.incurred_lag_10,
    af.ata_01_02,
    af.ata_02_03,
    af.ata_03_04,
    af.ata_04_05,
    af.ata_05_06,
    af.ata_06_07,
    af.ata_07_08,
    af.ata_08_09,
    af.ata_09_10
FROM incurred_triangle it
LEFT JOIN incurred_factors af
    ON  it.line_of_business = af.line_of_business
    AND it.accident_year    = af.accident_year
ORDER BY it.line_of_business, it.accident_year;

-- ============================================================
-- Result set B (run separately): Paid loss triangle
-- ============================================================
-- SELECT * FROM paid_triangle
-- ORDER BY line_of_business, accident_year;

-- ============================================================
-- Result set C (run separately): Volume-weighted average factors
-- ============================================================
-- SELECT * FROM weighted_avg_factors
-- ORDER BY line_of_business;
