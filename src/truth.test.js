// Truth.jsx row derivation vs sim.evaluate.
// Truth.jsx keeps its row logic INSIDE the React component (useMemo + JSX file), so node --test cannot import it.
// Until it is extracted (see TESTS-A.md, "Truth.jsx refactor"), this file tests a verbatim copy of that logic and a
// drift guard fails if the copied lines change in Truth.jsx.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate } from './sim.js';
import { builder } from './testkit.js';

// ---- verbatim copy of Truth.jsx lines (only `ins`/`outs` made parameters) ----
const byPos = (circuit, view, kind) => view.filter((n) => circuit.nodes[n.id]?.kind === kind)
  .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).map((n) => n.id);
function truthRows(circuit, ins, outs) {
  const n = ins.length, all = [];
  for (let r = 0; r < 2 ** n; r++) {
    const bits = ins.map((_, i) => (r >> (n - 1 - i)) & 1);
    const nodes = { ...circuit.nodes };
    ins.forEach((id, i) => { nodes[id] = { ...nodes[id], value: !!bits[i] }; });
    const v = evaluate({ ...circuit, nodes });
    all.push([...bits, ...outs.map((id) => +!!v[id])]);
  }
  return all;
}
const liveRow = (circuit, ins) => ins.reduce((acc, id) => acc * 2 + (circuit.nodes[id].value ? 1 : 0), 0);
// ---------------------------------------------------------------------------

test('drift guard: the copied lines still appear verbatim in Truth.jsx', () => {
  const src = readFileSync(new URL('./Truth.jsx', import.meta.url), 'utf8');
  for (const line of [
    ".sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).map((n) => n.id);",
    'for (let r = 0; r < 2 ** n; r++) {',
    'const bits = ins.map((_, i) => (r >> (n - 1 - i)) & 1);',
    'ins.forEach((id, i) => { nodes[id] = { ...nodes[id], value: !!bits[i] }; });',
    'const v = evaluate({ ...circuit, nodes });',
    'all.push([...bits, ...outs.map((id) => +!!v[id])]);',
    "const live = ins.reduce((acc, id) => acc * 2 + (circuit.nodes[id].value ? 1 : 0), 0);",
  ]) assert.ok(src.includes(line), `Truth.jsx changed: ${line}`);
});

// Build a circuit plus a React-Flow-like view with positions.
const withView = (b, pos) => Object.entries(pos).map(([id, [x, y]]) => ({ id, position: { x, y } }));

test('ordering: switches top-to-bottom then left-to-right; lamps likewise; MSB = top switch', () => {
  const b = builder();
  const A = b.sw('A'), B = b.sw('B'), C = b.sw('C');
  const L1 = b.out(b.g('AND', A, B), 'L1'), L2 = b.out(C, 'L2');
  b.lamp('L3'); // unwired lamp
  // C is on top, then A and B on the same row (A left of B). Lamps: L2 top, L3, L1 bottom.
  const view = withView(b, { A: [0, 100], B: [50, 100], C: [0, 0], L1: [500, 300], L2: [500, 0], L3: [500, 150], g0: [200, 100] });
  const ins = byPos(b.circuit, view, 'S'), outs = byPos(b.circuit, view, 'L');
  assert.deepEqual(ins, ['C', 'A', 'B']);
  assert.deepEqual(outs, ['L2', 'L3', 'L1']);
  const rows = truthRows(b.circuit, ins, outs);
  assert.equal(rows.length, 8);
  // row 4 = 100 -> C=1, A=0, B=0 -> L2=1, L3=0, L1=0
  assert.deepEqual(rows[4], [1, 0, 0, 1, 0, 0]);
  assert.deepEqual(rows[3], [0, 1, 1, 0, 0, 1]);
});

test('every row equals a fresh evaluate() with those switch values, and the live row matches the switches', () => {
  const b = builder();
  const ins = Array.from({ length: 5 }, () => b.sw());
  const g1 = b.g('XOR', ins[0], ins[1]), g2 = b.g('NAND', g1, ins[2]), g3 = b.g('NOR', ins[3], ins[4]);
  const outs = [b.out(g2), b.out(g3), b.out(b.g('OR', g2, g3)), b.lamp()];
  const rows = truthRows(b.circuit, ins, outs);
  assert.equal(rows.length, 32);
  rows.forEach((row, r) => {
    const c = structuredClone(b.circuit);
    ins.forEach((id, i) => { c.nodes[id].value = row[i] === 1; });
    const v = evaluate(c);
    assert.deepEqual(row.slice(ins.length), outs.map((id) => (v[id] ? 1 : 0)), `row ${r}`);
    assert.equal(liveRow(c, ins), r, `live row for row ${r}`);
    // row bits really encode r, MSB first
    assert.equal(parseInt(row.slice(0, ins.length).join(''), 2), r);
  });
});

test('rows ignore the current switch values (table is the same whatever is toggled)', () => {
  const b = builder(); const A = b.sw(), B = b.sw(); const L = b.out(b.g('AND', A, B));
  const t0 = truthRows(b.circuit, [A, B], [L]);
  b.circuit.nodes[A].value = true; b.circuit.nodes[B].value = true;
  assert.deepEqual(truthRows(b.circuit, [A, B], [L]), t0);
  assert.deepEqual(t0, [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]]);
});

test('degenerate shapes: no switches -> one row of outputs; no lamps -> input columns only', () => {
  const b = builder(); const L = b.out(b.gate('NOT'));
  assert.deepEqual(truthRows(b.circuit, [], [L]), [[1]]);
  const c = builder(); const A = c.sw();
  assert.deepEqual(truthRows(c.circuit, [A], []), [[0], [1]]);
});

test('13 switches -> 8192 rows, each row width 13 + lamps, all distinct input patterns', () => {
  const b = builder(); const ins = Array.from({ length: 13 }, () => b.sw());
  const outs = ins.map((s) => b.out(s));
  const rows = truthRows(b.circuit, ins, outs);
  assert.equal(rows.length, 8192);
  assert.equal(new Set(rows.map((r) => r.slice(0, 13).join(''))).size, 8192);
  for (const r of rows) assert.deepEqual(r.slice(13), r.slice(0, 13)); // lamp i mirrors switch i
});
