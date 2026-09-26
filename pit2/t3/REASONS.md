# T3: truth table + labels, legibility pass and column variants

Kept: ink #111 / paper #fff / --one #ff5a1f (logic 1 on canvas + live row only), the Figur wordmark and the TRUTH TABLE label voice.
Density: compact (default). Screens: 1440x810, 3 switches, 2 gates (AND, OR), 1 lamp.

## Legibility pass (shared by A, B, C)

| # | Change | Reason | Source |
|---|--------|--------|--------|
| L1 | Dropped per-glyph width fitting (1 at 125%, 2 at 75%, 4 at 50%, A 115%, B 130%). One tabular figure style. | Every 1 and 0 has the same shape and width, so columns scan straight down. The fitting copied a reference crop instead of serving reading. | Ruder, *Typography* (consistency of form); M3 type guidance: tabular figures for data |
| L2 | Column headers: one small-caps label style (17u, 700, +0.06em) instead of 32u display glyphs. | Headers are labels, not data: they rank below the TRUTH TABLE title and share its voice. Capitals need extra tracking. | M3 type scale, label-large (tracked); Ruder on spacing capitals |
| L3 | Figures 35.8u/760 to 24u/600 (1s at 760). | Near-display figures in a 350u column read as a poster; smaller even figures read as a table and leave room for gate columns. | Rams #10, "as little design as possible" |
| L4 | Compact rows: 68u to 34u; all 8 rows fit without scrolling. | The whole 3-input table is visible, so any row can be compared with every other. | M3 density (compact steps; 32-36dp dense rows) |
| L5 | Row number in --ink-2, smaller, tracked. | The index is metadata and should not compete with logic values. | M3 emphasis (on-surface-variant for secondary text) |
| L6 | 0 in --ink-2 at 500, 1 in ink at 760. | The pattern of 1s reads at a glance without spending orange on it. --ink-2 is 4.54:1, still AA. | Rams #4, "makes a product understandable"; WCAG 2.2 SC 1.4.3 |
| L7 | Live row: ink text on --one (6.6:1) instead of paper on --one (3.0:1). | White on #ff5a1f fails AA for body-size text. | WCAG 2.2 SC 1.4.3 (4.5:1) |
| L8 | Row separators: --grid hairline instead of ink. | Ink hairlines on every row made a cage; light rules group rows quietly. One ink rule stays under the header. | Tufte, data-ink ratio; Muller-Brockmann (one strong rule) |
| L9 | Gate columns added (intermediate values between inputs and outputs, headed by gate type). | Required for the switch / gate / lamp split, and shows why the lamp is lit. | Rams #4 |

## Variants: making switch / gate / lamp columns distinct

- **A, rules**: a heavy ink rule opens each column group, plus a caption row (IN / GATES / OUT). Structure by line and space. Source: Muller-Brockmann grid (fields separated by rules), Ruder.
- **B, tone**: switch columns on paper, gate columns on a light tonal surface, lamp column headed by an inverted ink block. Source: M3 surface-container tones; Rams #3 via restraint (grey only, no new hue).
- **C, glyph + type**: each header carries the canvas shape of its kind (square switch, D gate, round lamp); lamp column set heavier, gate column quieter. Source: M3 iconography (icon + label); Rams #4 (the table speaks the canvas's language).
