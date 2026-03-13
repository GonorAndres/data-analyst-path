"""Bayesian A/B test analysis endpoint."""

from typing import Optional

from fastapi import APIRouter, Query

from abtest_backend import data_loader
from abtest_backend.stats_engine import (
    beta_posterior,
    credible_interval,
    expected_loss,
    posterior_pdf,
    probability_b_beats_a,
    z_test_proportions,
)

router = APIRouter()

# Uniform (uninformative) prior
PRIOR_ALPHA = 1.0
PRIOR_BETA = 1.0


@router.get("/bayesian")
def bayesian(
    device_type: Optional[str] = Query(None),
    browser: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    user_segment: Optional[str] = Query(None),
    traffic_source: Optional[str] = Query(None),
):
    """Return Bayesian posterior analysis, P(B>A), expected loss,
    credible intervals, PDF curves, and a comparison table vs frequentist."""
    df = data_loader.apply_filters(
        data_loader.df,
        device_type=device_type,
        browser=browser,
        country=country,
        user_segment=user_segment,
        traffic_source=traffic_source,
    )

    if df.empty:
        return {"error": "No data matches the selected filters."}

    control = df[df["group"] == "control"]
    treatment = df[df["group"] == "treatment"]

    n_a = len(control)
    n_b = len(treatment)
    conv_a = int(control["converted"].sum())
    conv_b = int(treatment["converted"].sum())
    fail_a = n_a - conv_a
    fail_b = n_b - conv_b

    # Posteriors
    post_a = beta_posterior(PRIOR_ALPHA, PRIOR_BETA, conv_a, fail_a)
    post_b = beta_posterior(PRIOR_ALPHA, PRIOR_BETA, conv_b, fail_b)

    # Key Bayesian metrics
    prob_b_wins = probability_b_beats_a(post_a, post_b)
    loss = expected_loss(post_a, post_b)

    # Credible intervals
    ci_a = credible_interval(post_a["alpha"], post_a["beta"])
    ci_b = credible_interval(post_b["alpha"], post_b["beta"])

    # PDF curves for plotting
    pdf_a = posterior_pdf(post_a["alpha"], post_a["beta"])
    pdf_b = posterior_pdf(post_b["alpha"], post_b["beta"])

    # Frequentist comparison
    z_result = z_test_proportions(n_a, conv_a, n_b, conv_b)
    freq_significant = z_result["p_value"] < 0.05
    bayes_decisive = prob_b_wins > 0.95 or prob_b_wins < 0.05

    comparison_table = {
        "frequentist": {
            "method": "Two-proportion z-test",
            "p_value": z_result["p_value"],
            "significant": freq_significant,
            "conclusion": (
                "Reject H0: significant difference"
                if freq_significant
                else "Fail to reject H0: no significant difference"
            ),
        },
        "bayesian": {
            "method": "Beta-Binomial conjugate model",
            "prob_b_beats_a": prob_b_wins,
            "decisive": bayes_decisive,
            "conclusion": (
                f"Treatment wins with {prob_b_wins:.1%} probability"
                if prob_b_wins > 0.5
                else f"Control wins with {1 - prob_b_wins:.1%} probability"
            ),
        },
        "agreement": freq_significant == bayes_decisive,
    }

    # Build a list-based comparison table for the frontend
    comparison_list = [
        {
            "framework": "Frequentist",
            "point_estimate": f"{z_result['diff']:.6f}",
            "interval": f"[{z_result['ci_lower']:.6f}, {z_result['ci_upper']:.6f}]",
            "conclusion": comparison_table["frequentist"]["conclusion"],
        },
        {
            "framework": "Bayesian",
            "point_estimate": f"P(B>A) = {prob_b_wins:.4f}",
            "interval": f"A: [{ci_a[0]:.6f}, {ci_a[1]:.6f}] / B: [{ci_b[0]:.6f}, {ci_b[1]:.6f}]",
            "conclusion": comparison_table["bayesian"]["conclusion"],
        },
    ]

    return {
        "posterior_control": post_a,
        "posterior_treatment": post_b,
        "probability_b_beats_a": prob_b_wins,
        "expected_loss": loss,
        "credible_interval_control": [ci_a[0], ci_a[1]],
        "credible_interval_treatment": [ci_b[0], ci_b[1]],
        "posterior_pdf_control": pdf_a,
        "posterior_pdf_treatment": pdf_b,
        "comparison_table": comparison_list,
    }
