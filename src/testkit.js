// testkit.js — tiny pure-data circuit builder for tests (no UI, no React). Every wire goes through canConnect,
// exactly like App.onConnect, so a test circuit can never contain something the UI would have refused.
import { canConnect, canAddSwitch, evaluate } from './sim.js';

export function builder() {
  const c = { nodes: {}, wires: {} };
  let n = 0, w = 0;
  const b = {
    circuit: c,
    sw(id = `s${n++}`) {
      const ok = canAddSwitch(c);
      if (!ok.ok) throw new Error(ok.reason);
      c.nodes[id] = { id, kind: 'S', value: false };
      return id;
    },
    gate(type, id = `g${n++}`) { c.nodes[id] = { id, kind: 'G', type }; return id; },
    lamp(id = `l${n++}`) { c.nodes[id] = { id, kind: 'L' }; return id; },
    wire(source, target, pin = 0) {
      const chk = canConnect(c, source, target, pin);
      if (!chk.ok) throw new Error(`wire ${source}->${target}.${pin}: ${chk.reason}`);
      const id = `w${w++}`;
      c.wires[id] = { id, source, target, pin };
      return id;
    },
    // gate with its inputs wired in one go: b.g('AND', x, y)
    g(type, ...ins) { const id = b.gate(type); ins.forEach((s, i) => b.wire(s, id, i)); return id; },
    // lamp wired from src
    out(src, id) { const l = b.lamp(id); b.wire(src, l, 0); return l; },
    remove(ids) { // mirrors App.removeNodes
      ids = [].concat(ids);
      for (const id of ids) delete c.nodes[id];
      for (const [k, x] of Object.entries(c.wires)) if (ids.includes(x.source) || ids.includes(x.target)) delete c.wires[k];
    },
  };
  return b;
}

// Set switches (MSB = ins[0], same convention as Truth.jsx) to row r and evaluate.
export function run(circuit, ins, r) {
  const n = ins.length;
  const nodes = { ...circuit.nodes };
  ins.forEach((id, i) => { nodes[id] = { ...nodes[id], value: !!((r >> (n - 1 - i)) & 1) }; });
  return evaluate({ ...circuit, nodes });
}

// Exhaustively compare lamps against ref(bits[]) -> { lampId: bool }. Returns number of rows checked.
export function exhaust(assert, circuit, ins, ref, label = '') {
  const n = ins.length;
  for (let r = 0; r < 2 ** n; r++) {
    const bits = ins.map((_, i) => !!((r >> (n - 1 - i)) & 1));
    const got = run(circuit, ins, r), want = ref(bits);
    for (const [id, v] of Object.entries(want)) {
      assert.equal(!!got[id], v, `${label} lamp ${id} row ${r} bits=${bits.map(Number).join('')}`);
    }
  }
  return 2 ** n;
}
