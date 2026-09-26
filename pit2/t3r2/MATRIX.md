# Test matrix: orig (dfec6d0) / a (pit2/t3r-a) / v3

Playwright 1440x810, dev server with a dev-only `window.__GOB` circuit preset (stripped from builds). Checks per case:
no page/console errors, header count = switches + lamps, no clipped header, no sideways overflow without a cue,
header pinned to the scroll box, live row fully visible. Shots: `<v>-<case>.png`.

| case | orig | a | v3 |
|---|---|---|---|
| s0: 0 switches, 1 lamp | PASS | PASS | PASS |
| l0: 2 switches + AND, 0 lamps | PASS | PASS | PASS |
| s1l5: 1 switch + NOT, 5 lamps | PASS | PASS | PASS |
| s13l4: 13 switches, 4 lamps | FAIL: header clipped: #,M,Q1,Q2,Q3,Q4; horizontal overflow; 4-digit # overprints A | FAIL: header clipped: M,Q1,Q2,Q3,Q4; horizontal overflow without cue | PASS |
| direct: lamp wired straight to switch | PASS | PASS | PASS |
| freelamp: unconnected lamp | PASS | PASS | PASS |
| chain: 6-gate chain NAND/NOR/XOR/NOT/NAND/NOR | PASS | PASS | PASS |
| freein: NAND with a free input | PASS | PASS | PASS |
| fanout: one XOR feeding 3 lamps | PASS | PASS | PASS |
| delete: set 1010, delete switch B mid-table | PASS | PASS | PASS |
| toggle13: n=13, scrolled to mid, toggle A and M | FAIL: header clipped: OUT; horizontal overflow; 4-digit # overprints A | FAIL: header clipped: OUT; horizontal overflow without cue | PASS |

Live-row values checked by hand against the logic (e.g. toggle13 -> A..M 1000000000001, XOR 0; delete -> A B C = 1 1 0).
Scroll cues n=13: `v3-n13-cue-top/mid/bottom.png`, sideways n=13 + 4 lamps: `v3-n13l4-h-left/mid/right.png`;
cue shown only toward remaining rows/columns (up hidden at top, down hidden at bottom, left hidden at left, right hidden at right).
