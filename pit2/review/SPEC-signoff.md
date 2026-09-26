# SPEC sign-off: R2

**Verdict: SIGNED-WITH-AMENDMENTS.** There are 6 amendments. A1, A2 and A3 are required: without them a Sonnet implementer will either ship a bug or fail its own acceptance test. A4 to A6 are clarifications.

I checked the spec against the code at origin/claude/leftover-tonight-tasks-5wm6yl (ad007aa). All items are located correctly. Four were checked closely:

- **J-8** matches theme.css:220-223. `.node .remove{display:none;border-radius:50%}` is round on purpose ("Tony, pick 3"), so it is correct that the spec keeps it round.
- **J-6**: theme.css:350 already has `.truth{…padding-block:1.5rem; align-items:end}` inside the container block. The spec's "verify" note holds: that rule comes later and overrides the new padding-top, so zoomed mode is unaffected.
- **J-18**: `--f = min(1rem/16, u*dpr)` (theme.css:57). At 100% zoom, --f equals --u, so `max(var(--u), var(--f))` changes nothing at 1280. **The item fails its own acceptance test** (see A3).
- **J-1** matches Palette.jsx:78-91. The wrapper `onKeyDown` Escape handler and the tab-after-nav order are as the spec describes.

No item breaks a locked decision:

- The J-12 counter-flip keeps the 2:1 ellipse and the lettering.
- J-7 uses ink, not --one.
- J-13 moves the hover colour to a token without changing the value.
- J-3 does not change the H+V scroll.

## Required amendments

**A1. J-8: an invisible X must not be clickable.**
With `opacity:0` plus a 44 px `::after`, an invisible hit area sits on every part at rest. A click near a part's top edge would delete it without warning. Reproduce: after J-8 as written, `elementFromPoint` at the resting X centre returns `.remove`.

Add to the J-8 CSS:
```css
.node .remove { pointer-events: none; }
.react-flow__node:hover .node .remove, .react-flow__node.selected .node .remove, .node .remove:focus-visible { pointer-events: all; }
```

Add this acceptance test: at rest (no hover, no selection), `elementFromPoint` at the tile centre must **not** return `.remove`. The existing "±20 px returns .remove" test must run only while the node is hovered.

**A2. J-2: fix the acceptance test, and keep a tab stop when the live row is not rendered.**

(a) The test is wrong. From the live row 0 (A=0,B=0), ArrowDown twice goes to row 2 = **A=1, B=0**. So the test must expect `Switch A, on` and `Switch B, off`, not "Switch B, on".

(b) With `tabIndex={i === live ? 0 : -1}`, the table has **no tab stop** when the live row is windowed out: rows are rendered only for `first..last`, and the user may have scrolled away. Change it to:
```js
const stop = live >= first && live < last ? live : first;
tabIndex={i === stop ? 0 : -1}
```

Add this acceptance test: with 5 switches, scroll the table to the bottom (the live row = 0 is not rendered), then Tab into the table. The active element is a `TR`.

**A3. J-18: use a floor that actually applies at 1280.**
Replace `max(var(--u), var(--f))` with `max(var(--u), 1px)`. This keeps the 1440 size as the floor, the same unit that sets 12 px caps at 1440. Keep the acceptance test as written: ≥12 px at 1280, and 12 / 17 ±1 at 1440 / 1920.

Also note what this changes: the toast box grows about 12.5 % at 1280, and it must still sit 20u from both rules. Check `right:20u; bottom:20u` from the box edges with Pillow at 1280.

## Clarifications

**A4. J-1 Escape test wording.**
Replace "active element label = 'Close parts' before the close / 'Open parts' after it" with:

> Focus is on "Add Lamp". Press Escape. Then `.palette.open` count = 0 **and** `document.activeElement.getAttribute('aria-label') === 'Open parts'`.

Also add the sequence the coordinator found in the re-test: open the palette with Enter, Tab until focus is on `BODY`, press Escape. `.palette.open` count = 0, and no focus assertion applies.

**A5. J-5 scope: also close the bar after a click-add from the palette.**
R2-5 was about the open bar covering the demo switches. The spec closes the bar only on drop (`onDrop`). A click-add (`onAdd`) leaves the bar open over s1/s2, and that is exactly the path R1-6 measured.

Either:
- add `setPalOpen(false)` on the pointer click-add path. Keyboard Enter should keep the bar open, so a keyboard user can add several parts in a row: `onClick={(e) => { … onAdd(it); if (e.detail > 0) setOpen(false); }}` in Palette.jsx; or
- state explicitly that this goes to D-5(c).

I prefer the first option.

**A6. J-3 and J-6 interplay.**
J-6 moves the table block down to a fixed top (padding 54u), so a large table now fills downward. The J-3 cap (360u) plus header must still end at least 20u above the row-03 rule.

Add this acceptance test for J-6: with 5 switches at 1440, `tt.getBoundingClientRect().bottom <= 746 - 20`. Measured on ad007aa with centring, it ends at 713. With a top-anchored block it should still end at about 713, because the 2-input position equals the centred position only for the 4-row table. **If the scrolled table's bottom goes past 726, reduce the J-3 cap, not the 54u.**

## Coverage of my findings

Everything I raised is either built or correctly routed:

- **Built:** R2-1/2/3/24 → J-1/J-2. R2-4 → J-4. R2-6 → J-8. R2-7 → J-6. R2-8 → J-5. R2-11 → J-3. R2-19/20 → J-13. R2-23 → J-15. R2-25 → J-16. R2-26 → J-14. R2-27 → J-10.
- **Decisions for Tony:** R2-9 → D-1. R2-12 → D-2. R2-29 → D-3. R2-10 → D-4. R2-18 and R2-5 → D-5 (see A5). R2-15/16 → D-7. R2-21 → D-8. R2-28 → D-9.
- **Out of scope:** the R2-13 balloon part. I accept this: the lettering is locked art, and the balloon caps measure 12-13 px, which OCR reads exactly.

None of my findings is missing or wrongly moved.
