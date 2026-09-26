// sim.js — pure circuit logic. No UI, no DOM, no dating.
//
// circuit = {
//   nodes: { [id]: { id, kind: 'S' | 'G' | 'L', type?: 'AND' | ..., value?: bool } },
//   wires: { [id]: { id, source, target, pin } }   // source = node id, pin = target input index
// }
// S = switch (output only), G = gate (in + out), L = lamp (input only).

export const GATES = {
  AND:  { pins: 2, fn: (a, b) => a && b },
  OR:   { pins: 2, fn: (a, b) => a || b },
  NOT:  { pins: 1, fn: (a) => !a },
  NAND: { pins: 2, fn: (a, b) => !(a && b) },
  NOR:  { pins: 2, fn: (a, b) => !(a || b) },
  XOR:  { pins: 2, fn: (a, b) => a !== b },
};

// Input-switch cap: kept as sim-level policy so any future "add switch" UI can check it the same
// way canConnect is checked before wiring. No add-switch UI exists yet (see App.jsx START/VIEW).
export const MAX_SWITCHES = 13;
export function canAddSwitch(circuit) {
  const count = Object.values(circuit.nodes).filter((n) => n.kind === 'S').length;
  if (count >= MAX_SWITCHES) return { ok: false, reason: `only ${MAX_SWITCHES} switches allowed` };
  return { ok: true };
}

export function pinCount(node) {
  if (node.kind === 'S') return 0;
  if (node.kind === 'L') return 1;
  return GATES[node.type].pins;
}

const wiresFrom = (circuit, id) =>
  Object.values(circuit.wires).filter((w) => w.source === id);

const wiresInto = (circuit, id) =>
  Object.values(circuit.wires).filter((w) => w.target === id);

// Can `targetId` reach `goalId` by following wires forward?
function reaches(circuit, targetId, goalId, seen = new Set()) {
  if (targetId === goalId) return true;
  if (seen.has(targetId)) return false;
  seen.add(targetId);
  return wiresFrom(circuit, targetId).some((w) => reaches(circuit, w.target, goalId, seen));
}

// Checked at connect time: kill the egg before it hatches.
export function canConnect(circuit, sourceId, targetId, pin) {
  const src = circuit.nodes[sourceId];
  const dst = circuit.nodes[targetId];
  if (!src || !dst) return { ok: false, reason: 'missing node' };
  if (src.kind === 'L') return { ok: false, reason: 'lamp has no output' };
  if (dst.kind === 'S') return { ok: false, reason: 'switch has no input' };
  if (pin < 0 || pin >= pinCount(dst)) return { ok: false, reason: 'no such pin' };
  if (wiresInto(circuit, targetId).some((w) => w.pin === pin)) return { ok: false, reason: 'pin taken' };
  if (reaches(circuit, targetId, sourceId)) return { ok: false, reason: 'loop' };
  return { ok: true };
}

// Compute every output. Returns a fresh { [nodeId]: bool } — caller commits it once.
export function evaluate(circuit) {
  const out = {};
  const onStack = new Set();

  const inputs = (id) => {
    const bits = Array(pinCount(circuit.nodes[id])).fill(false);
    for (const w of wiresInto(circuit, id)) bits[w.pin] = out[w.source] ?? false;
    return bits;
  };

  const apply = (id) => {
    if (onStack.has(id)) throw new Error(`loop at ${id}`);
    onStack.add(id);
    const node = circuit.nodes[id];
    if (node.kind === 'S') out[id] = !!node.value;
    else if (node.kind === 'L') out[id] = inputs(id)[0];
    else out[id] = GATES[node.type].fn(...inputs(id));
    for (const w of wiresFrom(circuit, id)) apply(w.target);
    onStack.delete(id);
  };

  for (const node of Object.values(circuit.nodes)) {
    if (node.kind !== 'L') apply(node.id);
  }
  return out;
}
