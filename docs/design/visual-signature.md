# Visual signature audit

This is an audit of generic interface conventions in the current portfolio, not a claim about how the site was authored. The live home screenshot is clear and credible, but its personality is quieter than its analytical content.

## Baseline: what felt interchangeable before refinement

- **One accent is doing almost every job.** `--accent: #315e7d` colors the logo dot, links, CTA, chart marks, large statistics, active navigation, and evidence labels. In the screenshot this collapses the hierarchy into cream plus blue; the chart, action, and brand all speak with the same voice.
- **Hairline rules become the main motif.** `border-top` and `border-bottom` repeat across the header, hero, study rows, case intro, reading sections, figures, captions, and footer. They organize well, but the long, evenly spaced rules make every section feel like the same editorial template.
- **Rounded neutral containers resemble default component-library UI.** `.ui-button`, `.project-menu-panel`, `.case-card`, `.glass-card`, `.chart-state`, and `.service-status` repeat pale surfaces, 1px borders, and 5–10px radii. The three header controls in the screenshot are the clearest instance: outlined boxes whose fill is nearly indistinguishable from the page.
- **The composition uses a familiar portfolio formula.** A centered max-width shell, tiny uppercase eyebrow, oversized sans-serif headline, two-column feature, Lucide arrow, and small boxed controls are each sound; used together without a stronger house device, they are visually generic.
- **Micro-labels are over-standardized.** `.eyebrow`, `.figure-index`, `.brand-caption`, evidence labels, and case numbers repeatedly use small uppercase/letter-spaced text. This reduces contrast between brand, metadata, navigation, and figure annotation.
- **Left rules feel incidental rather than owned.** `.brand-caption` uses a thin left divider and `.exploration-note` uses a blue left border. Neither relates to the horizontal-rule system, and the latter resembles a conventional callout component.
- **Figures inherit the same surface treatment as interface chrome.** `.study-row-figure` and evidence figures use the same cream/surface/blue vocabulary as menus and controls. `AnalysisFigure.module.css` adds another top rule and caption rule, so data evidence is framed like another content section instead of becoming the distinctive visual anchor.

## Small-change direction

Use color roles, not more color everywhere:

| Role | Suggested color | Use |
| --- | --- | --- |
| Cream | `#EDE6DD` | Page field; preserve the existing warmth |
| Navy | `#20364A` | Ink, structure, active navigation, primary data series |
| Terracotta | `#9E4F35` | Solid primary actions, brand punctuation, one key finding |
| Muted sage | `#71806A` | Secondary data/evidence states; avoid small cream text on it |
| Ochre | `#B67B28` | Warning, estimate, benchmark, or one tertiary series |
| Pale surface | `#F6F0E8` | Menus and figure grounds only when separation is necessary |

Keep existing semantic reds/greens for status and validate contrast when remapping tokens. Terracotta should not replace every current blue occurrence; navy should carry structure, while terracotta marks the next action or editorial emphasis.

Establish one compact angular signature:

- Give primary actions a solid terracotta fill with cream text and a 0–2px radius or a single clipped corner. Keep secondary actions as unboxed `.text-link` treatments.
- Make header utilities quieter: transparent, square controls with hover fill; reserve a filled shape for the project menu only if it is the dominant action.
- Apply the same clipped corner to two or three high-value surfaces only—such as `.study-row-figure`, `.project-menu-panel`, and the primary action. Do not chamfer every input or chart cell.
- Replace `.brand-caption`'s left border with spacing or a small terracotta angular mark. Replace `.exploration-note`'s left rule with a low-contrast sage/ochre field plus a short top marker or corner notch.
- Let evidence figures own the richer palette: navy observed values, ochre estimated values, sage comparison/cohort states, and terracotta only for the decisive annotation. Keep axes and captions neutral.
- Reduce full-width rules where spacing already separates content. Retain rules at major publication boundaries, but avoid stacking a figure top rule, caption top rule, and parent section rule in one view.

## Keep / avoid

**Keep:** the cream field, restrained editorial spacing, strong typographic scale, legible prose widths, tabular numerals, direct case-study hierarchy, and accessible focus/44px controls.

**Avoid:** blue as the universal signal, left-border callouts, pale outlined buttons on a nearly identical pale background, repeated rounded cards, decorative gradients, excessive shadows, colorful body copy, and applying the angular device to every element.

The target is not a redesign: token reassignment, flatter utility controls, one angular corner rule, fewer redundant dividers, and a clearer solid-action hierarchy are enough to create a recognizable system without restructuring content.

## Implemented signature

The refinement uses cream `#EDE6DD`, navy `#1B2A4A`, terracotta `#A04D32`, sage `#4F6A55`, and ochre `#D8AD63`. Dark mode has its own contrasting action and navigation fills. Existing quantitative chart scales retain their meanings.

Square corners were chosen instead of clipping interactive elements, preserving visible keyboard focus. Primary actions use terracotta with a separate navy arrow compartment; the header has solid, distinct utility controls as requested. Case numbers rotate through the three secondary brand colors. The initials sit in a navy square with a small three-color signature beside them.

The brand divider and exploration callout's left border are removed. The callout uses a sage surface, while redundant figure and caption rules give way to a solid figure-number tab. Secondary navigation is unboxed until selected, when it becomes a solid block. Geometry, typography, data, and content order remain intact.
