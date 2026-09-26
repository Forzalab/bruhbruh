import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossings, hopPath, BEND_CLEAR } from './hop.js';

const sw = 3;
test('a clear crossing hops: horizontal bridges over a foreign vertical', () => {
  const mine = [[0, 100], [200, 100]], other = [[100, 0], [100, 200]];
  const c = crossings(mine, [other], sw);
  assert.equal(c.length, 1); assert.ok(c[0].ok);
  const d = hopPath(mine, c, sw);
  assert.equal(d, 'M0 100L85 100L94 91L106 91L115 100L200 100'); // footprint 5sw, rise 3sw (45deg), flat top 2sw each side
});
test('a crossing near a bend stays plain', () => {
  const mine = [[0, 100], [100 + 5 * sw + BEND_CLEAR - 1, 100]], other = [[100, 0], [100, 200]];
  const c = crossings(mine, [other], sw);
  assert.equal(c.length, 1); assert.equal(c[0].ok, false);
  assert.equal(hopPath(mine, c, sw), `M0 100L${mine[1][0]} 100`);
});
test('verticals never hop and touching ends are not crossings', () => {
  assert.equal(crossings([[100, 0], [100, 200]], [[[0, 100], [200, 100]]], sw).length, 0);
  assert.equal(crossings([[0, 100], [100, 100]], [[[100, 0], [100, 200]]], sw).length, 0);
});
