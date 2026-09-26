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
