import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canConnect, canAddSwitch, evaluate, MAX_SWITCHES } from './sim.js';

const circuit = (nodes, wires = []) => ({
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
  wires: Object.fromEntries(wires.map((w, i) => [`w${i}`, { id: `w${i}`, ...w }])),
});

test('AND truth table drives the lamp', () => {
  for (const [a, b, want] of [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]]) {
    const c = circuit(
      [
        { id: 'A', kind: 'S', value: !!a },
        { id: 'B', kind: 'S', value: !!b },
        { id: 'g', kind: 'G', type: 'AND' },
        { id: 'L', kind: 'L' },
      ],
      [
        { source: 'A', target: 'g', pin: 0 },
        { source: 'B', target: 'g', pin: 1 },
        { source: 'g', target: 'L', pin: 0 },
      ],
    );
    assert.equal(evaluate(c).L, !!want, `A=${a} B=${b}`);
  }
});

// One gate driving the lamp from A and B (or just A for NOT), checked against its full truth table.
const truthTable = (type, table) => {
  test(`${type} truth table drives the lamp`, () => {
    for (const [a, b, want] of table) {
      const nodes = [
        { id: 'A', kind: 'S', value: !!a },
        { id: 'g', kind: 'G', type },
        { id: 'L', kind: 'L' },
      ];
      const wires = [{ source: 'A', target: 'g', pin: 0 }, { source: 'g', target: 'L', pin: 0 }];
      if (b !== undefined) {
        nodes.splice(1, 0, { id: 'B', kind: 'S', value: !!b });
        wires.push({ source: 'B', target: 'g', pin: 1 });
      }
      const c = circuit(nodes, wires);
      assert.equal(evaluate(c).L, !!want, `A=${a} B=${b}`);
    }
  });
};

truthTable('OR', [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]]);
truthTable('NOT', [[0, undefined, 1], [1, undefined, 0]]);
truthTable('NAND', [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]]);
truthTable('NOR', [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 0]]);
truthTable('XOR', [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]]);

test('canAddSwitch refuses a 14th switch', () => {
  const nodes = Array.from({ length: MAX_SWITCHES - 1 }, (_, i) => ({ id: `s${i}`, kind: 'S', value: false }));
  const c = circuit(nodes);
  assert.equal(canAddSwitch(c).ok, true); // 12 switches: room for one more
  nodes.push({ id: `s${MAX_SWITCHES - 1}`, kind: 'S', value: false });
  const full = circuit(nodes); // 13 switches: at the cap
  assert.equal(canAddSwitch(full).ok, false);
  assert.equal(canAddSwitch(full).reason, `only ${MAX_SWITCHES} switches allowed`);
});

test('diamond (one switch into both AND pins) is not a loop', () => {
  const c = circuit(
    [
      { id: 'S', kind: 'S', value: true },
      { id: 'g', kind: 'G', type: 'AND' },
      { id: 'L', kind: 'L' },
    ],
    [
      { source: 'S', target: 'g', pin: 0 },
      { source: 'g', target: 'L', pin: 0 },
    ],
  );
  assert.equal(canConnect(c, 'S', 'g', 1).ok, true);
  c.wires.w9 = { id: 'w9', source: 'S', target: 'g', pin: 1 };
  assert.equal(evaluate(c).L, true);
});

test('loops are rejected at connect time', () => {
  const c = circuit([{ id: 'g', kind: 'G', type: 'AND' }, { id: 'h', kind: 'G', type: 'AND' }], [
    { source: 'g', target: 'h', pin: 0 },
  ]);
  assert.equal(canConnect(c, 'g', 'g', 0).reason, 'loop');
  assert.equal(canConnect(c, 'h', 'g', 0).reason, 'loop');
});

test('one wire per pin, no wiring into switches or out of lamps', () => {
  const c = circuit(
    [{ id: 'S', kind: 'S' }, { id: 'g', kind: 'G', type: 'AND' }, { id: 'L', kind: 'L' }],
    [{ source: 'S', target: 'g', pin: 0 }],
  );
  assert.equal(canConnect(c, 'S', 'g', 0).reason, 'pin taken');
  assert.equal(canConnect(c, 'g', 'S', 0).reason, 'switch has no input');
  assert.equal(canConnect(c, 'L', 'g', 1).reason, 'lamp has no output');
});
