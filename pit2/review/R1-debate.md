# R1 debate, round 1

I re-checked everything on **ad007aa** (the current origin/claude/leftover-tonight-tasks-5wm6yl), rebuilt and served on :4931. Script: `r1/d.js`. Shots: `r1/deb-*.png`.

## Re-checks

**The ad007aa fix and my R1-3.** With real wheel scrolling (3 notches over the table, 6 inputs), the *top* body row now snaps whole under the header. The *bottom* row is still cut at the scroller's edge: the digits "0 0 0 1" are sliced at y≈712 at 1440 (`r1/deb-1440-wheel.png`). The same happens at 1280, where the last row spans 596-656 in a box that ends at 633.
- My original half-row-at-top evidence came from setting scrollTop programmatically and from the zoom shot. That is weaker evidence than a real scroll. I withdraw the top-edge form of R1-3.
- The bottom-edge form is real and is exactly R2-11. So **R1-3 is merged with R2-11**, with R2's framing: size the scroller to header + N whole rows.

**R2-1 (keyboard users cannot add parts): I dispute it.** Re-dogfooded at 1280 and 1440:
1. Focus the tab and press Enter. The palette opens and focus stays on the tab (now "Close parts").
2. Shift+Tab lands on "Add NOT". Enter adds a part: the node count went from 4 to 5.
3. Escape closes the palette (`.open` became false).

So keyboard users *can* add parts. The real defect is that the items come **before** the tab in DOM order: after opening, Tab goes forward to BODY, and the list is reached backwards starting from NOT. That is my R1-2, broadened.

**R2-3 (Escape does not close the palette): I dispute it.** Escape does close it when focus is inside `.palette` (Palette.jsx `onKeyDown`). R2 pressed Escape after focus had already escaped to BODY. That is a symptom of R1-2 and R2-1, not a missing handler.

**R2-9 (the pressed disk looks identical): I dispute that part.** Measured: with `aria-pressed=true` the disk's SVG has `transform: matrix(0,1,-1,0,0,0)`, which means the arrow rotates 90° to point down (`r1/deb-1440-disk-pressed.png`). The pressed state is visible, although it is subtle.

**R2-27 (nodes have no accessible name): partly true.** Gate and lamp nodes do have inner `role=img` labels ("AND gate, output 0", "Lamp off"). Switch nodes have none on the wrapper, but their `.switch` button is labelled. `main` has no label (confirmed null). The outer React Flow `role=group` wrappers are unnamed on every node. So I agree only with the `main` label and the wrapper-name parts.

## Verdicts on R2's findings

| R2 | Verdict | Note |
|---|---|---|
| R2-1 | **DISAGREE** (merge the remainder into R1-2) | **Steelman:** tab order puts the palette after the canvas and the list is not where Tab goes, so to a keyboard user the parts feel unreachable. **Counter:** measured, Shift+Tab then Enter adds a part (4→5 nodes). Severity is a blocker for *order*, not for *reachability*. Fix: move focus to the first item on open and render the tab before the list. |
| R2-2 | AGREE, merge with R1-1 | Same finding. R2's roving-tabindex plus `aria-selected` is the better proposal; I adopt it. |
| R2-3 | **DISAGREE** | **Steelman:** in R2's run, Escape left the overlay open, which is a real failure the user felt. **Counter:** the handler works when focus is inside the palette (measured `.open` → false). The failure follows from focus leaving the palette (R1-2). Not a separate blocker; fold it into R1-2 as "Escape returns focus to the tab". |
| R2-4 | AGREE, merge with R1-4 | R2 also found that "PICK AN OUTPUT FIRST!" goes stale, which I missed. Confirmed by code: `status.phrase` is cleared only by connect or delete. |
| R2-5 | AGREE (new to me) | Confirmed in my `1440-02-palette-hover.png`: the open bar (55-155) covers the switches (81-167), and only the dotted stubs remain visible. Quality. |
| R2-6 | AGREE, merge with R1-11 | R2 adds the 24 px target size and the fact that right-click delete is not discoverable. I accept both. |
| R2-7 | AGREE, merge with R1-8 | My numbers match (a 28 px shift at 1440, 50 at 1920). |
| R2-8 | AGREE, merge with R1-6 | R1-6 is the stronger case: the click-add path *always* stacks on the AND. The drop path (R2-8) overlaps only when the user aims badly, so it is lower severity. |
| R2-9 | **DISAGREE** on "pressed identical"; AGREE the arrow is semantically odd | **Steelman:** an NYCTA arrow means "go that way", and the heaviest mark on the page toggles a background grid. **Counter:** the pressed state is visible (a 90° rotation, measured). On the glyph I'd keep the route-bullet disk but give it the grid meaning. I support it going to Tony, at polish severity, not quality. |
| R2-10 | AGREE, merge with R1-12 | Same DECISION FOR TONY. R2's help-line copy is a good option A. |
| R2-11 | AGREE, absorbs R1-3 | See the re-check above. It still reproduces on ad007aa. |
| R2-12 | **DISAGREE** as a quality issue | **Steelman:** 3.12:1 has only 0.12 of margin, and a fallback font could fall below the large-text size. **Counter:** the digits are 35.8u/760, which is 31.8 px even at 1280, well above 18.66 px bold, and the size is floored by `max(u,f)`, so no width drops them below large. It passes AA. Paper-on-orange is part of the locked live-row design. Keep it at polish, as a DECISION FOR TONY only (it matches my R1-10). |
| R2-13 | AGREE, merge with R1-25 | R2 also covers balloons. I measured the balloon cap at 12-13 px at 1440, larger than R2's ~10, so balloons are less urgent. Toasts at 1280 (11 px) are the weak case. |
| R2-14 | AGREE, merge with R1-18 | The same clipping at the other two edges (R1-18 at the top rule, R2-14 at the side column). One fix: flip the balloon at the cell edge. |
| R2-15 | AGREE (missed) | Confirmed: lockup ink right 1400 vs table right 1417 at 1440. Polish. |
| R2-16 | AGREE (missed), confidence 0.5 | Table rules at 981 vs label and disk at 985/986. Could be deliberate optical overshoot; polish. |
| R2-17 | AGREE, merge with R1-16 | Same collision (my run was on the AND, R2's on the lamp). |
| R2-18 | AGREE, low | Pre-wiring the demo helps the 5-second test and also exercises the pin bleed at once. Polish. |
| R2-19 | AGREE, merge with R1-22 | R2's `--hover` token proposal is better than simply removing the fallback. |
| R2-20 | AGREE, merge with R1-21 | |
| R2-21 | AGREE, merge with R1-20 | |
| R2-22 | AGREE | Informational. My OCR agrees. |
| R2-23 | AGREE (missed), confidence 0.5 | Visible in my palette shot: the glyphs read hairline next to the 3 px canvas parts. Polish. |
| R2-24 | AGREE | Hover and focus look the same on the tab. Polish. |
| R2-25 | AGREE, low | Code-read only (the aria-label already says "13 switches max" for screen readers; sighted users get nothing). |
| R2-26 | AGREE, merge with R1-19 | Same measurement (0.16s under reduce). |
| R2-27 | PARTLY AGREE | See the re-check: gate and lamp inner labels exist; `main` and the RF group wrappers are unnamed. Quality, narrowed. |
| R2-28 | AGREE, low | Confirmed: the tab overlaps the open bar's right glyph column (it spans 133-177 over a bar that ends at 155). Polish. |

## Verdicts on my own findings (after reading R2)

| R1 | Verdict |
|---|---|
| R1-1 | Keep. Merge with R2-2. |
| R1-2 | Keep as the blocker. It absorbs the valid core of R2-1 and R2-3. |
| R1-3 | Withdrawn at the top edge (ad007aa plus snap now land whole rows). Bottom edge merged into R2-11. |
| R1-4 | Keep. Merge with R2-4. |
| R1-5 | Keep. R2 did not cover it; the picked port looks the same as the focus ring. |
| R1-6 | Keep. Merge with R2-8 (R1-6 is the primary). |
| R1-7 | Keep (new part not focused or selected). R2 did not cover it. |
| R1-8 | Keep. Merge with R2-7. |
| R1-9 | Keep, polish. Related to R2-19. |
| R1-10 | Keep, polish. Covers the same ground as R2-12 (I disagree with R2's severity). |
| R1-11 | Keep. Merge with R2-6. |
| R1-12 | Keep. Merge with R2-10 (a DECISION FOR TONY). |
| R1-13 | Keep, polish. Related to R2-18. |
| R1-14 | Keep, polish. R2 did not cover it. |
| R1-15 | Keep, low. Related to R2-28. |
| R1-16 | Keep. Merge with R2-17. |
| R1-17 | Keep, polish. R2 did not cover it. |
| R1-18 | Keep. Merge with R2-14. |
| R1-19 | Keep. Merge with R2-26. |
| R1-20 | Keep. Merge with R2-21. |
| R1-21 | Keep. Merge with R2-20. |
| R1-22 | Keep. Merge with R2-19. |
| R1-23 | Keep, informational. |
| R1-24 | Keep (contradicting toast stack). R2 did not cover it. |
| R1-25 | Keep. Merge with R2-13. |
| R1-26 | Keep, polish (half-glyph at the palette fold). R2 did not cover it. |

**Tally.** Of R2's 28 items, I agree with or merge 23. I dispute R2-1, R2-3 and R2-12, and partly dispute R2-9 and R2-27. I missed R2-5, R2-15, R2-16, R2-18, R2-23, R2-24, R2-25 and R2-28, and now confirm all of them. I withdraw R1-3 as filed (its surviving half is R2-11).
