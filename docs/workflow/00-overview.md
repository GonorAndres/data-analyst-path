---
tags: [workflow, overview]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# The Analyst Workflow: End-to-End

From "stakeholder asks a question" to "delivering insights that drive decisions."

## The 6 Phases

```
[1. Requirements]  -->  [2. Data Discovery]  -->  [3. Analysis]
       |                       |                       |
   Stakeholder             Explore &               Clean, analyze,
   alignment               assess data              test hypotheses
       |                       |                       |
[4. Visualization] -->  [5. Storytelling]  -->  [6. Follow-Up]
       |                       |                       |
   Build charts &          Present findings        Measure impact,
   dashboards              to stakeholders         iterate
```

## Phase Details

| Phase | Key Activity | Output | Common Pitfall |
|-------|-------------|--------|----------------|
| [[01-requirements-gathering]] | Clarify the business question, success criteria, audience | Requirements brief | Jumping to data before understanding the question |
| [[02-data-discovery]] | Find, assess, profile available data sources | Data assessment memo | Assuming data is clean and complete |
| [[03-analysis-execution]] | Clean, transform, analyze, test hypotheses | Working notebooks/scripts | Over-engineering the analysis |
| [[04-visualization-design]] | Design charts, dashboards, report layouts | Draft visualizations | Cluttered charts with no clear message |
| [[05-storytelling-presentation]] | Frame findings as narrative, present to stakeholders | Slide deck / report / dashboard | Leading with methodology instead of the answer |
| [[06-follow-up-iteration]] | Validate recommendations, measure outcomes, iterate | Impact tracking | Declaring victory without measuring results |

## Guiding Principles

1. **Start with the decision.** Every analysis exists to support a decision. If you can't name the decision, stop and clarify.
2. **Data quality is your responsibility.** Never present findings without understanding data limitations.
3. **Simple beats clever.** A clear bar chart with an annotation beats a complex interactive visualization nobody reads.
4. **Quantify everything.** "Revenue increased" is weak. "Revenue increased 12% ($340K) QoQ" is strong.
5. **Recommendations are mandatory.** Analysis without recommendations is just description.
