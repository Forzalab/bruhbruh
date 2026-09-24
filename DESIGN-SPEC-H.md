# DESIGN-SPEC-H (round 4). Every decision is cited.
Pillow measurements, H.png at 1440x810:
| Item | Measured | Target | Source |
|---|---|---|---|
| g crossing the y314 rule | bottom y361, a 47px crossing | 45–50px | RUBRIC 2 |
| L cap | y8–280 = 273px (33.7%) | ≈33.5% | RUBRIC measured |
| i-dot top | y2 | ≥20 | brief |

1. **Wordmark.** Moved up 33px. With the L at 33.5% and the rule at 38.9%, the i-dot rule (≥20px) and a 45–50px g crossing cannot both be met. The brief says the ref overlap depth wins, so the i-dot now sits at y2. It is not clipped; the RUBRIC 2 "clipped" band rules clipping out.
2. **Keyboard.** The Tab order follows the DOM: primary action, then for each node the node, its switch and its ports. The ring is 3px #ff5a1f (WCAG 2.2 SC 2.4.7, 2.4.11, 2.4.13). Handles get tabIndex=0 and an aria-label. Space and Enter toggle the switch because it is a native button (WAI-ARIA APG Button pattern).
3. **Rejection.** The message is 800 14px caps, as in the ref2 bold caps (RUBRIC 3). The rejected port turns orange and gets aria-invalid, which is the only error signal (ARIA 1.2 aria-invalid, WCAG 3.3.1). The footer status changes to "REJECTED: <reason>" (role=status, WCAG 4.1.3).
4. **Table** (ref2 x1120–1436). The header is 22px bold caps over a 3px rule. Body digits are 24px bold. The live row has orange digits and a 6px orange bar, and it is derived from evaluate() on every render (RUBRIC 3, 8).
5. **Switch.** A 4px outlined square with a solid inner square when it is ON, as in ref2 A/B x168–222 y330–384.
6. **Delete.** Double-click a node, or select it and press Backspace/Delete. The node and all of its wires leave the circuit state, and evaluate() recomputes (user directive). The "Logic circuit editor" label is removed (user directive).
7. **Motion.** None: transitions are off globally (brief; WCAG 2.3.3).
