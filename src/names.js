// One naming rule for the canvas plates AND the truth-table header, so the two can never disagree.
// Switches A, B, C... and lamps OUT (one lamp) / Q1, Q2... in canvas order (top-to-bottom, then left-to-right),
// the table's own column order. Gates are not table columns: G1, G2... in the same order (compact, neutral).
export function byPos(view, circuit, kind) {
  return view.filter((n) => circuit.nodes[n.id]?.kind === kind)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).map((n) => n.id);
}
export function partNames(view, circuit) {
  const out = {};
  byPos(view, circuit, 'S').forEach((id, i) => { out[id] = String.fromCharCode(65 + i); });
  const ls = byPos(view, circuit, 'L');
  ls.forEach((id, i) => { out[id] = ls.length === 1 ? 'OUT' : `Q${i + 1}`; });
  byPos(view, circuit, 'G').forEach((id, i) => { out[id] = `G${i + 1}`; });
  return out;
}
