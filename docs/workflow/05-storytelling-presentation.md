---
tags: [workflow, storytelling, presentation, stakeholder]
status: draft
created: 2026-02-21
updated: 2026-02-21
---

# Phase 5: Storytelling and Presentation

## Goal

Frame analytical findings as a narrative that drives decisions. The analysis is done -- now communicate it so people actually act on it.

## The Core Principle

Data analysts are judged on how well they **communicate** findings, not just how they compute them. Your output format IS the deliverable.

## Storytelling Structure

Every presentation (slides, report, dashboard walkthrough) should follow this arc:

```
1. CONTEXT    -- "Here's the situation and why we looked into this"
2. CONFLICT   -- "Here's the problem or opportunity we found"
3. RESOLUTION -- "Here's what the data says and what we should do"
```

## The "So What?" Test

After every finding, ask: "So what should we do about this?"

| Weak | Strong |
|------|--------|
| "Churn rate is 15%" | "Churn rate is 15%, 3x higher in the 30-60 day cohort. Targeting this window with a retention email could save $240K annually." |
| "Region A has lower revenue" | "Region A underperforms by 22%. However, it has the highest growth rate (18% QoQ), suggesting it's an emerging market worth investing in." |
| "Average order value is $47" | "AOV dropped 12% since the promotion started. The promotion is driving volume but at lower margins -- net revenue impact is negative $30K." |

## Presentation Formats

### Slide Deck (Executive Audience)
- **1 idea per slide** rule
- Lead with the insight, not the methodology
- Executive summary slide at the beginning with the bottom line
- Max 10-12 slides for a 30-minute meeting
- Appendix slides for methodology (they'll ask if they want details)

### Written Report (Formal Deliverable)
- Start with executive summary (half a page)
- Use headers as insight statements: "Customer retention drops sharply after day 30" not "Retention Analysis"
- Charts inline with narrative, not in a separate appendix
- End with numbered recommendations and next steps

### Dashboard Walkthrough (Ongoing Monitoring)
- Record a 2-3 minute video walking through the dashboard
- Include a "How to Read This Dashboard" text box
- Add bookmarks in Power BI for pre-set views (e.g., "Worst performing regions", "Last 30 days")

## Audience Adaptation

| Audience | Adjust For |
|----------|-----------|
| **C-Suite / Executives** | Bottom line first. No jargon. Quantify impact in dollars. 3-5 minutes max. |
| **Managers** | Actionable recommendations. Show trends and comparisons. 10-15 minutes. |
| **Analyst peers** | Show your work. Code quality matters. Reproducibility is expected. |
| **Non-technical stakeholders** | Heavy on visuals, light on numbers. Analogies and plain language. |

## Portfolio-Specific Advice

In portfolio projects, you don't have a real stakeholder. Simulate one:
- State who the imaginary audience is in the README ("This report was prepared for the VP of Marketing...")
- Frame recommendations as if they'll be acted on
- Include an executive summary even if nobody asked for one
- This shows hiring managers you understand the communication layer of the DA role
