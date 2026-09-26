# t3r2-v2

Base = pit2/t3r-a. Shared changes (pit2/t3r2-base):
- Truth.jsx: each th/td gets `k-S` (switch column) or `k-L` (lamp column); gates are not table columns, so no gate class -- only what the table shows is named (NYCTA: one message per sign).
- Matrix bug fix: at 13 switches + lamps (and 13 + OUT) the equal fixed columns clipped "M/Q1..Q4/OUT" and overflowed with no hint (orig and a both FAIL). Fix: no squeeze; table width = max(4, n) x 25% of the box, i.e. every column keeps its n=3 width and the box scrolls sideways (Muller-Brockmann: the module never shrinks, the field extends). New value: none (25% = the existing n=3 column).
- Scroll cues: the palette's `.pal-more` arrowhead reused as a shared `ScrollCues` component (same 16x8u ink path, same 20u box, same on/off rule), set in the truth cell's existing 20u paper margins: up/down on the right, left/right turned 90 degrees at mid-height. Shown only toward remaining rows/columns. Header stays sticky (vertical).
- App.jsx: dev-only `window.__GOB` circuit preset for the test harness (`import.meta.env.DEV`, stripped from the build).

Variant v2:
- Rules only: one vertical `--rule` ink rule between the last switch column and the first lamp column (td border-left; the sticky th draws it as an inset shadow like its bottom rule). Links to the canvas: switches sit left, lamps right, signal crosses once left to right; the rule is the same weight as the header rule (NYCTA: strong ink rules, one weight). New tokens: 0.
