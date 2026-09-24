# DESIGN-SPEC-E (round 3), each decision cited

Pillow measurements at 1440x810 (E.png):
| Item | Measured | Target | Source |
|---|---|---|---|
| Row 01/02 rule | y314 (38.8%) | 38.9% | RUBRIC "Measured corrections" (ref1 y327/840) |
| L cap height | 41→311 = 271px (33.5%) | 33.2–34% | RUBRIC measured, ref1 L 25–304 |
| "i" dot top | y24 (≥20 below the top rule) | ≥20 | brief MUST 5 |
| Table rules | x1032–1414: 24px inset from both column edges (1008/1439) | equal insets | RUBRIC 7 |

Decisions:
1. Focus: `outline: 3px solid #ff5a1f; outline-offset: 2px` on the switch, handle, and primary disk. WCAG 2.2 SC 2.4.13 (w3.org/WAI/WCAG22/Understanding/focus-appearance) requires an indicator at least as large as a 2px perimeter with 3:1 contrast. Orange on white is 3.0:1 against the unfocused state, and the 3px thickness adds margin. SC 2.4.7 (visible) and SC 2.4.11 (not obscured): the outline sits outside the node, and no other layer covers it.
2. Rejection: an inline `role=alert` message placed next to the failed target port, with a 4px accent left bar. GOV.UK Error message (design-system.service.gov.uk/components/error-message) says to "show an error message next to the field" and to "use a border to visually connect the message" with its field. WCAG 3.3.1. The footer no longer turns black, per the brief (no new black mass). The message clears on the next successful connection or on a toggle.
3. Hover, all instant (no transitions; the brief's zero-animation rule): the switch inverts to a black ground (a figure/ground swap, as in Müller-Brockmann's *Grid Systems* on contrast of mass). A port grows from 8px to a 14px hollow ring with a 3px ink ring, the same stroke as RUBRIC 6. A gate's outline goes from 3px to 7px. RUBRIC 12a.
4. Drag: a dashed 3px ink preview wire, and the valid target shows as a hollow ring (RUBRIC 12, inherited from R2).
5. Kept: white paper, black pill gates, flush hairline table, 110px arrow disk, and the 01/02/03 numerals. The accent appears only on signal (RUBRIC 5).
