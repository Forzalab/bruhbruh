# SPEC: Figur design fixes (R1 draft, awaiting R2 sign-off)

## 1. Verdict and scope

**Verdict: not ready to ship.** The visual system passes review. What fails is behaviour: keyboard access, feedback that never goes away, and part placement. Build every J-item below, then the app is ready once Tony answers the §3 decisions.

**Base:** `origin/claude/leftover-tonight-tasks-5wm6yl` at **ad007aa** or later. Line numbers below are from ad007aa. If they have drifted, find the code by its selector or code text; do not guess.

**Rules for the implementer:**
- Do only what this spec says.
- Do not touch any locked decision: Roboto Flex fitting; the ink/paper palette, with --one used only for logic 1 and the live row; --caption only on toasts; Anime Ace balloons and caption toasts, and where they sit; 3px parts and wires with zoom growth; the 2u grid rule; the truth table's PR4 layout, with the switch|lamp rule and the heavy header rule; H+V scroll with arrowhead cues; pin bleed and the half wedge; the XOR hop; no letters on switches; the Swiss/NYCTA grid.
- Do not change any font-size, font-variation-settings, letter-spacing or colour token value unless an item says so.
- After every item, run `npm test` and `npm run build`. Both must pass.

**Test harness for acceptance steps:**
1. `npm run build && npx vite preview --port 4931 --strictPort`.
2. Run Playwright with `NODE_PATH=$(npm root -g)` in Chromium, viewport 1440x810 unless stated otherwise.
3. `goto('http://localhost:4931/')`, then `waitForTimeout(1500)`.
4. Pillow measurements are made on `page.screenshot()` PNGs. "Ink" means a greyscale value below 110.

## Evidence that settles the disputes (R1 re-test on ad007aa, script `r1/e.js`)

**Palette focus (R2-1 / R2-3 against R1).** Both reviewers' reports were correct.
- Sequence A: Tab x14 lands on `.pal-tab` ("Open parts"). Enter opens the palette. The next Tab goes to `BODY`, then to `.disk`, then to a canvas node: focus leaves the open palette forward. Escape with focus on `BODY` leaves the palette open (`.open` = true).
- Sequence B: open the palette by click, focus the AND node, press Escape. The palette stays open.
- Sequence C: open by click (focus stays on the tab), press Escape. The palette closes.
- Shift+Tab from the tab reaches "Add NOT", and Enter adds a part. R1 saw this in round 1.
- **Real defect:** the items sit *before* the tab in the DOM, focus is not moved into the palette when it opens, and Escape works only while focus is inside `.palette`. That becomes J-1.

**R1-17 cap heights.** Measured with Pillow on `r1/caps-1440.png`: header caps A/B/OUT = **23 px** (y 379-401), body digits 0/1 = **26 px** (y 507-532). They differ by 13%, so the sizes are not an equal-cap correction. But the sizes belong to the locked PR4 table fit, so this is **not built**. It goes to §3 D-6.

**R2-12 / R1-10:** goes to §3 D-2.

---

## 2. Build items

### Blockers

#### J-1. Palette: DOM order, focus on open, global Escape
- **Sources:** R1-2, R2-1, R2-3, R2-24.
- **Files:** `src/Palette.jsx` lines 77-96; `src/theme.css` line 150.

**Current code** (Palette.jsx:78-91):
```jsx
<div className={`palette ...`} onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}>
  <nav className="pal-bar" ...> ... </nav>
  <button className="pal-tab" aria-expanded={open} ... onClick={() => setOpen(!open)}> ... </button>
```

**New code:**
1. Move the whole `<button className="pal-tab" …>…</button>` element so it sits **before** `<nav className="pal-bar">`. Change nothing else in it. Its CSS is absolutely positioned, so nothing moves visually.
2. Add `aria-controls="pal-list"` to the tab, and add `id="pal-list"` to the `<ul ref={list} …>`.
3. Add a tab ref and focus handling:
```jsx
const tab = useRef(null);
const byKey = useRef(false);
// on the tab button:
ref={tab}
onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') byKey.current = true; }}
// new effect:
useEffect(() => {
  if (open && byKey.current) { byKey.current = false;
    requestAnimationFrame(() => list.current?.querySelector('.pal-item:not([aria-disabled])')?.focus()); }
}, [open]);
useEffect(() => {
  if (!open) return;
  const esc = (e) => { if (e.key !== 'Escape') return;
    const inside = e.target.closest?.('.palette');
    setOpen(false); if (inside) tab.current?.focus(); };
  window.addEventListener('keydown', esc);
  return () => window.removeEventListener('keydown', esc);
}, [open]);
```
4. Delete the old `onKeyDown` on the wrapper `<div className="palette">`.
5. In `theme.css:150`, replace
   `.pal-tab:hover, .pal-tab:focus-visible { background: var(--ink); outline: none; }`
   with
   `.pal-tab:hover, .pal-tab:focus-visible { background: var(--ink); } .pal-tab:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }`

**Acceptance test:**
- Tab from page load until `aria-label` = "Open parts", press Enter. `document.activeElement.getAttribute('aria-label')` must equal **"Add Switch"**.
- Tab once more: the label must be "Add Lamp".
- Press Escape: `.palette.open` count = **0**, and the active element label = "Close parts" before the close / "Open parts" after it.
- Open the palette by click, focus `.react-flow__node-G`, press Escape: `.palette.open` count = 0.
- Screenshot the focused tab and crop x 20-100, y 440-570. Pillow must find an ink ring 2 px outside the tab box (column x = 31 at 1440 has ink rows spanning at least 90 px).

**Must not change:** the tab's position and size, the slide animation, the click behaviour, `inert`/`aria-hidden` on the closed bar, the hint balloon.

#### J-2. Truth-table rows reachable and operable by keyboard
- **Sources:** R1-1, R2-2.
- **File:** `src/Truth.jsx` line 77 (`<tr key={i} className=… onClick=…>`); `src/theme.css` (append after line 298).

**Current code:**
```jsx
<tr key={i} className={i === live ? 'live' : ''} onClick={() => setSwitches(ins, row.slice(0, ins.length))}>
```

**New code:**
```jsx
<tr key={i} className={i === live ? 'live' : ''} tabIndex={i === live ? 0 : -1}
  aria-selected={i === live} data-row={i}
  onClick={() => setSwitches(ins, row.slice(0, ins.length))}
  onKeyDown={(e) => {
    const go = (j) => { if (j < 0 || j >= rows.length) return; e.preventDefault();
      setSwitches(ins, rows[j].slice(0, ins.length));
      requestAnimationFrame(() => box.current?.querySelector(`tr[data-row="${j}"]`)?.focus()); };
    if (e.key === 'ArrowDown') go(i + 1); else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(rows.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSwitches(ins, row.slice(0, ins.length)); } }}>
```
- Add `role="grid"` to `<table>` and `aria-label="Truth table rows; arrow keys set the switches"`.
- CSS to append:
  `.truth tbody tr:focus-visible { outline: 3px solid var(--ink); outline-offset: -3px; }`

**Acceptance test:**
- Tab until the active element is a `TR`. Its `className` must be "live".
- Press ArrowDown twice: `.truth tr.live td:first-child` text row index = 2, `Switch B, on` must exist (aria-label), and the active element must be the TR with `data-row="2"`.
- Screenshot and crop the live row. Pillow: in the row's leftmost 3 px column, the ink (#111) pixel count must be at least 60 (the focus ring over the orange).

**Must not change:** the live-row colours, the row heights, the virtualised windowing (`first`/`last`), the click behaviour.

### Quality

#### J-3. Truth table: never cut the last visible row
- **Sources:** R2-11, R1-3 (bottom edge).
- **File:** `src/Truth.jsx`, the effect at lines 44-47 (the one that calls `setBoxH`).

**Current:** `.truth .tt { max-height: calc(360 * var(--u)) }` (theme.css:280). The box ends mid-row: at 1440 it is 713 against a row spanning 671-739.

**New:** in the effect with no dependency list (the one that measures `rowH`), before `setBoxH`:
```js
const head = el.querySelector('thead')?.getBoundingClientRect().height || 0;
el.style.maxHeight = '';                       // re-read the CSS cap
const cap = el.clientHeight >= el.scrollHeight ? null : parseFloat(getComputedStyle(el).maxHeight);
if (cap) el.style.maxHeight = `${head + Math.floor((cap - head) / rowH) * rowH}px`;
```
Keep the CSS max-height as the cap. Do not change `scroll-snap-type`.

**Acceptance test:**
- Add 4 switches (click "Add Switch" x4 with the palette open), close the palette, then wheel +100 three times over `.truth .tt` and wait 700 ms.
- `(tt.getBoundingClientRect().bottom - lastVisibleRow.getBoundingClientRect().bottom)` must be within **±1 px** at 1280, 1440 and 1920.
- Pillow on the crop 5 px above the box bottom across the table width: a hairline or ink rule row is present, and no digit ink touches the box bottom row.

**Must not change:** the header, the row height, the margin-top from ad007aa, the arrow cues.

#### J-4. Error balloons expire
- **Sources:** R1-4, R2-4.
- **File:** `src/App.jsx`: `setReject` (line 47), `setStatus` (line 57), `onPaneClick` (line 281).

**New code:**
```js
useEffect(() => { if (!reject) return; const t = setTimeout(() => setReject(null), TOAST_MS); return () => clearTimeout(t); }, [reject]);
useEffect(() => { if (!status.phrase) return; const t = setTimeout(() => setStatus({ phrase: null, text: '' }), TOAST_MS); return () => clearTimeout(t); }, [status.phrase]);
```
Change `onPaneClick={() => setPalOpen(false)}` to `onPaneClick={() => { setPalOpen(false); setReject(null); }}`.

**Acceptance test:**
- Wire s1→g1.in0, then drag s2→g1.in0. `.say-part` count = 1.
- `waitForTimeout(4300)`: `.say-part` count = **0**.
- For the keyboard version, press Enter on `g1 input 1` with nothing pending: `.say-logo` count = 1, and after 4300 ms it is 0.

**Must not change:** the balloon art, its position, `role=alert`, the phrases.

#### J-5. Added parts never land on another part, and the new part is selected
- **Sources:** R1-6, R2-8, R1-7.
- **File:** `src/App.jsx` `addNode` (lines 121-130) and `onDrop` (lines 131-137).

**New helper**, placed above `addNode`:
```js
const SIZE = { S: [86, 86], L: [114, 114], G: [112, 108] };   // flow units, as measured at zoom 1
const free = (at, kind) => {
  const [w, h] = SIZE[kind];
  const hit = (p) => view.some((n) => { const [nw, nh] = SIZE[n.type] ?? [112, 108];
    return p.x < n.position.x + nw + 20 && p.x + w + 20 > n.position.x && p.y < n.position.y + nh + 20 && p.y + h + 20 > n.position.y; });
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const p = { x: Math.round((at.x + dx * 40) / 20) * 20, y: Math.round((at.y + dy * 40) / 20) * 20 };
    if (!hit(p)) return p; }
  return at;
};
```
- In `addNode`, right before `setCircuit`: `at = free(at, it.kind);`. Delete the `nextNode % 5` nudge; the centre is used unchanged.
- In `setView`: `{ id, type: it.kind, position: at, data: {}, selected: true }`, and set `selected: false` on every existing node: `setView((v) => [...v.map((n) => ({ ...n, selected: false })), {...}])`.
- In `onDrop`, after `addNode(...)`: `setPalOpen(false);` (R2-5: the bar closes after a drop).

**Acceptance test:**
- Open the palette and click "Add Switch" x4, then "Add Lamp".
- Pairwise `.react-flow__node` bounding boxes must have **zero intersection area** (check all pairs).
- The last added node has class `selected`.
- Pillow: the AND gate crop (the node's box) is identical to the baseline apart from wires; that is, ink pixel count within ±2% of `base-1440.png`'s AND crop.

**Must not change:** the drop position when that spot is free, the snap grid, the demo layout.

#### J-6. The truth-table block stays still when the table grows
- **Sources:** R1-8, R2-7.
- **File:** `src/theme.css:271`.

**Current:**
`.truth { display: flex; flex-direction: column; justify-content: center; padding: 0 calc(20 * var(--u)); }`

**New:**
`.truth { display: flex; flex-direction: column; justify-content: flex-start; padding: calc(54 * var(--u)) calc(20 * var(--u)) 0; }`

54u is the measured 2-input label offset: the label cap-top sits at y=318 at 1440, with the cell top at 263 and ≈1u of line-box slack. If after the change the 2-input label cap-top ≠ **318 ±1 px** at 1440, adjust only this 54 until it matches.

Also add inside the `@container … style(--zoomed: 1)` block: `.truth { padding-top: 1.5rem; }`. That block already sets `padding-block: 1.5rem`, so leave its existing line as is and verify.

**Acceptance test:**
- Pillow first-ink row of "TRUTH TABLE" (crop x 980-1250, y 270-360): 2 inputs gives 318±1.
- Add 4 switches: still **318±1**. At 1280: 283±1 and 283±1. At 1920: 424±1 and 424±1. (The values scale by width/1440 from 1440; record the actual baseline first, then require equality ±1.)

**Must not change:** the label and table sizes, the horizontal positions.

#### J-7. The picked (pending) output port is distinct from focus
- **Source:** R1-5.
- **File:** `src/theme.css:239`.

**Current:**
`.react-flow__handle.port.picked { outline: 3px solid var(--ink); outline-offset: 1px; }`

**New:**
```css
.react-flow__handle.port.picked { outline: 3px solid var(--ink); outline-offset: 1px; background: var(--ink); }
.react-flow__handle.port.picked:focus-visible { outline-offset: 4px; }
```
This gives a solid ink square behind the knob, the same inversion idiom as `.pal-tab:hover`.

**Acceptance test:**
- `focus('[data-id="1-s1-out-source"]')`, press Enter, then Tab to `g1 input 1`.
- Pillow on the s1 output handle's 20x20 box: ink ratio **≥ 0.6** (it is ≈0.15 now).
- The g1 input 1 box shows a ring only (ink ratio < 0.4).

**Must not change:** the port hit zones, `connectingto` hover.

#### J-8. Node delete button reachable by keyboard and 44 px hit area
- **Sources:** R1-11, R2-6.
- **File:** `src/theme.css:213-223`.

**Current:**
```css
.node .remove { display: none; border-radius: 50%; }
.react-flow__node:hover .node .remove, .node .remove:focus-visible { display: grid; }
```

**New:**
```css
.node .remove { display: grid; opacity: 0; border-radius: 50%; }
.react-flow__node:hover .node .remove, .react-flow__node.selected .node .remove, .node .remove:focus-visible { opacity: 1; }
.remove { position: relative; }            /* merge into the existing .remove rule */
.remove::after { content: ''; position: absolute; inset: -10px; }   /* 44x44 hit area around the 24px tile */
```
If `.remove` already has `position: absolute` from inline style, do **not** add `position: relative`: `::after` works with absolute.

**Acceptance test:**
- Keyboard: Tab from the AND node; the next Tab stop's aria-label = "Delete AND gate", and Enter removes it (the node count goes down by 1).
- `elementFromPoint(center.x + 20, center.y)` of the remove tile returns the `.remove` button.
- At rest, a Pillow crop of the tile area has no ink tile (ink ratio < 0.05). After a click on a node (selected), the tile shows (ink ratio > 0.5).

**Must not change:** the tile size (24 px visible), the 1/√zoom scaling, the position.

#### J-9. Toasts of the same topic replace each other
- **Source:** R1-24.
- **File:** `src/App.jsx:52-56`.

**Current:**
```js
setToasts((l) => [...l, { id, phrase }]);
```

**New:**
```js
const topic = (p) => p.replace(/(On|Off)$/, '');
setToasts((l) => [...l.filter((t) => topic(t.phrase) !== topic(phrase)), { id, phrase }]);
```

**Acceptance test:**
- Click `.disk` twice within 300 ms: `.toast` count = **1**.
- OCR of the toast region reads "GRID HIDDEN." (Tesseract psm 6 at 3x).

**Must not change:** TOAST_MS, the position, the 20u gap, the art.

#### J-10. Name the canvas region
- **Source:** R2-27 (narrowed).
- **File:** `src/App.jsx:263` `<main …className="cell c-main r2 canvas"`.
- **New:** add `aria-label="Circuit canvas"`.
- **Acceptance test:** `document.querySelector('main').getAttribute('aria-label')` = "Circuit canvas".
- **Must not change:** anything visual.

### Polish

#### J-11. Hide the node delete X while that node speaks
- **Sources:** R1-16, R2-17.
- **File:** `src/nodes/index.jsx`, where `<Remove …>` renders inside gate/lamp/switch nodes.
- **New:** render `<Remove>` only when `!data.reject`. Combined with J-8: `{!data.reject && <Remove … />}`.
- **Acceptance test:** force the pin-taken reject on g1. `.react-flow__node-G .remove` count = 0 while `.say-part` exists.

#### J-12. Keep balloons inside the canvas cell
- **Sources:** R1-18, R2-14.
- **File:** `src/Say.jsx`.
- **New:**
  - After mount, measure the `<p>` against `closest('.canvas').getBoundingClientRect()`.
  - If `top < canvas.top`, add class `flip-y`. If `right > canvas.right`, add class `flip-x`.
  - CSS: `.say.flip-y svg { transform: scaleY(-1); } .say.flip-y .emph, .say.flip-y .rest { transform: scaleY(-1); transform-box: fill-box; transform-origin: center; }` and the same for `flip-x` with scaleX.
  - Also `.say-part.flip-y { --ay: calc(100% + 9px); }`.
- **Acceptance test:**
  - Zoom in 5 wheel steps with the reject shown. The balloon bbox lies fully inside the `.canvas` rect (±1 px).
  - OCR still reads "THAT INPUT / ALREADY HAS / A WIRE!".
- **Must not change:** the balloon at zoom 1 in its default spot (no flip). Verify against `r1/1440-07-reject-balloon.png`: identical crop, ink diff < 1%.

#### J-13. Remove the untokenised colours
- **Sources:** R1-21, R2-20, R1-22, R2-19.
- **File:** `theme.css:125` and `:298`.
  - Line 125: change `background: #000;` to `background: var(--ink);`.
  - Line 298: change `var(--grid, #f2f2f2)` to `var(--hover)`, and add `--hover: #e2e2e2;` to `:root` after `--grid`.
- **Acceptance test:** `grep -nE '#000\b|#f2f2f2' src/theme.css` returns nothing; the hovered row's pixel = (226,226,226).

#### J-14. Reduced motion covers the palette
- **Sources:** R1-19, R2-26.
- **File:** `theme.css:372`.
- **Current:** `@media (prefers-reduced-motion: reduce) { .toast { animation: none; } }`
- **New:** `@media (prefers-reduced-motion: reduce) { .toast { animation: none; } .pal-bar, .palette.open .pal-bar, .palette.open.tucked .pal-bar, .pal-tab { transition: none; } }`
- **Acceptance test:** with `reducedMotion: 'reduce'`, `getComputedStyle(.pal-bar).transitionDuration` = "0s" (or "0s, 0s").

#### J-15. Palette glyph strokes at least 2 px
- **Source:** R2-23.
- **File:** `theme.css:184`.
- **Current:** `.glyph .shape .body { stroke-width: calc(3 * .41 * var(--u)); vector-effect: non-scaling-stroke; }`
- **New:** `stroke-width: max(2px, calc(3 * .41 * var(--u)));`
- **Acceptance test:** with the palette open at 1440, the Pillow horizontal run across the AND glyph's left edge is **≥ 2 px** (it is 1 now) at 1280, 1440 and 1920.

#### J-16. Say why the switch item is disabled
- **Source:** R2-25.
- **File:** `Palette.jsx`, the `pal-item` button.
- **New:** add `title={off ? '13 switches max' : undefined}`.
- **Acceptance test:** add switches until `switchFull`; the item's `title` = "13 switches max".

#### J-17. Row number 01 on the wordmark baseline
- **Source:** R1-14.
- **File:** `theme.css:96`.
- **Current:** `.r1 .rownum { bottom: calc(20 * var(--u)); }`
- **New:** `bottom: calc(12 * var(--u));`. Then measure, and tune only this number until the two baselines match.
- **Acceptance test:** Pillow's last ink row of "01" (x 10-48u) equals the last ink row of the "F" stem (x 70-200u, above the cell rule) **±1 px** at 1280, 1440 and 1920. At 54f0c50 they were 237 vs 245 at 1440.
- **Must not change:** the 02 and 03 positions, the wordmark.

#### J-18. Toast lettering never below 12 px cap
- **Sources:** R1-25, R2-13 (toasts only).
- **File:** `theme.css:364` `.toast { width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u)); …}`
- **New:** replace both `var(--u)` with `max(var(--u), var(--f))`. `--f` is the existing floor unit.
- **Acceptance test:** at 1280, the Pillow cap-height run in the toast is **≥ 12 px** (it is 11 now). At 1440 and 1920 it is unchanged (12 and 17 ±1).

#### J-19. Whole items at the palette fold
- **Source:** R1-26.
- **File:** `src/Palette.jsx`, `measure()`.
- **New:** after measuring, set
  `list.current.style.height = Math.floor((bar.clientHeight - pad) / itemH) * itemH + pad + 'px'`
  where `itemH` is the height of the first `li` of `.pal-group li` and `pad` = 2 × `calc(20u)` of padding (read `getComputedStyle(list).paddingTop` ×2).
- **Acceptance test:** palette open at 1440/1280/1920: every `.pal-item` whose rect intersects the list rect is either fully inside it or fully outside the visible area (no partial `.glyph` intersection > 0 and < 100%).

---

## 3. Decisions for Tony (not built)

- **D-1. Grid disk, R2-9** (heaviest mark on the page, arrow = "go", only toggles the grid; pressed = the arrow rotates 90°):
  - (a) keep it as is;
  - (b) same disk, but a grid glyph (a 3x3 dot lattice) instead of the arrow;
  - (c) the disk becomes the "open parts / start" action, and the grid moves to a small toggle in row 03.
- **D-2. Live-row digit colour, R2-12 / R1-10** (paper on --one = 3.12:1, passes large-text AA by 0.12):
  - (a) keep paper;
  - (b) ink digits on orange (6.06:1);
  - (c) darken --one to about #e84a10 (≈3.8:1). This changes every lit part too.
- **D-3. Pinned lamp columns, R2-29** (sideways scroll hides the outputs, so rows look duplicated):
  - (a) keep it as is;
  - (b) lamp columns `position: sticky; right: 0` behind the heavy switch|lamp rule;
  - (c) cap inputs at 4 visible columns and show an "A-D of A-F" caption.
- **D-4. Purpose of row 03, R1-12 / R2-10:**
  - (a) a help line in the help face: "DRAG A PART · DRAG PIN TO PIN · RIGHT-CLICK DELETES";
  - (b) live counts: "4 PARTS · 3 WIRES · 2 INPUTS";
  - (c) remove the row and give its 60u to row 02.
- **D-5. Starting canvas, R1-13 / R2-18 / R2-5:**
  - (a) keep the unwired demo at x = 26;
  - (b) pre-wire A,B→AND→lamp;
  - (c) (b) plus shift the demo right by 120 flow units so the open palette never covers the switches.
- **D-6. th/td sizes, R1-17** (caps are 23 px vs 26 px, a 13% step inside the locked PR4 table):
  - (a) keep;
  - (b) equalise the caps to 26 px;
  - (c) widen the step to ≥ 1.25x.
- **D-7. Side-column edges, R2-15 / R2-16:** the lockup's right edge is at 1400 vs the table at 1417, and the table rules start at 981 vs the label at 985. Both belong to fitted lockup/PR4 geometry.
  - (a) keep;
  - (b) pull the table to 985-1400;
  - (c) retrack the lockup to end at 1417.
- **D-8. Spacing module, R1-20 / R2-21:**
  - (a) keep the ref3 optical fits;
  - (b) snap the non-type spacing (26, 29, 74u…) to the 20u canvas module;
  - (c) document them as a ref-fit table and leave them.
- **D-9. Palette tab at 1280, R1-15 / R2-28** (the 44 px floor overlaps the bar's glyph column when open):
  - (a) keep;
  - (b) when open, sit the tab fully outside the bar's rule;
  - (c) lower the floor to 36 px (fails the 44 px target guideline).

## 4. Out of scope / rejected

- **R1-23 (pure white paper):** locked palette.
- **R2-22:** informational only. OCR confirms the fitted type is legible.
- **R1-9 (row-hover contrast 1.30:1):** hover is non-essential, so no WCAG requirement applies. The token part is covered by J-13.
- **R1-3 (top-edge half-row):** fixed by ad007aa plus the existing snap. Re-test: the top row lands whole after a wheel scroll.
- **Balloon lettering size (R2-13, balloon part):** measured 12-13 px caps at 1440, which is legible (OCR exact). The lettering is locked art.
- **R2-1 as "cannot add parts":** rejected as worded, because Shift+Tab + Enter adds a part. The real defect is built as J-1.
- **R2-3 as a standalone missing handler:** the handler exists. The global-Escape fix is in J-1.
- **Changing scroll-snap to mandatory:** rejected. The code comment (theme.css:297) records that mandatory snaps back with windowed rows. J-3 fixes the cut row with box sizing instead.
