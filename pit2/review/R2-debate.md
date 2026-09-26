# R2 debate, round 1

For this round I rebuilt on origin/claude/leftover-tonight-tasks-5wm6yl at **ad007aa** and used the app again with `r2/s5.js`: I clicked "Add Switch" three times and scrolled the table with the mouse wheel at 1280 and 1440. New screenshots are named `r2/v2-*`.

## R1's findings

| R1 | Verdict | Note |
|---|---|---|
| R1-1 rows mouse-only | **AGREE**, MERGE-WITH R2-2 | Same bug, same fix. Blocker. |
| R1-2 palette tab last in tab order | **MERGE-WITH R2-1**, AGREE on blocker | R1 found where it sits in tab order. I found what happens after it opens: the next Tab goes to BODY and the items can't be reached (kb-pal-tab4.png). Together they make one blocker: after opening, focus should go to the first item, and the tab should come before the list in the DOM. |
| R1-3 half-row under sticky header | **MERGE-WITH R2-11**, AGREE | It still happens on ad007aa. See R2-11 below. |
| R1-4 stale reject balloon | **MERGE-WITH R2-4**, AGREE | I also saw it with the wordmark's "PICK AN OUTPUT FIRST!" balloon. |
| R1-5 picked port looks the same as a focused one | **AGREE** (missed by me) | My kb-picked.png shows it: 3 px at offset 1 vs 3 px at offset 2 can't be told apart. Quality, 0.8. |
| R1-6 click-added parts pile up | **AGREE** (missed by me; confirmed) | On ad007aa, 3 clicks put the switches at 495,490 / 515,510 / 535,530, a 20 px staircase right on top of the AND (`v2-clickadd-1440.png`, same at 1280). I drag-dropped, so I missed this. MERGE my R2-8 (drop overlap) into it as one "placement collision" finding. Quality, 0.9. |
| R1-7 no feedback on palette add | **AGREE**, MERGE-WITH R1-6 | Selecting and focusing the new node also fixes the keyboard half of R2-1. |
| R1-8 table block drifts | **MERGE-WITH R2-7**, AGREE | Same measurement: R1 got 28 px, I got 22 px (different row counts). |
| R1-9 faint row hover | **AGREE** as polish | Hover isn't essential, so 1.30:1 is allowed. My R2-19 (hover borrows the grid token) is about the token, not contrast, so it stays separate. |
| R1-10 live row on the AA floor | **PARTIAL DISAGREE**, see R2-12 | Below. |
| R1-11 delete button unreachable by keyboard | **MERGE-WITH R2-6**, AGREE | R1 is right that `display:none` removes it from the tab order. I add the 24 px target size. |
| R1-12 empty row 03 | **MERGE-WITH R2-10**, AGREE, DECISION FOR TONY | Same proposal (a help line or counts). I lean towards the help line, because right-click delete is otherwise undiscoverable. |
| R1-13 canvas ranks 4th | **AGREE**, MERGE-WITH R2-18 | Bigger default zoom plus a pre-wired demo is one proposal. |
| R1-14 01 off the wordmark baseline | **AGREE** (missed by me) | I didn't measure baselines. The 7-8u offset is constant across the three widths, so it looks systematic, not rounding. Polish, 0.55. |
| R1-15 tab straddles the gutter | **AGREE**, MERGE-WITH R2-28 | Both are about tab geometry. Hinge-reading is fine; the concern is at 1280, where the 44 px floor makes it heavier. |
| R1-16 balloon tail aims at the delete X | **MERGE-WITH R2-17**, AGREE | Same collision. R1's fix (hide the X while the part is speaking) is better than mine. |
| R1-17 th/td near-duplicate sizes | **DISAGREE** | See below. |
| R1-18 balloon clipped at the row-02 top | **MERGE-WITH R2-14**, AGREE | The same overflow clips it at the top (R1) and at the right (me). One fix: flip or clamp the balloon inside the canvas cell. |
| R1-19 reduced motion | **MERGE-WITH R2-26**, AGREE | Polish. |
| R1-20 spacing off-scale | **MERGE-WITH R2-21**, AGREE | R1's idea to use the 20u canvas module is the better target. |
| R1-21 `#000` on disk hover | **MERGE-WITH R2-20**, AGREE | |
| R1-22 `#f2f2f2` fallback | **MERGE-WITH R2-19**, AGREE | |
| R1-23 pure white paper | **AGREE** with R1's "no action" | Locked palette. Not a finding. |
| R1-24 contradictory toast stack | **AGREE** (missed by me) | My toast-1440.png shows "GRID SHOWN." and "GRID HIDDEN." together. I saw it but didn't treat it as a defect. Replace a toast of the same topic instead of stacking. Quality, 0.7. |
| R1-25 toast caps small at 1280 | **MERGE-WITH R2-13**, AGREE | |
| R1-26 half glyph at the palette fold | **AGREE**, polish | My pal-open-1440.png shows the same NAND cut-off. It sits next to the locked arrow cue, but the fold position isn't locked. |

### Disagreements

**R1-17 (th 32.4 vs td 35.8)**
Steelman: rhythm rule 2 says sizes should be identical or clearly different, and a 10 % gap looks like a mistake.
Counter: the header and the digits are told apart by more than size. The header is **letters** (A/B/OUT), the body is **digits**, and they are separated by the heavy rule the owner locked. Per-glyph fitting sets these sizes so the cap heights *match optically*: I OCR-measured both at about 22-23 px cap at 1440 in base-1440.png. So the two are actually tuned to be equal, and the size difference is a metric correction, not a hierarchy step. Changing either would break a locked fit. Confidence that it's not a defect: 0.65. I would drop it or downgrade it to info.

**R1-10 vs R2-12 (live-row contrast)**
Steelman: 3.12:1 passes WCAG for large text, and the orange row is locked, so noting it and taking no action is correct.
Counter: the lock covers the orange *fill*, not the digit colour. A 0.12 margin means any fallback render (Roboto Flex fails to load, so the text falls back to the Arial-metric stack below 18.66 px bold at small widths), or any future non-bold use, fails. Ink on orange is 6.06:1, still reads as "live", and keeps orange as the only signal. I keep it as a **DECISION FOR TONY**, quality, 0.6. The cost of not acting is not zero.

## My findings: final status after the debate

| R2 | Status |
|---|---|
| R2-1 | Keep (blocker), merged with R1-2. |
| R2-2 | Keep (blocker), merged with R1-1. |
| R2-3 | Keep. R1 didn't test Escape. I re-confirm: Escape did not close the palette in s3.js. I'd downgrade it to **quality** if R2-1 moves focus correctly, because then the bar isn't a trap. |
| R2-4 | Keep, merged with R1-4. |
| R2-5 | Keep. R1 didn't flag that the palette hides the demo switches. v2-clickadd-1440.png again shows the open bar covering s1/s2, with only their dotted stubs visible at x 168. Quality, 0.8. |
| R2-6 | Keep, merged with R1-11. |
| R2-7 | Keep, merged with R1-8. |
| R2-8 | Merged into R1-6. |
| R2-9 | Keep. DECISION FOR TONY (the disk's arrow, and aria-pressed has no visual). R1 lists the disk as the 2nd fixation but doesn't challenge it. |
| R2-10 | Merged with R1-12. |
| R2-11 | **Still holds on ad007aa.** v2-tt-wheel1-1440.png: after one wheel step (scrollTop 68), the box ends at y=713 and the last visible row spans 671-739. Its digits "0 0 1 0" are cut through the middle. At 1280, the last row spans 596-656 against a box bottom of 633. ad007aa's 0.2em headroom fixed the top caps only. The bottom is still off because max-height (360u) isn't header + N rows. Merged with R1-3, which is the top-side version of the same cause. Quality, 0.8. |
| R2-12 | Keep as DECISION FOR TONY (see above). |
| R2-13 | Keep, merged with R1-25. |
| R2-14 | Keep, merged with R1-18. |
| R2-15, R2-16 | Keep. Polish. R1 measured the disk/label column as aligned (agreed), but didn't check the right edge (lockup 1400 vs table 1417) or the table rules sitting 4 px left of the label. |
| R2-17 | Merged with R1-16. |
| R2-18 | Merged with R1-13. |
| R2-19, R2-20, R2-21 | Merged with R1-22, R1-21, R1-20. |
| R2-22 | Info only. |
| R2-23 | Keep (1 px palette glyph strokes vs 2-3 px on the canvas). R1 didn't measure it. Polish, 0.55. |
| R2-24 to R2-28 | Keep. R2-26 is merged with R1-19, and R2-28 with R1-15. |

## New from this round

**R2-29.** Sideways scrolling hides the outputs, so rows look duplicated. On ad007aa, with 5 switches, the visible viewport shows A-D only, and E plus OUT are off to the right. Rows 00010 and 00011 then both read "0 0 0 1" (`v2-tt-wheel1-1440.png`, rows 2-3), so the table looks like it repeats rows and shows no output at all. The only hint is an 8×16u arrow.
Proposed (**DECISION FOR TONY**, next to the locked H+V scroll): make the lamp columns `position: sticky; right: 0`. The inputs scroll behind the heavy switch|lamp rule, and the output (the reason the table exists) stays visible. This keeps both the locked scroll and the locked rule.
Quality, 0.7.
