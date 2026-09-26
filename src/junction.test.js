import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeAll, shares } from './junction.js';

const box = (x, y, w, h) => ({ x, y, w, h });
test('fan-out: siblings share one trunk and get a dot where they split, none on the knob', () => {
  const src = box(0, 100, 86, 86), g1 = box(300, 0, 112, 108), g2 = box(300, 200, 112, 108);
  const list = [
    { id: 'a', source: 's', s: [86, 143], t: [300, 33], src, dst: g1, others: [g2] },
    { id: 'b', source: 's', s: [86, 143], t: [300, 233], src, dst: g2, others: [g1] }];
  const r = routeAll(list);
  assert.equal(r.a[1][0], r.b[1][0], 'same corner x');
  const sh = shares(r, { a: { source: 's', on: true }, b: { source: 's', on: true } });
  assert.ok(sh.a.runs.length > 0 && sh.a.runs.every((x) => x.same));
  assert.equal(sh.a.dots.length, 1);
  assert.deepEqual(sh.a.dots[0], [r.a[1][0], 143]);
});
test('different nets on one run: mixed when the states differ', () => {
  const r = { a: [[0, 0], [50, 0], [50, 100], [90, 100]], b: [[20, 60], [50, 60], [50, 100], [90, 100]] };
  const sh = shares(r, { a: { source: 'x', on: true }, b: { source: 'y', on: false } });
  assert.ok(sh.a.runs.some((x) => x.mix));
  assert.deepEqual(sh.a.dots, [[50, 60]]);
});
