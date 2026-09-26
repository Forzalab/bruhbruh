import { test } from 'node:test';
import assert from 'node:assert/strict';
import { route, bends, clear, segHitsBox, stepPoints, MAX_BENDS } from './route.js';

const box = (x, y, w, h) => ({ x, y, w, h });

test('segHitsBox: interior yes, edge/outside no', () => {
  const b = box(0, 0, 10, 10);
  assert.equal(segHitsBox([-5, 5], [15, 5], b), true);
  assert.equal(segHitsBox([-5, 0], [15, 0], b), false);
  assert.equal(segHitsBox([12, -5], [12, 15], b), false);
});

test('straight forward wire at same height: 0 bends', () => {
  const p = route([100, 50], [300, 50], { src: box(0, 0, 100, 100), dst: box(300, 0, 100, 100) });
  assert.deepEqual(p, [[100, 50], [300, 50]]);
});

test('forward wire at different heights: 2 bends', () => {
  const p = route([100, 50], [300, 150], { src: box(0, 0, 100, 100), dst: box(300, 100, 100, 100) });
  assert.equal(bends(p), 2);
});

test('backward wire (target left of source): 4 bends, clears both boxes', () => {
  const src = box(300, 0, 100, 100), dst = box(0, 200, 100, 100);
  const p = route([400, 50], [0, 250], { src, dst });
  assert.ok(p); assert.equal(bends(p), 4);
  assert.ok(clear(p, [src, dst]));
  assert.ok(p[1][0] > 400 && p.at(-2)[0] < 0, 'leaves right, enters from left');
});

test('node dropped on a wire: route detours around it', () => {
  const blocker = box(180, 0, 60, 100);
  assert.equal(clear(stepPoints([100, 50], [400, 50]), [blocker]), false);
  const p = route([100, 50], [400, 50], { src: box(0, 0, 100, 100), dst: box(400, 0, 100, 100), others: [blocker] });
  assert.ok(p); assert.ok(bends(p) <= MAX_BENDS);
  assert.ok(clear(p, [blocker]));
});

test('beyond the cap: null (caller falls back to a step path)', () => {
  // target boxed in on all sides except the left
  const others = [box(200, -400, 100, 380), box(200, 120, 100, 380)];
  assert.equal(route([100, 50], [400, 50], { src: box(0, 0, 100, 100), dst: box(400, 0, 100, 100), others: [...others, box(320, -10, 60, 120)] }), null);
  assert.equal(route([400, 50], [0, 250], { src: box(300, 0, 100, 100), dst: box(0, 200, 100, 100) }, 2), null);
});

test('overlapping source and target boxes: never throws', () => {
  const p = route([100, 50], [90, 60], { src: box(0, 0, 100, 100), dst: box(90, 10, 100, 100) });
  assert.ok(p === null || bends(p) <= MAX_BENDS);
});

test('pin inside its own padded box still routes', () => {
  const p = route([95, 50], [310, 150], { src: box(0, 0, 110, 100), dst: box(300, 100, 100, 100), others: [box(150, 0, 60, 100)] });
  assert.ok(p); assert.ok(clear(p, [{ x: 136, y: -14, w: 88, h: 128 }]));
});

// img8 (Tony): S2 sits 20px left of a NAND, its wire folded back under the switch and into the NAND body.
// Boxes as measured at zoom 1: switch 86x86 (out pin y 43), gate 112x108 (inputs y 33 / 75).
import { legal, GAP_PAPER } from './route.js';
const PAD = 12, STROKE = 3;
const body = (b) => ({ x: b.x + PAD, y: b.y + PAD, w: b.w - 2 * PAD, h: b.h - 2 * PAD }); // outline centreline rect
const segRectDist = ([ax, ay], [bx, by], r) => { // axis-aligned segment to rectangle, 0 if touching
  const dx = Math.max(r.x - Math.max(ax, bx), Math.min(ax, bx) - (r.x + r.w), 0);
  const dy = Math.max(r.y - Math.max(ay, by), Math.min(ay, by) - (r.y + r.h), 0);
  return Math.hypot(dx, dy);
};
function img8(gateX) {
  const s1 = box(0, 0, 86, 86), s2 = box(0, 120, 86, 86), g = box(gateX, 60, 112, 108);
  return { s1, s2, g, wires: [
    { s: [86, 43], t: [gateX, 93], src: s1, dst: g, others: [s2] },
    { s: [86, 163], t: [gateX, 135], src: s2, dst: g, others: [s1] }] };
}
const nudge = (ok) => { for (let x = 106; x < 106 + 12 * 40; x += 20) if (ok(x)) return x; return null; };

test('img8: parts 20px apart get no illegal route; nudge finds a spot with >= 20px paper, no ink in bodies', () => {
  const at20 = img8(106);
  assert.ok(at20.wires.some((w) => route(w.s, w.t, w) === null), 'the 20px gap has no legal route, so the drop nudges');
  const x = nudge((gx) => img8(gx).wires.every((w) => route(w.s, w.t, w)));
  assert.ok(x != null && x > 106);
  const sc = img8(x);
  for (const w of sc.wires) {
    const p = route(w.s, w.t, w);
    assert.ok(legal(p, w, []));
    assert.ok(p.at(-2)[0] < p.at(-1)[0] && p.at(-2)[1] === p.at(-1)[1], 'input entered from the left');
    for (const b of [sc.s1, sc.s2, sc.g]) for (let i = 1; i < p.length; i++) {
      const d = segRectDist(p[i - 1], p[i], body(b)) - STROKE;
      const pinRun = (i === 1 && b === w.src) || (i === p.length - 1 && b === w.dst);
      assert.ok(d > 0 || pinRun, 'no ink inside a body');
      if (!pinRun) assert.ok(d >= GAP_PAPER, `paper gap ${d} >= ${GAP_PAPER}`);
    }
  }
});

test('clearance covers the own source body: no fold back under the source', () => {
  const src = box(0, 0, 86, 86), dst = box(106, 200, 112, 108);
  const p = route([86, 43], [106, 233], { src, dst });
  if (p) for (let i = 2; i < p.length - 1; i++) assert.ok(segRectDist(p[i - 1], p[i], body(src)) - STROKE >= GAP_PAPER);
});
