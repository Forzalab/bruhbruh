# Design Spec A: Logic mode (Swiss layout x NYCTA type)

Method: I turned the refs into a structured UI spec (grid, then type, then color, then components). I measured on ref1 (1456x816) and scaled to the 1440x810 viewport.

## Grid (measured on ref1)
- 3 columns: margin 46px (3.2%) | main 1fr | side 30% (x=1022/1456 = 0.70).
- 3 rows: 01 = 40.5% of height (328/816) | 02 = 1fr | 03 = 68px.
- 1px hairline rules in #1a1a1a. A double rule on the margin edge of row 01, as in ref1.
- Row numerals 01/02/03: mono 12px/500, inset 14px.

## Type
- Wordmark "Logic": Inter Tight 800, min(27vw, 400px), tracking -0.05em. The baseline sits about 24px above the 01/02 rule. The g descender crosses into row 02 (z-index above the canvas, pointer-events none).
- Labels (SHOW GRID, TRUTH TABLE, LOGIC CIRCUIT EDITOR): JetBrains Mono 500-700, 13px, uppercase, tracking 0.12em.
- Node tags (A, B, OUT, AND): Inter Tight 800, 15-17px (the heavy bold grotesk from ref2).
- Truth-table digits: JetBrains Mono 500 18px, tabular-nums, white on #000.
- Fonts are self-hosted with @fontsource, so they load offline.

## Color (sampled)
- Paper #ffffff, ink #000000, rule #1a1a1a, mute #6b6b6b.
- Accent #ff5a1f is used only for logic-1 wires, the OUT lamp fill, the live truth-table row and the switch core when on.
- Contrast: #000 on #fff and #fff on #000 are both 21:1. #000 on #ff5a1f is about 7.4:1.

## Components
- Gates: IEEE distinctive-shape AND, 2.5px black stroke, white fill, label inside the shape.
- Wires: step routing. Logic 0 is 2.5px black, logic 1 is 3px orange. Handles are 8px black dots.
- Switch: 44px outlined square with an inner square. The inner square turns orange when on.
- Lamp: 44px circle with a 2.5px stroke. It fills orange when on.
- Motion: none. prefers-reduced-motion turns off all transitions and animations.

## Sources
- Müller-Brockmann, Grid Systems in Graphic Design (Niggli): https://niggli.ch/en/products/rastersysteme-fur-die-visuelle-gestaltung
- NYCTA Graphics Standards Manual 1970 (Vignelli/Noorda, Unimark): https://standardsmanual.com/products/nycta-graphics-standards-manual-full-size-edition, https://archive.org/details/nycta-gs-manual, https://www.moma.org/collection/works/89303
- IBM Carbon: https://carbondesignsystem.com/elements/2x-grid/overview/, https://carbondesignsystem.com/elements/typography/overview/
- Material 3 layout: https://m3.material.io/foundations/layout/understanding-layout/overview
- Apple HIG typography: https://developer.apple.com/design/human-interface-guidelines/typography
- WCAG 2.2 contrast (1.4.3 and 1.4.11): https://www.w3.org/TR/WCAG22/#contrast-minimum
- Screenshot-to-spec through visual prompting (Draw-and-Understand, ICLR 2025): https://proceedings.iclr.cc/paper_files/paper/2025/hash/727658ad24ba28e02dffd379bdc69448-Abstract-Conference.html
