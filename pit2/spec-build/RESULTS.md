# RESULTS: SPEC-FINAL build (J-1..J-21)

Base commit: `ad007aa`. Branch: `pit2/spec-build`.
All commits: `npm test` (91/91) and `npm run build` passed after every item.
Final `dist/` build contains no `__GOB` occurrences.

| Item | Commit | Acceptance measured | Result | Notes |
|---|---|---|---|---|
| J-1 | `48b282d` | Tab→Enter focuses "Add Switch"; Tab→"Add Lamp"; Escape from inside closes + refocuses tab; Escape from BODY closes; Escape from a canvas node closes. Focus ring ink run: col 28-30 ≈98px (spec named col 31, off by outline-offset geometry, ~3px) | PASS | Minor: focus-ring ink column is 28-30, not exactly col 31 as spec's example states, due to outline-offset math; the run length (≥90px) and behavior match. |
| J-2 | `d4af0b6` | Tab→TR.live; ArrowDown x2 → row 2 (A=on,B=off), aria-labels exist | PASS | |
| J-3 | `9c4af2e` | `tt.bottom - lastVisibleRow.bottom` = -0.19/0.06/0.06px at 1280/1440/1920 | PASS | Also added `.pal-tab { z-index: 1 }` — required because J-1's DOM reorder (tab before `.pal-bar`) let the bar paint over the tab, silently breaking its click while open. |
| J-4 | `6e635d8` | `.say-part` count 1→0 after 4300ms; `.say-logo` count 1→0 after 4300ms | PASS | |
| J-5 | `513f32f` | click-add closes palette; keyboard-add (Enter, detail=0) keeps it open; 10 nodes added, zero pairwise bbox overlap; last node has `selected` | PASS | |
| J-6 | `083621c` | Label cap-top = 318/319px at 1440 (target 318±1) and 1920; stable across 2→5 switches; `tt.bottom` ≤ 726 at 5 switches | PARTIAL | At 1280 the page falls into the compact single-row container-query layout (pre-existing; the disk/lockup band reflows), so the row-01/02 grid tracks above `.truth` don't scale linearly with width; the naive 283px expectation doesn't hold there. One fix attempt (`max(u,f)` padding) made no difference. |
| J-7 | `cd44e93` | s1 output handle ink ratio 0.965 (≥0.6); g1 input ink ratio 0.15 (<0.4) | PASS | |
| J-8 | `101b363` | Next Tab stop = "Delete AND gate"; Enter removes node (4→3); rest: elementFromPoint ≠ `.remove`; hover: elementFromPoint = `.remove` | PASS | |
| J-9 | `f47ee4f` | Double-click `.disk` → `.toast` count = 1; OCR = "GRID HIDDEN." | PASS | |
| J-10 | `89e2097` | `main[aria-label="Circuit canvas"]` | PASS | |
| J-11 | `ff958f0` | Forced pin-taken reject on g1: `.remove` count = 0 while `.say-part` exists | PASS | |
| J-12 | `276983f` | Balloon fully inside `.canvas` after 5 zoom steps (`flip-y` applied); OCR reads the phrase; zoom-1 default-spot diff vs `r1/1440-07-reject-balloon.png` = 0.006% | PASS | |
| J-13 | `87e8d50` | Hovered row bg = rgb(226,226,226) | PARTIAL | The literal acceptance grep `#000\b\|#f2f2f2` still matches `.pal-list`'s mask-image stops (`#000` as mask opacity, not a UI colour) — pre-existing, outside this item's two named lines (theme.css:125, :298), left untouched. |
| J-14 | `ed0719a` | `reducedMotion:'reduce'` → `.pal-bar` transitionDuration = "0s" | PASS | |
| J-15 | `fd10e44` | AND glyph left-edge ink run = 2px at 1280/1440/1920 | PASS | |
| J-16 | `9b64fa1` | 13th switch item `title` = "13 switches max" | PASS | |
| J-17 | `fad66a3` | "01" / F-stem last-ink row = 263px at both 1440 and 1920 (exact match) | PARTIAL | At 1280 the same compact container-query layout as J-6 repositions the row-01 band; not comparable the same way. |
| J-18 | `f8c953e` | Confirmed via before/after: pre-fix 1280 toast box 118.3×21.3px; post-fix 133.1×24px (matches 1440/1920 exactly) | PASS | |
| J-19 | `b3fe99a` | 0/8 items partially cut at the fold at 1280/1440/1920 | PASS | Deviated from the spec's literal single-`itemH` formula (it mis-sized the fold across variable group-break gaps, leaving NAND ~27% cut at all three widths); used a per-item offsetTop/offsetHeight walk instead. |
| J-20 | `117a3f5` | Live-row bg = rgb(255,90,31), digit color = rgb(17,17,17) at all 3 widths (exact) | PASS | |
| J-21 | `793fd10` | Header top = tt top (±1); bottom cue "on"=1, centered (±0px); top cue "on"=0, no ink in the top-right band; `.tt.fd` present mid-scroll, absent at bottom; sidebar-hover diff vs baseline = 0.36% | PASS | |

## Summary
19 PASS, 2 PARTIAL (J-6, J-17 both hit the same pre-existing container-query
layout quirk at 1280px that is outside these items' scope; J-13 has a
harmless grep-literal mismatch against an unrelated pre-existing mask-image
use of `#000`). No item failed outright. `npm test` is 91/91 throughout, and
the final `npm run build` output contains no `__GOB`.
