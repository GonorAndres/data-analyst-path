---
tags: [tools, r, statistics, hypothesis-testing]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# R Statistical Patterns for Data Analysts

Reference card for statistical analysis in R. Focused on applied statistics that DAs need: hypothesis testing, confidence intervals, descriptive stats. Not ML or complex modeling.

## When to Use R (vs Python)

- A/B test analysis (prop.test, t.test, power.t.test are unbeatable)
- Publication-quality statistical tables (broom + knitr)
- Anything where you need proper statistical inference with clear output
- When the audience expects academic-grade rigor

## A/B Test Analysis Template

```r
library(tidyverse)
library(broom)

# Load data
ab_data <- read_csv("data/processed/ab_test.csv")

# Proportions test (conversion rate comparison)
control <- ab_data |> filter(group == "control")
treatment <- ab_data |> filter(group == "treatment")

prop_test <- prop.test(
  x = c(sum(treatment$converted), sum(control$converted)),
  n = c(nrow(treatment), nrow(control)),
  alternative = "greater",
  conf.level = 0.95
)

# Tidy output
tidy(prop_test) |>
  mutate(across(where(is.numeric), ~round(., 4)))
```

## Power Analysis

```r
library(pwr)

# Before running an A/B test: how many observations do we need?
power_result <- pwr.2p.test(
  h = ES.h(p1 = 0.12, p2 = 0.10),  # Expected effect: 12% vs 10%
  sig.level = 0.05,
  power = 0.80,
  alternative = "greater"
)
# power_result$n gives the required sample size per group
cat(sprintf("Required sample per group: %d\n", ceiling(power_result$n)))
```

## Confidence Intervals

```r
# Mean with CI
ci_result <- t.test(data$metric, conf.level = 0.95)
cat(sprintf(
  "Mean: %.2f (95%% CI: %.2f to %.2f)\n",
  ci_result$estimate,
  ci_result$conf.int[1],
  ci_result$conf.int[2]
))

# Proportion with CI
prop_ci <- prop.test(successes, total, conf.level = 0.95)
```

## Descriptive Statistics Summary

```r
library(tidyverse)

# Comprehensive summary by group
summary_table <- data |>
  group_by(segment) |>
  summarise(
    n = n(),
    mean = mean(value, na.rm = TRUE),
    median = median(value, na.rm = TRUE),
    sd = sd(value, na.rm = TRUE),
    p25 = quantile(value, 0.25, na.rm = TRUE),
    p75 = quantile(value, 0.75, na.rm = TRUE),
    p95 = quantile(value, 0.95, na.rm = TRUE)
  ) |>
  mutate(across(where(is.numeric), ~round(., 2)))
```

## Hypothesis Testing Decision Tree

```
Is the data categorical or continuous?
|
├── Categorical (proportions)
|   ├── 2 groups → prop.test() or chisq.test()
|   └── 3+ groups → chisq.test()
|
└── Continuous (means)
    ├── 2 groups
    |   ├── Paired → t.test(paired = TRUE)
    |   └── Independent → t.test() or wilcox.test() if non-normal
    └── 3+ groups → aov() (ANOVA) or kruskal.test() if non-normal
```

## ggplot2 for Statistical Visualization

```r
# CI plot for A/B test results
results_df |>
  ggplot(aes(x = group, y = conversion_rate)) +
  geom_point(size = 3) +
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.1) +
  geom_hline(yintercept = baseline, linetype = "dashed", color = "grey50") +
  labs(
    title = "Treatment group shows +2pp lift in conversion",
    subtitle = "95% confidence intervals shown. Dashed line = current baseline.",
    x = NULL, y = "Conversion Rate"
  ) +
  scale_y_continuous(labels = scales::percent_format()) +
  theme_minimal()
```

## Connecting R Output to the Portfolio

- Use **Quarto** (.qmd) or **R Markdown** (.Rmd) for reproducible reports
- Export key tables as CSV for Power BI ingestion
- Save ggplot2 charts as PNG (300 dpi) for README screenshots
- Include both the .Rmd source and rendered HTML/PDF in `reports/`
