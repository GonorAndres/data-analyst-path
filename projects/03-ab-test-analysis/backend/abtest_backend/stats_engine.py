"""Core statistical computation engine for A/B test analysis.

All functions are pure (no side effects) and depend only on scipy, numpy,
and pandas. Organised into four sections: Frequentist, Bayesian, Power
Analysis, and Sequential Testing.
"""

from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy import stats as sp_stats

# ═══════════════════════════════════════════════════════════════════════════
# FREQUENTIST
# ═══════════════════════════════════════════════════════════════════════════


def z_test_proportions(
    n_a: int, conv_a: int, n_b: int, conv_b: int
) -> Dict:
    """Two-proportion z-test for difference in conversion rates.

    Args:
        n_a: Sample size for group A (control).
        conv_a: Number of conversions in group A.
        n_b: Sample size for group B (treatment).
        conv_b: Number of conversions in group B.

    Returns:
        Dict with z_stat, p_value, ci_lower, ci_upper for the difference
        (p_b - p_a).
    """
    p_a = conv_a / n_a if n_a > 0 else 0.0
    p_b = conv_b / n_b if n_b > 0 else 0.0
    diff = p_b - p_a

    # Pooled proportion under H0
    p_pool = (conv_a + conv_b) / (n_a + n_b) if (n_a + n_b) > 0 else 0.0
    se_pool = np.sqrt(p_pool * (1 - p_pool) * (1 / n_a + 1 / n_b)) if (n_a > 0 and n_b > 0) else 0.0

    z_stat = diff / se_pool if se_pool > 0 else 0.0
    p_value = 2 * (1 - sp_stats.norm.cdf(abs(z_stat)))

    # Unpooled SE for confidence interval
    se_unpooled = np.sqrt(
        p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b
    ) if (n_a > 0 and n_b > 0) else 0.0
    z_crit = sp_stats.norm.ppf(0.975)
    ci_lower = diff - z_crit * se_unpooled
    ci_upper = diff + z_crit * se_unpooled

    return {
        "z_stat": round(float(z_stat), 6),
        "p_value": round(float(p_value), 6),
        "ci_lower": round(float(ci_lower), 6),
        "ci_upper": round(float(ci_upper), 6),
        "diff": round(float(diff), 6),
    }


def chi_squared_test(
    n_a: int, conv_a: int, n_b: int, conv_b: int
) -> Dict:
    """Chi-squared test of independence for 2x2 conversion table.

    Returns:
        Dict with chi2, p_value, cramers_v.
    """
    table = np.array([
        [conv_a, n_a - conv_a],
        [conv_b, n_b - conv_b],
    ])
    chi2, p_value, _, _ = sp_stats.chi2_contingency(table, correction=False)
    n = table.sum()
    cramers_v = np.sqrt(chi2 / n) if n > 0 else 0.0

    return {
        "chi2": round(float(chi2), 6),
        "p_value": round(float(p_value), 6),
        "cramers_v": round(float(cramers_v), 6),
    }


def wilson_confidence_interval(
    successes: int, trials: int, alpha: float = 0.05
) -> Tuple[float, float]:
    """Wilson score confidence interval for a single proportion.

    Returns:
        (lower, upper) bounds.
    """
    if trials == 0:
        return (0.0, 0.0)
    z = sp_stats.norm.ppf(1 - alpha / 2)
    p_hat = successes / trials
    denom = 1 + z**2 / trials
    center = (p_hat + z**2 / (2 * trials)) / denom
    margin = z * np.sqrt((p_hat * (1 - p_hat) + z**2 / (4 * trials)) / trials) / denom
    return (round(float(center - margin), 6), round(float(center + margin), 6))


def cohens_h(p1: float, p2: float) -> Dict:
    """Cohen's h effect size for difference between two proportions.

    Args:
        p1: Proportion for group A (control).
        p2: Proportion for group B (treatment).

    Returns:
        Dict with effect_size and interpretation.
    """
    h = 2 * np.arcsin(np.sqrt(p2)) - 2 * np.arcsin(np.sqrt(p1))
    abs_h = abs(h)
    if abs_h < 0.2:
        interpretation = "small"
    elif abs_h < 0.5:
        interpretation = "medium"
    else:
        interpretation = "large"

    return {
        "effect_size": round(float(h), 6),
        "interpretation": interpretation,
    }


# ═══════════════════════════════════════════════════════════════════════════
# BAYESIAN
# ═══════════════════════════════════════════════════════════════════════════


def beta_posterior(
    prior_alpha: float, prior_beta: float, successes: int, failures: int
) -> Dict:
    """Compute Beta posterior parameters.

    Args:
        prior_alpha: Alpha param of Beta prior.
        prior_beta: Beta param of Beta prior.
        successes: Observed successes.
        failures: Observed failures.

    Returns:
        Dict with posterior alpha and beta.
    """
    return {
        "alpha": prior_alpha + successes,
        "beta": prior_beta + failures,
    }


def probability_b_beats_a(
    post_a: Dict, post_b: Dict, n_simulations: int = 100_000
) -> float:
    """Monte Carlo estimate of P(B > A).

    Args:
        post_a: Dict with alpha, beta for group A posterior.
        post_b: Dict with alpha, beta for group B posterior.
        n_simulations: Number of samples.

    Returns:
        Probability that B's conversion rate exceeds A's.
    """
    rng = np.random.default_rng(42)
    samples_a = rng.beta(post_a["alpha"], post_a["beta"], size=n_simulations)
    samples_b = rng.beta(post_b["alpha"], post_b["beta"], size=n_simulations)
    return round(float(np.mean(samples_b > samples_a)), 6)


def expected_loss(
    post_a: Dict, post_b: Dict, n_simulations: int = 100_000
) -> Dict:
    """Expected loss (risk) of choosing each variant.

    Args:
        post_a: Dict with alpha, beta for group A posterior.
        post_b: Dict with alpha, beta for group B posterior.
        n_simulations: Number of samples.

    Returns:
        Dict with loss_a (expected loss if choosing A) and loss_b
        (expected loss if choosing B).
    """
    rng = np.random.default_rng(42)
    samples_a = rng.beta(post_a["alpha"], post_a["beta"], size=n_simulations)
    samples_b = rng.beta(post_b["alpha"], post_b["beta"], size=n_simulations)
    loss_a = float(np.mean(np.maximum(samples_b - samples_a, 0)))
    loss_b = float(np.mean(np.maximum(samples_a - samples_b, 0)))
    return {
        "loss_a": round(loss_a, 6),
        "loss_b": round(loss_b, 6),
    }


def credible_interval(
    alpha: float, beta: float, level: float = 0.95
) -> Tuple[float, float]:
    """Highest-density credible interval from a Beta distribution.

    Args:
        alpha: Alpha param.
        beta: Beta param.
        level: Credibility level (default 0.95).

    Returns:
        (lower, upper) bounds.
    """
    tail = (1 - level) / 2
    lower = sp_stats.beta.ppf(tail, alpha, beta)
    upper = sp_stats.beta.ppf(1 - tail, alpha, beta)
    return (round(float(lower), 6), round(float(upper), 6))


def posterior_pdf(
    alpha: float, beta: float, x_points: int = 200
) -> Dict:
    """Generate x and pdf values for plotting the Beta posterior.

    Args:
        alpha: Alpha param.
        beta: Beta param.
        x_points: Number of evaluation points.

    Returns:
        Dict with lists 'x' and 'pdf'.
    """
    x = np.linspace(0, 1, x_points)
    pdf = sp_stats.beta.pdf(x, alpha, beta)
    return {
        "x": [round(float(v), 6) for v in x],
        "pdf": [round(float(v), 6) for v in pdf],
    }


# ═══════════════════════════════════════════════════════════════════════════
# POWER ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════


def required_sample_size(
    baseline_rate: float,
    mde: float,
    alpha: float = 0.05,
    power: float = 0.8,
) -> int:
    """Required sample size per group to detect the given MDE.

    Uses the formula for two-proportion z-test sample size.

    Args:
        baseline_rate: Control conversion rate.
        mde: Minimum detectable effect (absolute difference).
        alpha: Significance level.
        power: Statistical power (1 - beta).

    Returns:
        Required n per group (integer, rounded up).
    """
    p1 = baseline_rate
    p2 = baseline_rate + mde
    z_alpha = sp_stats.norm.ppf(1 - alpha / 2)
    z_beta = sp_stats.norm.ppf(power)
    numerator = (
        z_alpha * np.sqrt(2 * p1 * (1 - p1))
        + z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
    ) ** 2
    denominator = (p2 - p1) ** 2
    if denominator == 0:
        return 0
    return int(np.ceil(numerator / denominator))


def minimum_detectable_effect(
    n: int,
    baseline_rate: float,
    alpha: float = 0.05,
    power: float = 0.8,
) -> float:
    """MDE detectable with the given sample size per group.

    Uses binary search to invert the sample-size formula.

    Args:
        n: Sample size per group.
        baseline_rate: Control conversion rate.
        alpha: Significance level.
        power: Statistical power.

    Returns:
        Minimum detectable effect (absolute).
    """
    lo, hi = 0.0001, 0.5
    for _ in range(100):
        mid = (lo + hi) / 2
        needed = required_sample_size(baseline_rate, mid, alpha, power)
        if needed <= n:
            hi = mid
        else:
            lo = mid
    return round(float(hi), 6)


def power_curve(
    baseline_rate: float,
    n: int,
    alpha: float = 0.05,
    effect_sizes: Optional[List[float]] = None,
) -> List[Dict]:
    """Compute power for a range of effect sizes given fixed sample size.

    Args:
        baseline_rate: Control conversion rate.
        n: Sample size per group.
        alpha: Significance level.
        effect_sizes: List of absolute effect sizes to evaluate.

    Returns:
        List of dicts with effect_size and power.
    """
    if effect_sizes is None:
        effect_sizes = [round(x, 4) for x in np.linspace(0.001, 0.05, 25)]

    z_alpha = sp_stats.norm.ppf(1 - alpha / 2)
    results = []
    for es in effect_sizes:
        p1 = baseline_rate
        p2 = baseline_rate + es
        se = np.sqrt(p1 * (1 - p1) / n + p2 * (1 - p2) / n) if n > 0 else 1.0
        z = es / se if se > 0 else 0.0
        pwr = float(sp_stats.norm.cdf(z - z_alpha) + sp_stats.norm.cdf(-z - z_alpha))
        results.append({
            "effect_size": round(float(es), 6),
            "power": round(pwr, 6),
        })
    return results


# ═══════════════════════════════════════════════════════════════════════════
# SEQUENTIAL TESTING
# ═══════════════════════════════════════════════════════════════════════════


def cumulative_stats_by_day(source_df: pd.DataFrame) -> List[Dict]:
    """Compute daily cumulative conversion statistics by group.

    Expects columns: date (or timestamp), group ('control'/'treatment'),
    converted (0/1).

    Returns:
        List of dicts sorted by date with daily and cumulative metrics.
    """
    df = source_df.copy()
    if "date" not in df.columns and "timestamp" in df.columns:
        df["date"] = pd.to_datetime(df["timestamp"]).dt.date

    if df.empty or "date" not in df.columns:
        return []

    daily = (
        df.groupby(["date", "group"])
        .agg(n=("converted", "count"), conversions=("converted", "sum"))
        .reset_index()
        .sort_values("date")
    )

    dates = sorted(daily["date"].unique())
    cum_n_c, cum_conv_c = 0, 0
    cum_n_t, cum_conv_t = 0, 0
    results = []

    for d in dates:
        day_data = daily[daily["date"] == d]
        ctrl = day_data[day_data["group"] == "control"]
        treat = day_data[day_data["group"] == "treatment"]

        n_c = int(ctrl["n"].sum()) if not ctrl.empty else 0
        conv_c = int(ctrl["conversions"].sum()) if not ctrl.empty else 0
        n_t = int(treat["n"].sum()) if not treat.empty else 0
        conv_t = int(treat["conversions"].sum()) if not treat.empty else 0

        cum_n_c += n_c
        cum_conv_c += conv_c
        cum_n_t += n_t
        cum_conv_t += conv_t

        cum_conv_rate_c = cum_conv_c / cum_n_c if cum_n_c > 0 else 0.0
        cum_conv_rate_t = cum_conv_t / cum_n_t if cum_n_t > 0 else 0.0

        # Z-test on cumulative data
        z_result = z_test_proportions(cum_n_c, cum_conv_c, cum_n_t, cum_conv_t)

        results.append({
            "date": str(d),
            "n_control": n_c,
            "n_treatment": n_t,
            "conv_control": conv_c,
            "conv_treatment": conv_t,
            "cum_n_control": cum_n_c,
            "cum_n_treatment": cum_n_t,
            "cum_conv_control": cum_conv_c,
            "cum_conv_treatment": cum_conv_t,
            "cum_conv_rate_control": round(cum_conv_rate_c, 6),
            "cum_conv_rate_treatment": round(cum_conv_rate_t, 6),
            "z_stat": z_result["z_stat"],
            "p_value": z_result["p_value"],
        })

    return results


def obrien_fleming_bounds(
    n_looks: int, alpha: float = 0.05
) -> List[float]:
    """O'Brien-Fleming spending function boundaries.

    Computes the critical z-value at each interim look using the
    O'Brien-Fleming alpha-spending approach.

    Args:
        n_looks: Total number of planned interim analyses.
        alpha: Overall significance level.

    Returns:
        List of critical z-values for each look (1 through n_looks).
    """
    if n_looks <= 0:
        return []

    boundaries = []
    for k in range(1, n_looks + 1):
        info_fraction = k / n_looks
        # O'Brien-Fleming boundary: z_alpha / sqrt(info_fraction)
        z_alpha = sp_stats.norm.ppf(1 - alpha / 2)
        boundary = z_alpha / np.sqrt(info_fraction)
        boundaries.append(round(float(boundary), 6))
    return boundaries


def sample_ratio_mismatch_test(
    n_control: int, n_treatment: int
) -> Dict:
    """Test whether the control/treatment split matches the expected 50/50.

    Uses a chi-squared goodness-of-fit test.

    Returns:
        Dict with chi2, p_value, is_balanced.
    """
    total = n_control + n_treatment
    if total == 0:
        return {"chi2": 0.0, "p_value": 1.0, "is_balanced": True}

    expected = total / 2
    chi2 = (n_control - expected) ** 2 / expected + (n_treatment - expected) ** 2 / expected
    p_value = 1 - sp_stats.chi2.cdf(chi2, df=1)

    return {
        "chi2": round(float(chi2), 6),
        "p_value": round(float(p_value), 6),
        "is_balanced": bool(p_value > 0.01),
    }
