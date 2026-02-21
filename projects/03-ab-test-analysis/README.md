# A/B Test Analysis

> **Analyst Flavor:** Product/Growth | **Tools:** R, Python, Jupyter | **Status:** Planned

## Business Question

Did a website redesign (or pricing change / feature launch) significantly improve the target conversion metric, and can we confidently recommend rolling it out to all users -- accounting for statistical significance, practical significance, and potential segment-level effects?

## Planned Scope

### Data
- Simulated or public A/B test dataset (control vs treatment groups)
- Metrics: conversion rate, average order value, session duration
- Segments: device type, user cohort, geography

### Analysis
1. **R Layer**: Hypothesis testing (t-tests, chi-squared, proportion tests), power analysis, confidence intervals, Bayesian A/B comparison
2. **Python Layer**: Data preparation, segment-level analysis, visualization
3. **Report**: Statistical write-up explaining results for non-technical stakeholders

### Deliverables
- [ ] R Markdown / Quarto report (statistical analysis with inline results)
- [ ] Jupyter notebook (Python companion with visualizations)
- [ ] Executive summary: "Should we ship this?" recommendation memo
- [ ] Power analysis calculator (reusable R function)

### Skills Demonstrated
- Experimental design and statistical testing rigor
- R for statistical computing (tidyverse, broom, ggplot2)
- Translating p-values and confidence intervals into business recommendations
- Segment-level heterogeneity analysis (Simpson's paradox awareness)
