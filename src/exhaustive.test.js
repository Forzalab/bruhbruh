// Exhaustive correctness: every circuit below is checked on ALL 2^n switch combinations against a reference
// boolean function written independently of sim.GATES.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GATES, MAX_SWITCHES, evaluate } from './sim.js';
import { builder, exhaust, run } from './testkit.js';

// Independent reference truth functions (NOT GATES[..].fn, so a typo in sim.js cannot hide itself).
const REF = {
  AND: (a, b) => (a ? b : false),
  OR: (a, b) => (a ? true : b),
  NOT: (a) => (a ? false : true),
  NAND: (a, b) => !(a ? b : false),
  NOR: (a, b) => !(a ? true : b),
  XOR: (a, b) => (a ? !b : b),
};

test('GATES table has exactly the six expected gates with correct pin counts', () => {
  assert.deepEqual(Object.keys(GATES).sort(), Object.keys(REF).sort());
  for (const t of Object.keys(REF)) assert.equal(GATES[t].pins, t === 'NOT' ? 1 : 2, t);
});

for (const type of Object.keys(REF)) {
  const pins = GATES[type].pins;
  test(`${type}: full truth table, pins in order`, () => {
    const b = builder();
    const ins = Array.from({ length: pins }, () => b.sw());
    const L = b.out(b.g(type, ...ins));
    assert.equal(exhaust(assert, b.circuit, ins, (x) => ({ [L]: REF[type](...x) }), type), 2 ** pins);
  });
  if (pins === 2) {
    test(`${type}: pins wired swapped (A->pin1, B->pin0)`, () => {
      const b = builder();
      const A = b.sw(), B = b.sw(), g = b.gate(type);
      b.wire(A, g, 1); b.wire(B, g, 0);
      const L = b.out(g);
      exhaust(assert, b.circuit, [A, B], ([a, bb]) => ({ [L]: REF[type](bb, a) }));
    });
    test(`${type}: same switch into both pins (diamond)`, () => {
      const b = builder();
      const A = b.sw(), L = b.out(b.g(type, A, A));
      exhaust(assert, b.circuit, [A], ([a]) => ({ [L]: REF[type](a, a) }));
    });
    for (const pin of [0, 1]) {
      test(`${type}: only pin ${pin} wired, other floats as 0`, () => {
        const b = builder();
        const A = b.sw(), g = b.gate(type);
        b.wire(A, g, pin);
        const L = b.out(g);
        exhaust(assert, b.circuit, [A], ([a]) => ({ [L]: pin === 0 ? REF[type](a, false) : REF[type](false, a) }));
      });
    }
  }
}

test('every gate type, entirely unconnected, feeding a lamp: output = f(0,0)', () => {
  for (const type of Object.keys(REF)) {
    const b = builder();
    const L = b.out(b.gate(type));
    assert.equal(evaluate(b.circuit)[L], REF[type](false, false), type);
  }
});

test('half adder (XOR + AND), 4 rows', () => {
  const b = builder();
  const A = b.sw(), B = b.sw();
  const S = b.out(b.g('XOR', A, B)), C = b.out(b.g('AND', A, B));
  exhaust(assert, b.circuit, [A, B], ([a, bb]) => ({ [S]: a !== bb, [C]: a && bb }));
});

// Full adder built as two half adders + OR; returns { s, c } node ids.
const fullAdder = (b, a, x, cin) => {
  const h1 = b.g('XOR', a, x), c1 = b.g('AND', a, x);
  const s = b.g('XOR', h1, cin), c2 = b.g('AND', h1, cin);
  return { s, c: b.g('OR', c1, c2) };
};

test('full adder, 8 rows: {Cout,S} = A+B+Cin', () => {
  const b = builder();
  const A = b.sw(), B = b.sw(), Ci = b.sw();
  const { s, c } = fullAdder(b, A, B, Ci);
  const S = b.out(s), C = b.out(c);
  exhaust(assert, b.circuit, [A, B, Ci], (x) => { const n = x.filter(Boolean).length; return { [S]: !!(n & 1), [C]: n >= 2 }; });
});

test('XOR built only from 4 NANDs, 4 rows', () => {
  const b = builder();
  const A = b.sw(), B = b.sw();
  const n1 = b.g('NAND', A, B), n2 = b.g('NAND', A, n1), n3 = b.g('NAND', n1, B);
  const L = b.out(b.g('NAND', n2, n3));
  exhaust(assert, b.circuit, [A, B], ([a, bb]) => ({ [L]: a !== bb }));
});

test('NOT, AND, OR each built only from NOR (universality), all rows', () => {
  const b = builder();
  const A = b.sw(), B = b.sw();
  const nA = b.g('NOR', A, A), nB = b.g('NOR', B, B);
  const LN = b.out(nA);
  const LO = b.out(b.g('NOR', b.g('NOR', A, B), b.g('NOR', A, B)));
  const LA = b.out(b.g('NOR', nA, nB));
  exhaust(assert, b.circuit, [A, B], ([a, bb]) => ({ [LN]: !a, [LO]: a || bb, [LA]: a && bb }));
});

test('2:1 mux from AND/OR/NOT, 8 rows', () => {
  const b = builder();
  const Sel = b.sw(), A = b.sw(), B = b.sw();
  const L = b.out(b.g('OR', b.g('AND', A, b.g('NOT', Sel)), b.g('AND', B, Sel)));
  exhaust(assert, b.circuit, [Sel, A, B], ([s, a, bb]) => ({ [L]: s ? bb : a }));
});

test('4:1 mux, 6 switches, 64 rows', () => {
  const b = builder();
  const S1 = b.sw(), S0 = b.sw(), D = [b.sw(), b.sw(), b.sw(), b.sw()];
  const n1 = b.g('NOT', S1), n0 = b.g('NOT', S0);
  const sel = [[n1, n0], [n1, S0], [S1, n0], [S1, S0]];
  const terms = D.map((d, i) => b.g('AND', d, b.g('AND', ...sel[i])));
  const L = b.out(b.g('OR', b.g('OR', terms[0], terms[1]), b.g('OR', terms[2], terms[3])));
  exhaust(assert, b.circuit, [S1, S0, ...D], ([s1, s0, ...d]) => ({ [L]: d[(s1 ? 2 : 0) + (s0 ? 1 : 0)] }));
});

test('NOT chain parity: lengths 0..60', () => {
  for (let len = 0; len <= 60; len++) {
    const b = builder();
    const A = b.sw();
    let cur = A;
    for (let i = 0; i < len; i++) cur = b.g('NOT', cur);
    const L = b.out(cur);
    exhaust(assert, b.circuit, [A], ([a]) => ({ [L]: len % 2 ? !a : a }), `len ${len}`);
  }
});

test('fan-out: one switch drives 20 lamps directly and via buffers', () => {
  const b = builder();
  const A = b.sw();
  const direct = Array.from({ length: 10 }, () => b.out(A));
  const inv = Array.from({ length: 10 }, () => b.out(b.g('NOT', A)));
  exhaust(assert, b.circuit, [A], ([a]) => Object.fromEntries([...direct.map((l) => [l, a]), ...inv.map((l) => [l, !a])]));
});

test('lamp wired straight from a switch mirrors it', () => {
  const b = builder();
  const A = b.sw(), L = b.out(A);
  exhaust(assert, b.circuit, [A], ([a]) => ({ [L]: a }));
});

// 13-switch circuits: 8192 rows each. Balanced trees keep runtime sane (see TESTS-A.md BUG-1: evaluate() is
// super-linear, a left-deep 13-input chain costs ~1.5 ms/row and the three chains together took 80 s).
for (const [type, ref] of [['AND', (x) => x.every(Boolean)], ['OR', (x) => x.some(Boolean)], ['XOR', (x) => x.filter(Boolean).length % 2 === 1]]) {
  test(`${MAX_SWITCHES}-input balanced ${type} tree, all 8192 rows`, () => {
    const b = builder();
    const ins = Array.from({ length: MAX_SWITCHES }, () => b.sw());
    const bal = (xs) => (xs.length === 1 ? xs[0] : b.g(type, bal(xs.slice(0, xs.length >> 1)), bal(xs.slice(xs.length >> 1))));
    const L = b.out(bal(ins));
    assert.equal(exhaust(assert, b.circuit, ins, (x) => ({ [L]: ref(x) })), 8192);
  });
}

test('4-bit + 4-bit ripple-carry adder with carry-in (9 switches, 5 lamps), all 512 rows', () => {
  const W = 4;
  const b = builder();
  const A = Array.from({ length: W }, () => b.sw()), B = Array.from({ length: W }, () => b.sw()), Ci = b.sw();
  let carry = Ci; const sums = [];
  for (let i = W - 1; i >= 0; i--) { const fa = fullAdder(b, A[i], B[i], carry); sums[i] = b.out(fa.s); carry = fa.c; }
  const Co = b.out(carry);
  exhaust(assert, b.circuit, [...A, ...B, Ci], (x) => {
    const num = (bs) => bs.reduce((acc, v) => acc * 2 + (v ? 1 : 0), 0);
    const total = num(x.slice(0, W)) + num(x.slice(W, 2 * W)) + (x[2 * W] ? 1 : 0);
    const want = { [Co]: total >= 2 ** W };
    sums.forEach((l, i) => { want[l] = !!((total >> (W - 1 - i)) & 1); });
    return want;
  });
});

// Fuzz: random DAGs (built only through canConnect) vs an independent pull-based memoised reference evaluator.
function refEval(circuit) {
  const memo = {};
  const val = (id) => {
    if (id in memo) return memo[id];
    const n = circuit.nodes[id];
    const inp = (pin) => { const w = Object.values(circuit.wires).find((x) => x.target === id && x.pin === pin); return w ? val(w.source) : false; };
    let v;
    if (n.kind === 'S') v = !!n.value;
    else if (n.kind === 'L') v = inp(0);
    else v = REF[n.type](inp(0), inp(1));
    return (memo[id] = v);
  };
  return Object.fromEntries(Object.keys(circuit.nodes).map((id) => [id, val(id)]));
}

test('fuzz: 300 random DAG circuits (1..8 switches, floating pins, fan-out), every row, every node', () => {
  let seed = 12345;
  const rnd = (k) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % k; };
  const types = Object.keys(REF);
  for (let t = 0; t < 300; t++) {
    const b = builder();
    const ins = Array.from({ length: 1 + rnd(8) }, () => b.sw());
    const pool = [...ins];
    const gates = [];
    const ng = rnd(15);
    for (let i = 0; i < ng; i++) {
      const g = b.gate(types[rnd(types.length)]);
      gates.push(g);
      for (let p = 0; p < GATES[b.circuit.nodes[g].type].pins; p++) if (rnd(6)) b.wire(pool[rnd(pool.length)], g, p); // ~1/6 pins left floating
      pool.push(g);
    }
    // Shuffle node insertion order so evaluate() cannot rely on nodes being listed in topological order.
    const entries = Object.entries(b.circuit.nodes);
    for (let i = entries.length - 1; i > 0; i--) { const j = rnd(i + 1); [entries[i], entries[j]] = [entries[j], entries[i]]; }
    b.circuit.nodes = Object.fromEntries(entries);
    const lamps = Array.from({ length: 1 + rnd(3) }, () => b.out(pool[rnd(pool.length)]));
    b.lamp(); // plus one unwired lamp
    for (let r = 0; r < 2 ** ins.length; r++) {
      const got = run(b.circuit, ins, r);
      const nodes = { ...b.circuit.nodes };
      ins.forEach((id, i) => { nodes[id] = { ...nodes[id], value: !!((r >> (ins.length - 1 - i)) & 1) }; });
      const want = refEval({ ...b.circuit, nodes });
      for (const id of [...ins, ...gates, ...lamps]) assert.equal(!!got[id], want[id], `circuit ${t} row ${r} node ${id}`);
    }
  }
});
