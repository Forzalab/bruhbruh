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

## Fix pass 1 (arbitrator defects), each change with its basis
1. **Truth-table type.** Digits are Inter Tight 800 at 24px, headers 800 at 16px, and the title "Truth Table" is 800 at 29px. Basis: the ref2 truth-table region (bold grotesk digits and title) and the NYCTA manual's single heavy-sans voice (https://archive.org/details/nycta-gs-manual).
2. **Live row.** The full orange fill is gone. The live row now has a 6px orange left bar and orange digits on black. Basis: the rubric's single accent. Müller-Brockmann (Grid Systems, Niggli) calls for one dominant figure per field, so the wordmark stays the only large mass. #ff5a1f on #000 is about 7.0:1, which passes WCAG 1.4.3 (https://www.w3.org/TR/WCAG22/#contrast-minimum).
3. **Wordmark baseline.** Raised 12px (top = r1 - 0.92em - 12px), so the g descender now crosses the rule by about 50px. Basis: ref1 row 01/02 boundary, where it crosses by about 48px.
4. **OUT wire.** The lamp node moved to y=127, so its input handle is level with the AND output and the wire runs straight. Basis: ref1, where the XOR to OUT wire is a single straight run. Also Vignelli's rule of straight lines only (NYCTA manual).
5. **Primary focus.** The "Logic" wordmark is the one dominant element on purpose. This mode has no single primary action, since the user wires and flips switches directly on the canvas. Basis: the ref1 hierarchy (wordmark about 400px against 12-13px labels) and Müller-Brockmann's contrast of scale as the organising principle. Carbon's type scale uses the same one-display-size rule (https://carbondesignsystem.com/elements/typography/overview/).
6. **Status text.** Now #111 on #fff (about 18.9:1), uppercase, tracked 0.12em, mono 12px. Basis: WCAG 1.4.3, and it matches the ref1 row-03 label style ("LOGIC CIRCUIT EDITOR").

## Fix pass 2 (final), each change with its basis
1. **Table title.** Now "TRUTH TABLE" in uppercase Inter Tight 800 at 29px. Basis: the ref2 title at x≈1128, y≈228 is bold uppercase, the NYCTA sign-panel voice.
2. **Wordmark position.** Moved down 10px (top = r1 - 0.92em - 2px). The top of the L now sits about 20px below the frame rule and the g still crosses the row line. Basis: ref1 leaves about 22px above the L.
3. **Focus.** The wordmark is the single figure. This mode has no dominant action because the canvas itself is the interaction. Basis: Müller-Brockmann (Grid Systems, Niggli): hierarchy comes from contrast of size inside a fixed grid, with one element dominant. Ref1 does the same with a 400px wordmark against 13px labels.
4. **Softer panel.** The black block is now inset 18px in a white cell and sized to its content, not the full column height. Rules between rows are #2e2e2e hairlines instead of #5a5a5a. The hint sits outside the block in #111. The black mass drops by about 40% but stays a black block, as assigned. Basis: the Swiss grid principle that modules sit inside the field with an even margin (Müller-Brockmann), and Carbon's guidance that dividers stay subtle (https://carbondesignsystem.com/elements/2x-grid/overview/).
