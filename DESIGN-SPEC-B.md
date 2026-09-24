# Design Spec B — "Logic" mode (Swiss layout x NYCTA type)

Method: refs were described as a measured spec (grid lines, px, weights, hex) before coding, in the
spirit of screenshot-to-code evaluation (Design2Code, Si et al. 2024, https://arxiv.org/abs/2403.03163),
which scores layout/text/position/color fidelity block-by-block. Measurements taken on the 1456x816 refs,
scaled to the 1440x810 target.

## Grid (Ref 1, Müller-Brockmann modular grid)
- Columns: rail 72px | main 1fr (~66%) | side 420px (Ref 1 side col = 434/1456 = 29.8%).
- Rows: head 300px (Ref 1: 328/816 = 40%) | canvas 1fr | foot 56px (Ref 1: 70/816).
- Rules: 1px #111 hairlines on every cell edge; outer frame 1px.
- Wordmark "Logic": 360px, weight 800, tracking -0.055em, line-height .78; baseline sits on the
  row-01 rule so the "g" descender crosses into the canvas row (Ref 1). pointer-events: none.
## Type (Ref 2, NYCTA / Helvetica lineage)
- Family: Inter Tight (self-hosted @fontsource) -> Helvetica Neue -> Arial.
- Labels: 700-800, uppercase, tracking .02-.04em. Cell labels 15px/800; table 22px/800 numerals;
  gate labels 14px/800 white on black.
## Color (sampled)
- Paper #f1ece1, ink #111111, hairline #111 at 1px, muted #6b665c (6.0:1 on paper, WCAG AA).
- Accent #ff5a1f ONLY: lamp ON fill + live truth-table row. Black on #ff5a1f = 7.3:1.
## Components
- Gate: black pill 96x56, radius 28; handles 10px black dots with 2px paper ring on the pill edge.
- Switch: 40px square, 3px ink border, inner 18px square (paper=0, ink=1). Letter label above (A/B).
- Lamp: 44px disk, 3px ink border; ON = #ff5a1f fill.
- Wires: step, logic-0 2px ink, logic-1 5px ink (weight, not color, carries state).
- Rail: 72px black; 48px white round chips AND/OR/XOR/NOT, 11px/800.
- Top-right: black cell, 112px white disk with black arrow (stroke 10), "CIRCUIT / EDITOR" 34px/800 white.
- Motion: none; prefers-reduced-motion kills transitions.

## Citations
- Müller-Brockmann, Grid Systems in Graphic Design (1981) — modular fields, hairline rules.
- NYCTA Graphics Standards Manual 1970: https://archive.org/details/nycta-gs-manual ,
  https://www.moma.org/collection/works/89303 , https://standardsmanual.com/products/nyctacompactedition
- IBM Carbon 2x grid & type: https://carbondesignsystem.com/elements/2x-grid/overview/ , https://carbondesignsystem.com/elements/typography/overview/
- Material 3 layout: https://m3.material.io/foundations/layout/understanding-layout/overview
- Apple HIG layout: https://developer.apple.com/design/human-interface-guidelines/layout
- WCAG 2.2 1.4.3 / 1.4.11: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html , https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html

## Fix pass 2, each change cited
1. Wordmark baseline raised 45px (top = head - 330px); g descender crosses the row line by ~48px. Backing: Ref 1 region y≈327–375.
2. Wordmark left edge at x≈48, flush with the numeral-strip rule. Backing: Ref 1 L stem at x≈46.
3. "TRUTH TABLE" is 28px/800 and the header row 22px/800. Backing: Ref 2 region x≈1120–1440.
4. CTA cell quieted to paper with an ink-ringed white arrow disk and ink label; the black rail stays as the single heavy mass. Backing: rubric 9 and GOV.UK's one primary action (https://design-system.service.gov.uk/components/button/); Ref 2 disk and label kept.
5. 1-wires 3.5px vs 0-wires 2px. Backing: rubric; assigned weight-not-hue signalling.
