# Design spec C (round 2), with citations

Measured on r2/C.png at 1440x810 with Pillow. Refs: ref1 = refs/ref1-swiss-layout.png, ref2 = refs/ref2-nyc-type.png.

- Row 01/02 rule at y=327 (40.4%). ref1 has it at y=327, and RUBRIC §1 targets 40%.
- Footer row is 69px (8.5%). RUBRIC §1 targets about 65px.
- Column split is 70/30 with a 46px gutter. ref1 splits at x≈1022/1456. Sources: RUBRIC §1 and Müller-Brockmann, *Grid Systems*.
- The wordmark's L cap height is 266px (32.8% vh). The top of the i dot is at y=22, which meets seed (4) (≥20px). The baseline is at y=304 (ref1: ~303), and the g crosses the rule by 56px (ref1: 45–50). This is RUBRIC §2. I shrank the L from 283px to 266px so the dot is not clipped, because seed (4) takes priority.
- The truth table sits flush to the cell lines. Its rules run full-bleed from x=1008 to x=1440, the row pitch is 57px, and it has 1px horizontal rules only. Sources: ref1 x1040–1436 and RUBRIC §1 and §8. The live row uses orange digits plus a 4px orange left rule (dealt hand).
- The title is 30px/800, headers are 20px and digits are 24px bold. Sources: ref2 and RUBRIC §3 (NYCTA manual).
- The primary action is a 110px black disk with a white arrow and the bold label "SHOW GRID". It is the only button. Sources: ref2 arrow-in-circle pictogram and https://design-system.service.gov.uk/components/button/ (one primary button per page). The disk is black, not orange, to keep accent discipline (RUBRIC §5).
- The black table panel is removed, so the black-and-orange mass no longer competes with the wordmark (seed 3).
- Gates are filled black with white 16px/800 labels. Strokes are 3px (RUBRIC §6).
- Orange #ff5a1f appears only on logic-1 wires, ON switch cores, the lamp and the live row (RUBRIC §5). There is no animation, and prefers-reduced-motion is respected.
