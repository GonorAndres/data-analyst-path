# Illustrated case introductions

## Current artwork: project-specific scenes (v2)

Eight replacement paintings now depict the work itself: insurance claim review, repeat-purchase histories, marketplace fulfillment, checkout comparisons, subscription reporting, investment analysis, city service requests, and apartment listing comparisons. Generated with the Codex built-in image tool (GPT Image 2). No copy or layout changes accompany this revision, and no visible disclaimers were added.

Originals are in `docs/design/artwork/{insurance,ecommerce,olist,abtest,kpi,portfolio,operations,airbnb}-v2.png`. Responsive site files are in `apps/web/public/images/cases/{name}-v2-{640,1200}.webp`. Complete prompts: [case-illustration-prompts-v2.json](case-illustration-prompts-v2.json). Earlier artwork is retained. The Olist and retention routes now use separate illustrations.

## Earlier artwork (v1)

Seven original paintings generated with Codex's built-in image tool (GPT Image 2). No Gemini or separately keyed image API is used. The art direction combines colorful gouache/acrylic brushwork, recognizable subjects, and abstract color fields. Images are metaphors rather than measured evidence. Visible illustration disclaimers were removed at the user's request; provenance remains documented here.

## Assets and prompts

- Original paintings: `docs/design/artwork/{insurance,ecommerce,abtest,kpi,portfolio,operations,airbnb}.png`.
- Website assets: `apps/web/public/images/cases/{name}-{640,1200}.webp`.
- Complete generation prompts: [case-illustration-prompts.json](case-illustration-prompts.json).
- Composition is unedited; Sharp only resizes and encodes responsive WebP assets.

## Placement

`CaseWelcome` adds an introductory section above the existing case header, inside the story's main landmark. The original H1, narrative, figures, sources, and view navigation are retained. Each introduction has a descriptive H2, plain-language English/Spanish copy, localized image alt text, and a link to the original analysis header. No text is baked into the artwork.

The two Olist routes share the commerce painting but have different introductory questions. Exploration, methods, and deep links retain their existing layout without the large introduction. Print excludes the conceptual artwork section. Images reserve their aspect ratio and use responsive sources without a runtime image service.

The new copy does not claim causal findings or proven improvements. KPI identifies the fictional company, the A/B introduction identifies a practice dataset, investment scenarios are not promises, and listing supply is not assumed to mean bookings.
