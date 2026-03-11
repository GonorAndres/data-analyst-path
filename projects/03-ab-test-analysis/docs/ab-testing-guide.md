# A/B Testing: From Theory to Practice

**A Bridge Document for the E-Commerce Landing Page Experiment**

*Andres Ortega*

---

> **Abstract**
>
> This document is a comprehensive guide to every statistical concept behind the A/B Test Lab dashboard.
> It covers the full pipeline: from experimental design and randomization, through frequentist and Bayesian hypothesis testing,
> to power analysis, sequential monitoring, and common pitfalls like Simpson's Paradox and multiple testing.
> Each concept is presented in three layers: a formal mathematical definition, a geometric or analogy-based intuition,
> and a concrete application grounded in the dashboard's actual backend code (`stats_engine.py`).
>
> **Notation.**
> $p_A, p_B$: true conversion rates for control and treatment.
> $\hat{p}_A, \hat{p}_B$: observed sample proportions.
> $n_A, n_B$: sample sizes per group.
> $\alpha$: significance level; $\beta$: Type II error rate; $1-\beta$: power.
> $\Phi$: standard normal CDF; $\Phi^{-1}$: its inverse.
> $z_{\alpha/2} = \Phi^{-1}(1-\alpha/2)$, e.g. $z_{0.025} = 1.96$.

---

## Table of Contents

1. [Experimental Design Fundamentals](#1-experimental-design-fundamentals)
2. [Frequentist Inference for Proportions](#2-frequentist-inference-for-proportions)
3. [Bayesian Inference for A/B Testing](#3-bayesian-inference-for-ab-testing)
4. [Frequentist vs. Bayesian: A Comparison](#4-frequentist-vs-bayesian-a-comparison)
5. [Power Analysis](#5-power-analysis)
6. [Sequential Testing](#6-sequential-testing)
7. [Simpson's Paradox](#7-simpsons-paradox)
8. [Multiple Testing Corrections](#8-multiple-testing-corrections)
9. [Cross-Topic Connections](#9-cross-topic-connections)
10. [Summary Table](#10-summary-table)
11. [Key Formulas Quick Reference](#11-key-formulas-quick-reference)

---

## 1. Experimental Design Fundamentals

> **Formal: Randomization and SRM Detection**
>
> In a controlled experiment, each user $i$ is assigned to group $G_i \in \{A, B\}$ via:
>
> $$P(G_i = A) = \pi_A, \quad P(G_i = B) = 1 - \pi_A$$
>
> Typically $\pi_A = \pi_B = 0.5$. Randomization ensures that, in expectation, all covariates $X$ are balanced:
>
> $$E[X \mid G = A] = E[X \mid G = B]$$
>
> This is the foundation of causal inference: any observed difference in outcomes $Y$ can be attributed to the treatment, not to confounders.
>
> **Sample Ratio Mismatch (SRM).** Given expected counts $E_A = n \cdot \pi_A$ and $E_B = n \cdot \pi_B$, SRM is detected via chi-squared goodness-of-fit:
>
> $$\chi^2 = \frac{(n_A - E_A)^2}{E_A} + \frac{(n_B - E_B)^2}{E_B}, \quad \chi^2 \sim \chi^2_1 \text{ under } H_0$$
>
> Reject balance if $p < 0.01$. An SRM means the randomization mechanism is broken and all results become untrustworthy.

> **Intuition: The Rigged Shuffle**
>
> Think of randomization like shuffling a deck of cards and dealing into two piles. A fair shuffle balances *everything*, even factors you have not thought of. That is its superpower.
>
> SRM is the "rigged shuffle" detector. If you expected 50/50 and got 55/45 with 100K users, the chi-squared test will flag it: the shuffle was rigged. You should not trust any result from a rigged shuffle, even if the treatment looks amazing.
>
> The **unit of randomization** matters: one user can generate many sessions. If you randomize by session, a power user who visits 50 times could see both variants, contaminating the experiment. Randomize by user: one user, one variant, always.

> **Application: Dashboard -- Test Health Checks**
>
> The **Executive Overview** tab shows the SRM test result under "Test Health Checks." The backend function `sample_ratio_mismatch_test(n_control, n_treatment)` computes the chi-squared statistic using `scipy.stats.chi2.cdf(chi2, df=1)`, reports the p-value, and flags `is_balanced = True` if $p > 0.01$.
>
> **Worked example from the dataset:** With $n_A = 145{,}310$ and $n_B = 145{,}274$ (total $290{,}584$):
>
> $$E_A = E_B = 145{,}292, \quad \chi^2 = \frac{(145310 - 145292)^2}{145292} + \frac{(145274 - 145292)^2}{145292} = \frac{324 + 324}{145292} \approx 0.0045$$
>
> $p \approx 0.95$. No SRM detected; the randomization is clean.

> **Dashboard Connection**
>
> **Tab:** Executive Overview --> Test Health Checks.
>
> **Backend:** `routers/overview.py` calls `stats_engine.sample_ratio_mismatch_test()`.
>
> **Scipy:** `scipy.stats.chi2.cdf(chi2, df=1)`.

---

## 2. Frequentist Inference for Proportions

### 2.1 The Two-Proportion Z-Test

> **Formal: Z-Test for Two Proportions**
>
> Let $X_A \sim \mathrm{Binomial}(n_A, p_A)$ and $X_B \sim \mathrm{Binomial}(n_B, p_B)$ be independent. Hypotheses:
>
> $$H_0: p_A = p_B \quad \text{vs.} \quad H_1: p_A \neq p_B$$
>
> **Pooled proportion** (under $H_0$):
>
> $$\hat{p} = \frac{X_A + X_B}{n_A + n_B}$$
>
> **Test statistic:**
>
> $$Z = \frac{\hat{p}_B - \hat{p}_A}{\underbrace{\sqrt{\hat{p}(1-\hat{p})\left(\dfrac{1}{n_A} + \dfrac{1}{n_B}\right)}}_{\text{pooled SE}}}$$
>
> Under $H_0$ and by the CLT, $Z \xrightarrow{d} N(0,1)$. Reject $H_0$ if $|Z| > z_{\alpha/2}$.
>
> **p-value:** $p = 2\,\Phi(-|Z|)$.
>
> **Confidence interval** (uses *unpooled* SE, since we do not assume $p_A = p_B$ for the CI):
>
> $$\mathrm{SE}_{\mathrm{CI}} = \sqrt{\frac{\hat{p}_A(1-\hat{p}_A)}{n_A} + \frac{\hat{p}_B(1-\hat{p}_B)}{n_B}}, \qquad \mathrm{CI}_{1-\alpha}: (\hat{p}_B - \hat{p}_A) \pm z_{\alpha/2} \cdot \mathrm{SE}_{\mathrm{CI}}$$
>
> **Why pooled for the test but unpooled for the CI?** Under $H_0$, the best estimate of the common $p$ is the pooled proportion. But the CI estimates the *difference* $p_B - p_A$ without assuming equality, so each variance is estimated separately.

> **Intuition: Signal-to-Noise Ratio**
>
> The numerator $\hat{p}_B - \hat{p}_A$ is the **signal**: the observed difference. The denominator (SE) is the **noise**: how much random variation we would expect from chance alone. $Z$ measures how many "noise units" the signal spans. If $|Z| > 2$, the signal is louder than what chance typically produces.
>
> **The CI tells you the range of plausible truths.** If the 95% CI for the difference is $(0.001, 0.008)$, the true lift is somewhere in there with 95% coverage. If the CI includes zero, the data is consistent with no effect.

> **Application: Dashboard -- Frequentist Tab**
>
> The backend function `z_test_proportions(n_a, conv_a, n_b, conv_b)` returns `{z_stat, p_value, ci_lower, ci_upper, diff}`. It uses `scipy.stats.norm.cdf(abs(z_stat))` for the p-value and `scipy.stats.norm.ppf(0.975)` for the critical $z$ value.
>
> The **Frequentist Analysis** tab displays:
> - Confidence interval visualization (horizontal bar showing control CI, treatment CI, and overlap)
> - P-value context: where it falls relative to $\alpha = 0.05$
> - The 2x2 contingency table with observed vs. expected counts

### 2.2 Chi-Squared Test of Independence

> **Formal: Chi-Squared for a 2x2 Table**
>
> For the contingency table with observed counts $O_{ij}$ and expected counts $E_{ij} = R_i \cdot C_j / N$:
>
> $$\chi^2 = \sum_{i,j} \frac{(O_{ij} - E_{ij})^2}{E_{ij}}, \qquad \chi^2 \sim \chi^2_1$$
>
> **Equivalence:** For a 2x2 table, $\chi^2 = Z^2$ exactly. They always give the same p-value for a two-sided test. The chi-squared test is the z-test in disguise; squaring removes the direction.
>
> **Cramer's V** (effect size for contingency tables):
>
> $$V = \sqrt{\frac{\chi^2}{n}}$$

> **Intuition: Z-Test in Disguise**
>
> Squaring the z-statistic removes the sign (direction), which is why chi-squared is inherently two-sided. If you need a one-sided test, use the z-test directly. For A/B testing, we almost always want to know the direction ("is B *better*?"), so the z-test is more informative. The chi-squared is a redundant check that should give the same answer.

> **Application: Backend Implementation**
>
> `chi_squared_test(n_a, conv_a, n_b, conv_b)` builds the 2x2 contingency table and calls `scipy.stats.chi2_contingency(table)`, returning $\chi^2$, p-value, and Cramer's V. The Frequentist tab displays all three alongside the z-test results.

### 2.3 Wilson Score Confidence Interval

> **Formal: Wilson Score Interval**
>
> The standard Wald interval $\hat{p} \pm z\sqrt{\hat{p}(1-\hat{p})/n}$ can produce intervals outside $[0,1]$ and has zero width when $\hat{p} \in \{0, 1\}$.
>
> The Wilson interval is derived by inverting the z-test. Find all $p_0$ such that:
>
> $$\left|\frac{\hat{p} - p_0}{\sqrt{p_0(1-p_0)/n}}\right| \leq z_{\alpha/2}$$
>
> Squaring and solving the resulting quadratic:
>
> $$\tilde{p} = \frac{\hat{p} + z^2/(2n)}{1 + z^2/n}, \qquad \text{Wilson CI} = \tilde{p} \pm \frac{z}{1 + z^2/n}\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}$$
>
> The center $\tilde{p}$ is a *shrunken* estimate that pulls $\hat{p}$ toward $0.5$, more so for small $n$.

> **Intuition: Pulling Toward Ignorance**
>
> The Wald interval says "I trust my data completely." The Wilson interval says "I trust my data, but I hedge toward 50% a little, especially when I have few observations." This prevents the embarrassing case of observing 0 failures in 10 trials and concluding the failure rate is exactly zero.

> **Application: Dashboard -- Wilson CIs per Group**
>
> `wilson_confidence_interval(successes, trials, alpha)` uses `scipy.stats.norm.ppf(1 - alpha/2)` and returns the (lower, upper) bounds. The Frequentist tab calls this separately for control and treatment to display per-group CIs, which is more informative than just the CI on the difference.

### 2.4 Cohen's h Effect Size

> **Formal: Cohen's h for Proportions**
>
> The arcsine transformation stabilizes variance:
>
> $$h = 2\arcsin\!\left(\sqrt{p_B}\right) - 2\arcsin\!\left(\sqrt{p_A}\right)$$
>
> **Why arcsine?** The transformation $\phi = 2\arcsin(\sqrt{p})$ is variance-stabilizing: $\mathrm{Var}(\hat{p}) = p(1-p)/n$ depends on $p$, but $\mathrm{Var}(\phi) \approx 1/n$, independent of $p$.
>
> | $\|h\|$ | Interpretation |
> |---|---|
> | $< 0.20$ | Small effect |
> | $0.20$ -- $0.50$ | Medium effect |
> | $\geq 0.50$ | Large effect |
>
> **Example:** $p_A = 0.10$, $p_B = 0.12$ (20% relative lift). $h = 2\arcsin(\sqrt{0.12}) - 2\arcsin(\sqrt{0.10}) = 0.064$, a very small effect. Large relative lifts on small baselines are hard to detect because the absolute effect in standardized units is tiny.

> **Intuition: Proportions Near 0 or 1 Are Harder**
>
> Imagine stretching a rubber band between 0 and 1. The arcsine transformation stretches the ends (near 0 and 1) and compresses the middle (near 0.5). A change from 0.01 to 0.02 maps to a larger $h$ than you might expect, while 0.49 to 0.50 maps to a smaller $h$. This reflects reality: detecting changes near the extremes is genuinely harder because $p(1-p)$ is smallest there.

> **Application: Effect Size Gauge on the Dashboard**
>
> `cohens_h(p1, p2)` computes $h$ and returns the interpretation string. The Frequentist tab displays this as an "Effect Size Gauge" with small/medium/large labels, giving stakeholders a quick read on whether the detected difference is practically meaningful, not just statistically significant.

### 2.5 Proper p-Value Interpretation

> **Formal: What a p-Value Is and Is Not**
>
> Formally:
>
> $$p\text{-value} = P(\text{data as extreme or more extreme} \mid H_0 \text{ is true})$$
>
> **Common misinterpretations:**
> 1. "There is a 5% probability the null is true." **Wrong.** The p-value conditions on $H_0$; computing $P(H_0 \mid \text{data})$ requires Bayes' theorem and a prior.
> 2. "The effect size is $1 - p$." **Wrong.** p-values say nothing about effect magnitude.
> 3. "$p = 0.049$ is meaningfully different from $p = 0.051$." **Wrong.** The $\alpha = 0.05$ threshold is a convention, not a physical constant.
> 4. "Failing to reject $H_0$ means $H_0$ is true." **Wrong.** The test may be underpowered (see [Power Analysis](#5-power-analysis)).

> **Intuition: The Courtroom Analogy**
>
> A p-value is like the prosecution's evidence in a trial where the defendant ($H_0$) is presumed innocent. A small p-value means the evidence is strong, but even overwhelming evidence does not tell you the *probability* of innocence. The jury can say "guilty beyond reasonable doubt" (reject $H_0$) or "not proven" (fail to reject), but never "there is a 3% chance the defendant is innocent."

> **Application: Dashboard -- P-Value Context**
>
> The Frequentist tab shows the p-value not just as a number but as a visual showing where it falls relative to $\alpha$, preventing the common mistake of treating $p = 0.049$ and $p = 0.051$ as fundamentally different outcomes.

> **Dashboard Connection**
>
> **Tab:** Frequentist Analysis.
>
> **Backend:** `routers/frequentist.py` calls `z_test_proportions()`, `chi_squared_test()`, `wilson_confidence_interval()` (for both groups), and `cohens_h()`.
>
> **Additional:** Welch's t-test via `scipy.stats.ttest_ind(equal_var=False)` for continuous metrics (revenue, session duration).

---

## 3. Bayesian Inference for A/B Testing

### 3.1 The Beta-Binomial Conjugate Model

> **Formal: Beta Prior and Posterior Update**
>
> **Prior:**
>
> $$p_A \sim \mathrm{Beta}(\alpha_A, \beta_A), \quad f(p; \alpha, \beta) = \frac{p^{\alpha-1}(1-p)^{\beta-1}}{B(\alpha, \beta)}$$
>
> **Common prior choices:**
> - $\mathrm{Beta}(1, 1)$: uniform (non-informative). The dashboard uses this.
> - $\mathrm{Beta}(0.5, 0.5)$: Jeffreys prior (invariant under reparameterization).
> - $\mathrm{Beta}(100, 9900)$: informative, encoding belief that $p \approx 0.01$.
>
> **Likelihood:** $X_A \mid p_A \sim \mathrm{Binomial}(n_A, p_A)$.
>
> **Posterior** (conjugacy):
>
> $$p_A \mid X_A \sim \mathrm{Beta}(\alpha_A + X_A, \;\beta_A + n_A - X_A)$$
>
> The update is simply *addition*: add successes to $\alpha$, add failures to $\beta$. The posterior mean is a weighted average between the prior mean and the MLE:
>
> $$E[p_A \mid X_A] = \frac{\alpha_A + X_A}{\alpha_A + \beta_A + n_A}$$

> **Intuition: The Belief Histogram and Imaginary Data**
>
> The Beta distribution is a "belief histogram" over where the true conversion rate lies. $\mathrm{Beta}(1,1)$ is flat: equal belief everywhere. After observing 100 conversions and 9,900 non-conversions, your belief becomes $\mathrm{Beta}(101, 9901)$: a sharp bump centered at ${\sim}0.01$.
>
> **The prior as imaginary data.** $\mathrm{Beta}(\alpha, \beta)$ is equivalent to having already seen $\alpha - 1$ successes and $\beta - 1$ failures. $\mathrm{Beta}(1,1)$ means zero imaginary observations. The more imaginary data you inject, the harder it is for real data to move your beliefs.
>
> **The see-saw.** The prior is one end, the data is the other. With little data, the see-saw tips toward the prior. With lots of data, it tips toward the observed rate. The fulcrum position is $n_{\mathrm{prior}} / (n_{\mathrm{prior}} + n_{\mathrm{data}})$ where $n_{\mathrm{prior}} = \alpha + \beta$.

> **Application: Dashboard -- Posterior Distribution Chart**
>
> `beta_posterior(prior_alpha, prior_beta, successes, failures)` returns the updated $(\alpha, \beta)$. The backend uses $\mathrm{Beta}(1, 1)$ as the prior (constants `PRIOR_ALPHA = 1.0`, `PRIOR_BETA = 1.0`).
>
> `posterior_pdf(alpha, beta, x_points=200)` evaluates the density via `scipy.stats.beta.pdf(x, alpha, beta)` at 200 points, sent to the frontend as `{x: [...], pdf: [...]}` for the overlapping area chart on the Bayesian tab.

### 3.2 P(B > A) via Monte Carlo

> **Formal: Probability That Treatment Beats Control**
>
> Draw $S$ samples from each posterior:
>
> $$p_A^{(s)} \sim \mathrm{Beta}(\alpha_A', \beta_A'), \quad p_B^{(s)} \sim \mathrm{Beta}(\alpha_B', \beta_B'), \quad s = 1, \ldots, S$$
>
> Then:
>
> $$\widehat{P}(p_B > p_A \mid \text{data}) = \frac{1}{S}\sum_{s=1}^{S} \mathbf{1}\!\left[p_B^{(s)} > p_A^{(s)}\right]$$
>
> With $S = 100{,}000$, the Monte Carlo standard error is $\leq \sqrt{0.25/100000} \approx 0.0016$.
>
> **Closed-form** (Evan Miller): For equal priors, there is an exact formula using the regularized incomplete beta function, but it is computationally expensive for large parameters. Monte Carlo is more practical.

> **Intuition: The Question Everyone Actually Wants Answered**
>
> When a product manager asks "is B better?", they want a probability. The frequentist answers: "if there were truly no difference, we would see data this extreme only 3% of the time." That answers a question nobody asked.
>
> The Bayesian $P(B > A) = 0.97$ is direct: "there is a 97% probability that B has a higher conversion rate." This is the natural language of decision-making.

> **Application: Dashboard -- Probability Donut Chart**
>
> `probability_b_beats_a(post_a, post_b, n_simulations=100000)` uses `np.random.default_rng(42).beta()` for reproducibility. The Bayesian tab displays this as a donut chart labeled "Probability of Being Best."

### 3.3 Expected Loss

> **Formal: Expected Loss (Regret)**
>
> The loss of choosing B when the true parameters are $(p_A, p_B)$:
>
> $$L(\text{choose } B; p_A, p_B) = \max(p_A - p_B, \; 0)$$
>
> If B is worse, we lose the difference; if B is better, we lose nothing.
>
> **Expected loss** via Monte Carlo:
>
> $$\widehat{E}\bigl[\text{Loss}(\text{choose } B)\bigr] = \frac{1}{S}\sum_{s=1}^{S} \max\!\left(p_A^{(s)} - p_B^{(s)}, \; 0\right)$$
>
> **Decision rule:** Ship B when $E[\text{Loss}(\text{choose } B)] < \varepsilon$, where $\varepsilon$ is a business-defined threshold. Unlike the frequentist $\alpha$, $\varepsilon$ has a direct business interpretation: "we accept a maximum average loss of $\varepsilon$ percentage points of conversion rate."

> **Intuition: Insurance Pricing**
>
> Think of choosing variant B as buying insurance. The expected loss is the premium: the average amount you would lose if B turns out worse, weighted by how likely that is. If the premium is negligibly small (below $\varepsilon$), the "insurance" is practically free: go with B.

> **Application: Dashboard -- Expected Loss Display**
>
> `expected_loss(post_a, post_b, n_simulations=100000)` uses `np.maximum(diff, 0)` for the one-sided max and returns `{loss_a, loss_b}`. The Bayesian tab shows both losses, allowing the viewer to see not just which variant is better, but how much they would lose by picking the wrong one.

### 3.4 Credible Intervals

> **Formal: Equal-Tailed CI vs. Highest Density Interval**
>
> **Equal-tailed credible interval (ETI):** $[q_{\alpha/2}, q_{1-\alpha/2}]$ where $q_p$ is the $p$-th quantile of the posterior. Excludes $\alpha/2$ probability from each tail.
>
> **Highest Density Interval (HDI):** The narrowest interval containing $1-\alpha$ probability mass. For any point inside the HDI, the posterior density is higher than for any point outside.
>
> For symmetric posteriors (large $n$, moderate $p$): ETI $\approx$ HDI. For skewed posteriors (small $n$, extreme $p$): HDI is narrower and more informative.

> **Application: Backend -- Beta Quantiles**
>
> `credible_interval(alpha, beta, level=0.95)` uses `scipy.stats.beta.ppf()` to compute the equal-tailed interval. The dashboard shows side-by-side 95% credible interval bars for control and treatment on the Bayesian tab.

> **Dashboard Connection**
>
> **Tab:** Bayesian Analysis.
>
> **Backend:** `routers/bayesian.py` calls all four functions above, plus builds a comparison table against the frequentist results. Agreement check: frequentist significant $\approx$ Bayesian decisive ($P(B>A) > 0.95$ or $< 0.05$).

---

## 4. Frequentist vs. Bayesian: A Comparison

> **Formal: Side-by-Side Comparison**
>
> | Dimension | Frequentist | Bayesian |
> |---|---|---|
> | Probability | Long-run frequency | Degree of belief |
> | Parameters | Fixed, unknown constants | Random variables with distributions |
> | Output | p-values, confidence intervals | Posteriors, credible intervals |
> | Error control | Type I ($\alpha$), Type II ($\beta$) rates | Expected loss, posterior risk |
> | Sample size | Must be fixed before experiment | Can be flexible (with caveats) |
> | Prior info | Not formally incorporated | Encoded via prior distributions |
> | Interval meaning | "95% of CIs from repeated experiments contain the truth" | "95% probability the truth is in this interval" |
>
> **Bernstein--von Mises theorem:** With a flat prior and large samples, Bayesian credible intervals converge to frequentist confidence intervals:
>
> $$p \mid \text{data} \xrightarrow{d} N\!\left(\hat{p}_{\mathrm{MLE}}, \; \frac{1}{I(\hat{p}_{\mathrm{MLE}})}\right)$$
>
> In finite samples with informative priors, the approaches can diverge meaningfully.

> **Intuition: The Weather Forecast**
>
> **Frequentist:** "Under long-run repetitions of similar atmospheric conditions, it rains 30% of the time." Technically correct, but awkward.
>
> **Bayesian:** "There is a 30% chance of rain tomorrow." Natural, actionable, what people actually want.
>
> **When frequentist is better:** Regulatory contexts (FDA, financial audits) where pre-specified error rates matter; when there is no reasonable prior; when transparency is paramount.
>
> **When Bayesian is better:** Decision-making under uncertainty; small samples where the prior regularizes; when stakeholders want probabilities, not p-values; sequential decisions.

> **Application: Dashboard -- Comparison Table**
>
> The Bayesian tab's comparison table (built in `routers/bayesian.py`) shows both frameworks' conclusions side by side: point estimate, interval, and conclusion. When they agree, the decision is easy. When they disagree (e.g., $p = 0.049$ but $P(B>A) = 0.83$), it signals that evidence is weak and more data is needed.

---

## 5. Power Analysis

### 5.1 Sample Size for Two Proportions

> **Formal: Sample Size Formula**
>
> For a two-sided z-test comparing $p_A$ vs. $p_B = p_A + \delta$ with significance $\alpha$ and power $1-\beta$:
>
> $$n = \frac{\left(z_{\alpha/2}\sqrt{2\bar{p}(1-\bar{p})} + z_{\beta}\sqrt{p_A(1-p_A) + p_B(1-p_B)}\right)^2}{(p_B - p_A)^2}$$
>
> where $\bar{p} = (p_A + p_B)/2$.
>
> **Simplified approximation** (when $p_B \approx p_A$):
>
> $$n \approx \frac{(z_{\alpha/2} + z_\beta)^2 \cdot 2p(1-p)}{(p_B - p_A)^2}$$
>
> This gives $n$ per group. Total users $= 2n$.

> **Intuition: Trip Planning**
>
> Power analysis is trip planning. "Do I have enough gas (users) to reach my destination (detect the effect)?"
>
> - $n$ = tank size
> - MDE = distance to destination
> - $\alpha$ = speed limit (strictness of the rules)
> - $1-\beta$ = probability of arriving (80% power = 80% chance of "getting there")
>
> **The $1/\sqrt{n}$ law.** Halving the MDE requires *quadrupling* the sample size. Standard errors shrink as $1/\sqrt{n}$, not $1/n$. Going from 1% MDE to 0.5% MDE means going from 10K to 40K users per group. This "law of diminishing returns" is the fundamental constraint of experimentation.

> **Application: Dashboard -- Power Calculator**
>
> The Power & Design tab has interactive sliders for baseline rate, MDE, $\alpha$, and power. The backend `required_sample_size(baseline_rate, mde, alpha, power)` uses `scipy.stats.norm.ppf(1 - alpha/2)` and `scipy.stats.norm.ppf(power)` to compute the formula above.
>
> **Worked example:** $p_A = 0.12$, MDE $= 0.01$, $\alpha = 0.05$, power $= 0.80$:
>
> $$z_\alpha = 1.96, \quad z_\beta = 0.84, \quad p_B = 0.13$$
>
> $$n = \frac{(1.96\sqrt{2 \cdot 0.125 \cdot 0.875} + 0.84\sqrt{0.12 \cdot 0.88 + 0.13 \cdot 0.87})^2}{(0.01)^2} \approx 14{,}752 \text{ per group}$$

### 5.2 Minimum Detectable Effect and Power Curves

> **Formal: MDE and Power Function**
>
> **MDE** at a given $n$: the smallest $\delta$ such that $n \geq n_{\mathrm{required}}(\delta)$. Found by binary search inverting the sample size formula.
>
> **Power as a function of effect size $\delta$:**
>
> $$\mathrm{Power}(\delta) = \Phi\!\left(\frac{|\delta|\sqrt{n}}{\sqrt{p_A(1-p_A) + p_B(1-p_B)}} - z_{\alpha/2}\right)$$
>
> Key properties: Power$(0) = \alpha$; power increases with $|\delta|$ and $n$; decreases with $\alpha$.

> **Intuition: The Sensitivity Curve**
>
> A power curve is a "sensitivity diagram": it shows how likely your experiment is to detect effects of various sizes. The curve always starts at $\alpha$ (at zero effect, "detection" is just a false positive) and rises toward 1. The MDE is the effect size where the curve crosses 0.80.
>
> **Why 80% and not 95%?** Going to 95% power roughly doubles sample size. Most product teams prefer speed, accepting that 1 in 5 real effects will be missed.

> **Application: Dashboard -- MDE Curve and Runtime**
>
> `minimum_detectable_effect(n, baseline_rate)` uses binary search. `power_curve(baseline_rate, n)` evaluates power at 25 predefined effect sizes using `scipy.stats.norm.cdf()`. The tab also estimates runtime:
>
> $$\text{Days} = \frac{n_{\mathrm{required}} - n_{\mathrm{current}}}{\text{daily\_traffic} / 2}$$
>
> Daily traffic is estimated as the mean daily observation count from the data.

> **Dashboard Connection**
>
> **Tab:** Power & Design.
>
> **Backend:** `routers/power.py` calls `required_sample_size()`, `minimum_detectable_effect()`, and `power_curve()`.
>
> **Scipy:** `scipy.stats.norm.ppf()`, `scipy.stats.norm.cdf()`.

---

## 6. Sequential Testing

### 6.1 Why Peeking Inflates Type I Error

> **Formal: The Peeking Problem**
>
> If you peek at data $k$ times during collection and stop the first time $|Z| > z_{\alpha/2}$, the actual Type I error rate under $H_0$ is:
>
> $$\alpha_{\mathrm{inflated}} \approx 1 - (1 - \alpha)^k$$
>
> For $k = 5$: $\alpha_{\mathrm{inflated}} \approx 1 - 0.95^5 = 0.226$ (22.6%, not 5%).
>
> **The mathematical core.** Under $H_0$, the cumulative z-statistic at information fraction $t$ follows approximately $Z(t) \approx W(t)/\sqrt{t}$ where $W(t)$ is a standard Brownian motion. Since Brownian motion is recurrent, it will *eventually* cross any finite boundary. Continuous peeking with fixed boundaries guarantees a false positive with probability 1.

> **Intuition: Lottery Tickets**
>
> Each time you check a running experiment, you buy a lottery ticket. Even though each ticket has only a 5% chance of "winning" (false positive), buying 10 tickets gives you a 40% chance. Sequential testing does not stop you from buying tickets; it makes each ticket progressively harder to win, so the total chance stays at 5%.
>
> **The drunk on a number line.** Under the null, your cumulative test statistic wanders like a drunk person. Given enough time, the drunk will wander arbitrarily far from the origin. Fixed boundaries ($\pm 1.96$) will *always* be crossed eventually. Sequential testing uses expanding boundaries to account for this inevitable wandering.

> **Application: Dashboard -- Daily P-Value Evolution**
>
> The Sequential tab shows how the p-value fluctuates over the 22-day experiment period. This visualization directly demonstrates the peeking problem: some days the p-value dips below 0.05, then bounces back. A naive analyst who stopped on those days would have declared a false winner.

### 6.2 O'Brien--Fleming Boundaries

> **Formal: Group Sequential Design**
>
> Divide the experiment into $K$ stages at information fractions $t_1 < \cdots < t_K = 1$. At each stage $k$, compare $|Z_k|$ to boundary $c_k$:
>
> - Stop and reject $H_0$ if $|Z_k| \geq c_k$
> - Continue if $|Z_k| < c_k$ for $k < K$
>
> Boundaries $\{c_k\}$ are chosen so the overall Type I error is exactly $\alpha$:
>
> $$P\!\left(\bigcup_{k=1}^{K}\{|Z_k| \geq c_k\} \;\middle|\; H_0\right) = \alpha$$
>
> **O'Brien--Fleming boundary:**
>
> $$c_k^{\mathrm{OBF}} = c \cdot \sqrt{K/k}$$
>
> where $c$ is calibrated for overall $\alpha$.
>
> | Stage $k$ | Info fraction | OBF boundary | Approx. $\alpha$ spent |
> |---|---|---|---|
> | 1 | 0.20 | 4.56 | 0.000005 |
> | 2 | 0.40 | 3.23 | 0.0013 |
> | 3 | 0.60 | 2.63 | 0.0085 |
> | 4 | 0.80 | 2.28 | 0.0228 |
> | 5 | 1.00 | 2.04 | 0.0417 |
>
> Key: very conservative early (overwhelming evidence required), final boundary (2.04) close to fixed-sample (1.96). Total sample size increase: only ~3% more.
>
> **Alpha spending function** (Lan--DeMets OBF-type):
>
> $$\alpha^*_{\mathrm{OBF}}(t) = 2 - 2\Phi\!\left(\frac{z_{\alpha/2}}{\sqrt{t}}\right)$$
>
> This does not require pre-specifying the number or timing of interim analyses.

> **Intuition: The Skeptical Judge**
>
> Early in a trial, the OBF boundary is extremely high, like a judge who says "extraordinary claims require extraordinary evidence." As more data accumulates, the judge relaxes. This is sensible because early results are noisy (small $n$), so we should demand stronger evidence.
>
> **Alpha spending as a budget.** You have \$0.05 of "significance dollars." The spending function decides how to spread the budget over time. OBF saves most for the end. You can never overspend; once the budget is exhausted, you stop.

> **Application: Dashboard -- Sequential Chart**
>
> The backend `obrien_fleming_bounds(n_looks, alpha)` uses `scipy.stats.norm.ppf(1 - alpha/2)` and computes $c_k = z_\alpha / \sqrt{k/K}$ for each day of the experiment. `cumulative_stats_by_day(df)` computes running z-statistics by calling `z_test_proportions()` on cumulative data each day.
>
> The Sequential tab overlays the z-statistic trajectory on the OBF boundaries, and highlights the **optimal stopping point**: the first day where $|z| \geq c_k$, if any.

> **Dashboard Connection**
>
> **Tab:** Sequential Monitoring.
>
> **Backend:** `routers/sequential.py` calls `cumulative_stats_by_day()` and `obrien_fleming_bounds()`.
>
> **Output:** cumulative stats, boundaries, daily p-values, and optimal stopping point.

---

## 7. Simpson's Paradox

> **Formal: When Aggregation Reverses the Truth**
>
> Let $X$ be treatment, $Y$ outcome, $Z$ a confounding variable. Simpson's Paradox occurs when:
>
> $$P(Y{=}1 \mid X{=}B, Z{=}z) > P(Y{=}1 \mid X{=}A, Z{=}z) \quad \forall\, z$$
>
> but
>
> $$P(Y{=}1 \mid X{=}B) < P(Y{=}1 \mid X{=}A)$$
>
> B beats A in every subgroup, but A beats B in aggregate.
>
> **How it happens.** The marginal rate is a weighted average:
>
> $$p_X = \sum_z w_{X,z} \cdot p_{X,z}, \quad w_{X,z} = P(Z{=}z \mid X)$$
>
> When the **weights** $w_{X,z}$ differ between treatments and correlate with the subgroup rates, aggregation distorts the comparison.
>
> **Numerical example:**
>
> | | Subgroup 1 (easy) | Subgroup 2 (hard) | Aggregate |
> |---|---|---|---|
> | Treatment A | 81/87 = 93.1% | 192/263 = 73.0% | 273/350 = 78.0% |
> | Treatment B | 234/270 = 86.7% | 55/80 = 68.8% | 289/350 = 82.6% |
>
> A is better in *both* subgroups, but B wins in aggregate because 77% of B's sample is in the easy subgroup, while only 25% of A's is.

> **Intuition: The Berkeley Admissions Paradox**
>
> In 1973, UC Berkeley's aggregate admission rates showed apparent gender bias: 44% of men admitted vs. 35% of women. But department-by-department, women were admitted at equal or higher rates. The explanation: women disproportionately applied to competitive departments with low admission rates.
>
> The "paradox" vanishes once you realize that aggregation ignores a lurking variable (department competitiveness) whose distribution differs across groups. **Simpson's Paradox is really about weighted averages with different weights.**

> **Application: Dashboard -- Simpson's Paradox Detection**
>
> The Segments tab includes a Simpson's Paradox callout. The backend helper `_simpsons_paradox(df)` in `routers/segments.py` computes:
> 1. The aggregate treatment effect direction
> 2. Per-segment effect directions (by `user_segment`)
> 3. Paradox flag: True if the aggregate direction differs from *all* segment directions
>
> In the enriched dataset, the treatment works differently for new vs. returning users (by design): the treatment helps new users but slightly hurts returning users. This creates a Simpson's Paradox opportunity when the segment proportions are imbalanced.
>
> **Causal interpretation** (Pearl): condition on $Z$ if it is a confounder; do NOT condition if it is a mediator or collider. In the dashboard, device type and user segment are confounders (they exist before treatment assignment).

> **Dashboard Connection**
>
> **Tab:** Segments (Simpson's Paradox callout section).
>
> **Backend:** `routers/segments.py`, helper `_simpsons_paradox(df)`.
>
> **Also:** `_segment_effects(df, dimension)` runs z-tests per segment across 5 dimensions.

---

## 8. Multiple Testing Corrections

> **Formal: Controlling Error Rates Across Multiple Tests**
>
> When testing $m$ hypotheses at level $\alpha$, the probability of at least one false positive under the global null is:
>
> $$P(\text{at least one false positive}) = 1 - (1-\alpha)^m$$
>
> For $m = 20$: $P = 1 - 0.95^{20} = 0.642$.
>
> **Family-Wise Error Rate (FWER):** $P(\text{at least one false positive}) \leq \alpha$.
>
> **False Discovery Rate (FDR):** $E\!\left[\frac{\text{false positives}}{\text{total rejections}}\right] \leq q$.
>
> **Bonferroni:** Reject $H_i$ if $p_i < \alpha/m$. Proof via union bound:
>
> $$P\!\left(\bigcup_{i \in \mathcal{H}_0}\{p_i < \alpha/m\}\right) \leq \sum_{i \in \mathcal{H}_0} \frac{\alpha}{m} \leq \alpha$$
>
> Very conservative: with $m=100$, each test uses $\alpha/100 = 0.0005$.
>
> **Holm (step-down, FWER):** Order p-values $p_{(1)} \leq \cdots \leq p_{(m)}$. For $k = 1, \ldots, m$: if $p_{(k)} < \alpha/(m-k+1)$, reject and continue; else stop. Strictly more powerful than Bonferroni because after each rejection, fewer hypotheses remain.
>
> **Benjamini--Hochberg (FDR):** Find the largest $k$ such that $p_{(k)} \leq (k/m) \cdot q$. Reject $H_{(1)}, \ldots, H_{(k)}$. Controls FDR at level $q$ under independence.
>
> | Method | Controls | Threshold | Conservatism |
> |---|---|---|---|
> | Bonferroni | FWER | $\alpha/m$ | Very high |
> | Holm | FWER | Step-down from $\alpha/m$ | Moderate |
> | BH | FDR | $(k/m) \cdot q$ | Lowest (different metric) |

> **Intuition: Three Inspectors**
>
> **Bonferroni** (paranoid): checking 20 products, uses 0.25% error per product to keep total risk at 5%. Safe but misses real defects.
>
> **Holm** (sequential): starts with the most suspicious item. After flagging it, relaxes the threshold slightly, since fewer suspects remain. Strictly better than Bonferroni.
>
> **BH-FDR** (pragmatic): "I accept that among my discoveries, up to 5% might be false. I will verify the important ones later." The right mindset for exploratory segment analysis.

> **Application: Dashboard -- Segment Analysis Context**
>
> The Segments tab runs z-tests across 5 dimensions (device, browser, country, user segment, traffic source), each with multiple levels. This produces many simultaneous tests.
>
> **Practical recommendation for the dashboard:**
> 1. **Primary metric** (conversion rate on the Overview tab): tested without correction. This is the experiment's official success criterion.
> 2. **Secondary metrics** (revenue, session duration on the Frequentist tab): corrected with Holm.
> 3. **Segment breakdowns** (Segments tab): corrected with BH-FDR, since these are exploratory.
> 4. **Guardrail metrics** (if any): separate FWER correction.
>
> **Worked example** (5 metrics tested simultaneously):
>
> | Metric | Raw $p$ | Bonferroni | Holm | BH |
> |---|---|---|---|---|
> | Add-to-cart | 0.003 | 0.015 | 0.015 | 0.015 |
> | Revenue/visitor | 0.018 | 0.090 | 0.072 | 0.045 |
> | Bounce rate | 0.032 | 0.160 | 0.096 | 0.053 |
> | Time on page | 0.085 | 0.425 | 0.170 | 0.106 |
> | Scroll depth | 0.220 | 1.000 | 0.220 | 0.220 |
>
> All methods agree: add-to-cart is significant. BH additionally flags revenue. The choice of method determines how aggressive your discovery threshold is.

---

## 9. Cross-Topic Connections

Understanding how these concepts link together is crucial for mastering A/B testing as a system, not just a collection of techniques.

1. **Power analysis (Sec. 5) depends on effect size (Sec. 2.4):** The sample size formula uses the expected $\delta = p_B - p_A$, which can be expressed via Cohen's $h$. Smaller $h$ means more users needed.

2. **Sequential testing (Sec. 6) modifies power analysis:** OBF designs require ~3% more users than fixed-sample designs. Factor this into runtime estimation.

3. **SRM detection (Sec. 1) uses the same chi-squared test as the analysis (Sec. 2.2):** Both compare observed vs. expected frequencies. SRM is a "meta-test" that validates the infrastructure before you trust the treatment effect test.

4. **Simpson's Paradox (Sec. 7) motivates segmented analysis, which triggers multiple testing (Sec. 8):** When you segment results to check for the paradox, you run many tests. Apply BH-FDR to segment-level comparisons.

5. **Bayesian expected loss (Sec. 3.3) provides a natural alternative to multiple testing correction:** The loss function inherently penalizes overconfident conclusions, reducing (but not eliminating) the multiple comparisons problem.

6. **Frequentist CIs (Sec. 2) converge to Bayesian credible intervals (Sec. 3) with flat priors:** The Bernstein--von Mises theorem (Sec. 4) guarantees this for large $n$. For small $n$, informative priors can be substantially more accurate.

7. **Sequential testing and Bayesian stopping rules:** Both address peeking. Frequentist sequential testing controls Type I error via alpha spending. Bayesian stopping controls expected loss. The Bayesian approach is simpler but lacks the Type I error guarantee.

---

## 10. Summary Table

| Concept | Core Formula | Dashboard Tab | Backend Function |
|---|---|---|---|
| Z-test (proportions) | $Z = (\hat{p}_B - \hat{p}_A) / \mathrm{SE}_{\mathrm{pool}}$ | Frequentist | `z_test_proportions` |
| Chi-squared | $\chi^2 = \sum (O-E)^2/E$ | Frequentist | `chi_squared_test` |
| Wilson CI | $\tilde{p} \pm z \cdot [\ldots] / (1+z^2/n)$ | Frequentist | `wilson_confidence_interval` |
| Cohen's $h$ | $2\arcsin(\sqrt{p_B}) - 2\arcsin(\sqrt{p_A})$ | Frequentist | `cohens_h` |
| Beta posterior | $\mathrm{Beta}(\alpha+X, \beta+n-X)$ | Bayesian | `beta_posterior` |
| $P(B>A)$ | $\frac{1}{S}\sum \mathbf{1}[p_B^{(s)} > p_A^{(s)}]$ | Bayesian | `probability_b_beats_a` |
| Expected loss | $\frac{1}{S}\sum \max(p_A^{(s)}-p_B^{(s)}, 0)$ | Bayesian | `expected_loss` |
| Sample size | $n = [(z_{\alpha/2}\sqrt{\ldots}+z_\beta\sqrt{\ldots})/\delta]^2$ | Power | `required_sample_size` |
| MDE | Binary search on sample size | Power | `minimum_detectable_effect` |
| OBF boundary | $c_k = c\sqrt{K/k}$ | Sequential | `obrien_fleming_bounds` |
| SRM test | $\chi^2 = \sum(O_i-E_i)^2/E_i$ | Overview | `sample_ratio_mismatch_test` |

---

## 11. Key Formulas Quick Reference

$$\text{Pooled proportion:} \quad \hat{p} = \frac{X_A + X_B}{n_A + n_B}$$

$$\text{Z-statistic:} \quad Z = \frac{\hat{p}_B - \hat{p}_A}{\sqrt{\hat{p}(1-\hat{p})(1/n_A + 1/n_B)}}$$

$$\text{Wilson CI center:} \quad \tilde{p} = \frac{\hat{p} + z^2/(2n)}{1 + z^2/n}$$

$$\text{Cohen's } h: \quad h = 2\arcsin\!\left(\sqrt{p_B}\right) - 2\arcsin\!\left(\sqrt{p_A}\right)$$

$$\text{Beta posterior:} \quad \mathrm{Beta}(\alpha + X, \;\beta + n - X)$$

$$P(B > A): \quad \frac{1}{S}\sum_{s=1}^S \mathbf{1}\!\left[p_B^{(s)} > p_A^{(s)}\right]$$

$$\text{Expected loss:} \quad \frac{1}{S}\sum_{s=1}^S \max\!\left(p_A^{(s)} - p_B^{(s)}, 0\right)$$

$$\text{Sample size:} \quad n = \frac{(z_{\alpha/2} + z_\beta)^2 \cdot [p_A(1{-}p_A) + p_B(1{-}p_B)]}{(p_B - p_A)^2}$$

$$\text{Runtime:} \quad \text{Days} = \frac{2n}{T \cdot f}$$

$$\text{OBF boundary:} \quad c_k = c \cdot \sqrt{K/k}$$

$$\text{OBF spending:} \quad \alpha^*(t) = 2 - 2\Phi\!\left(\frac{z_{\alpha/2}}{\sqrt{t}}\right)$$

$$\text{Bonferroni:} \quad \text{Reject if } p_i < \alpha / m$$
