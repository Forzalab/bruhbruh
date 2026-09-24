# DESIGN-SPEC-G (round 4). Every decision is cited.

Pillow measurements at 1440x810 (r4/G.png):
| Item | Measured | Target | Source |
|---|---|---|---|
| Row rule | y314 | 38.9% | RUBRIC, measured |
| "g" descender below the rule | 361-314 = 47px | 45–50 | RUBRIC 2 (ref1) |
| "i" dot top | y21 | ≥20 | brief |
| L cap | 37→~290 = 253px (31.2%) | 33.5% | trade-off below |

1. Trade-off (RUBRIC 2). At 33.5% L, the cap and the "g" descender are 271/83 px. A 47px overlap plus an i-dot at ≥20px leaves room for at most a 0.92 scale. The arbitrator's MUST FIX 2 says the ref's overlap depth comes first, so the wordmark is set at 345px.
2. Keyboard. Every switch, node, and port is a tab stop in DOM order (A, B, AND, OUT). Each has a 3px #ff5a1f outline: WCAG 2.2 SC 2.4.7 and 2.4.11, and SC 2.4.13 (at least 2px, 3:1 contrast). Space or Enter toggles a switch (native button, SC 2.1.1). On a port, Enter or Space picks the output, then the chosen input: a keyboard alternative to dragging (SC 2.5.7 Dragging Movements).
3. Rejection. Inline and in the footer, set in 800 14px Inter Tight caps, the ref2 grotesk voice (RUBRIC 3), with a 4px accent bar (GOV.UK Error message). The footer now says "Rejected: <reason>".
4. Table header rule is 3px ink over 1px body hairlines: weight contrast (RUBRIC 8; Ruder, *Typographie*, contrast).
5. The live row is read from the switch state directly (circuit.nodes.sN.value), so it always matches the inputs.
6. Node delete: double-click, or select and press Backspace/Delete. This removes the node and its wires, and the circuit re-evaluates (user directive). The "Logic circuit editor" label is removed (user directive).
