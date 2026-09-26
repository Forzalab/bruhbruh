// Wire router (T2 draft). Pure function, O(n^2) over wires, run once per App render.
// Every forward wire is a 3-segment step: h1 (source y, sx -> lx), trunk (lx, sy -> ty), h2 (target y, lx -> tx).
// 1. Nets: wires that share a source share ONE trunk x (same signal, same colour) -> a junction dot where it branches.
// 2. Bundles (NYCTA 1972): trunks of different nets closer than PITCH with overlapping spans are spread into lanes
//    PITCH apart (= snapGrid 20 = the 20u baseline), every lane ON the grid, ordered so nested staircases never cross.
// 3. Crossings left over (different nets): recorded on the horizontal segment; the variant draws a gap or a hop there.
// 4. X spot: the midpoint of the longest crossing-free run of h2 (h2 is unique per wire: an input takes one wire).
export const PITCH = 20, DOT_R = 9, HOP_R = 9, GAP = 9; // GAP = 3 (half the crossing ink) + 6 paper
const MINRUN = 20; // a wire whose horizontal run is shorter than this is not rerouted (falls back to React Flow's step)

export function route(wires) {
  // wires: [{ id, source, sx, sy, tx, ty }] in flow px. Returns Map id -> { lx, cross: [[x, y]], dots: [[x, y]], xAt: [x, y] }
  const out = new Map();
  const fwd = wires.filter((w) => w.tx - w.sx >= 2 * MINRUN);
  // Nets
  const nets = new Map();
  for (const w of fwd) (nets.get(w.source) ?? nets.set(w.source, []).get(w.source)).push(w);
  const N = [...nets.values()].map((ws) => {
    const sx = ws[0].sx, sy = ws[0].sy, tmin = Math.min(...ws.map((w) => w.tx));
    const ys = [sy, ...ws.map((w) => w.ty)];
    const down = ws.reduce((s, w) => s + (w.ty - sy), 0) >= 0;
    return { ws, sx, sy, base: (sx + tmin) / 2, lo: Math.min(...ys), hi: Math.max(...ys), down, tmin };
  });
  // Bundles: greedy clustering on base x, conflict = trunks nearer than PITCH*1.5 whose y spans overlap.
  N.sort((a, b) => a.base - b.base);
  const seen = new Set();
  for (const n of N) {
    if (seen.has(n)) continue;
    const group = [n]; seen.add(n);
    for (let grew = true; grew;) {
      grew = false;
      for (const m of N) if (!seen.has(m) && group.some((g) => Math.abs(g.base - m.base) < PITCH * 1.5 && g.lo < m.hi && m.lo < g.hi)) { group.push(m); seen.add(m); grew = true; }
    }
    // No-crossing order (nested staircases): down-going nets, lower source first; then up-going, higher source first.
    group.sort((a, b) => (a.down !== b.down ? (a.down ? -1 : 1) : a.down ? b.sy - a.sy : a.sy - b.sy));
    const mid = group.reduce((s, g) => s + g.base, 0) / group.length;
    const first = Math.round(mid / PITCH - (group.length - 1) / 2) * PITCH; // lanes centred on the bundle, snapped to the grid
    group.forEach((g, i) => { g.lx = first + i * PITCH; });
    // Keep every lane between its source and its nearest target (a lane never overshoots a pin).
    group.forEach((g) => { g.lx = Math.min(Math.max(g.lx, g.sx + MINRUN), g.tmin - MINRUN); });
  }
  // Segments per wire
  const seg = [];
  for (const n of N) for (const w of n.ws) {
    const r = { lx: n.lx, cross: [], dots: [], net: n };
    r.h = [[w.sy, w.sx, n.lx], [w.ty, n.lx, w.tx]];
    r.v = [n.lx, Math.min(w.sy, w.ty), Math.max(w.sy, w.ty)];
    out.set(w.id, r); seg.push([w, r]);
  }
  // Crossings: my horizontal x their trunk, different nets only, strictly inside both.
  const E = 0.5;
  for (const [, a] of seg) for (const [, b] of seg) {
    if (a.net === b.net) continue;
    const [vx, v0, v1] = b.v;
    for (const [y, x0, x1] of a.h) {
      const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      if (vx > lo + E && vx < hi - E && y > v0 + E && y < v1 - E) a.cross.push([vx, y]);
    }
  }
  // Junction dots: per net with 2+ wires, any point on the trunk where 3+ arms meet. Drawn once, by the net's first wire.
  for (const n of N) {
    if (n.ws.length < 2) continue;
    const ys = new Map(); // y -> arms at that y (left entry / right exits)
    const arm = (y, k) => ys.set(y, (ys.get(y) ?? new Set()).add(k));
    arm(n.sy, 'L'); n.ws.forEach((w) => arm(w.ty, 'R'));
    const dots = [];
    for (const [y, a] of ys) { const deg = a.size + (y > n.lo ? 1 : 0) + (y < n.hi ? 1 : 0); if (deg >= 3) dots.push([n.lx, y]); }
    out.get(n.ws[0].id).dots = dots;
  }
  // X spot: longest crossing-free run of h2.
  for (const [w, r] of seg) {
    const cuts = [r.lx, ...r.cross.filter(([, y]) => y === w.ty).map(([x]) => x), w.tx].sort((p, q) => p - q);
    let best = [cuts[0], cuts[1]];
    for (let i = 1; i < cuts.length - 1; i++) if (cuts[i + 1] - cuts[i] > best[1] - best[0]) best = [cuts[i], cuts[i + 1]];
    r.xAt = [(best[0] + best[1]) / 2, w.ty];
    delete r.net; delete r.h; delete r.v;
  }
  return out;
}

// Path for a routed wire. style: 'gap' (A: paper break, the under-wire stops GAP short of the trunk it passes),
// 'hop' (B: a semicircle of HOP_R over the trunk), 'plain' (C: straight through; the dot alone means joined).
export function wirePath(sx, sy, tx, ty, r, style) {
  const hRun = (y, x0, x1) => {
    const dir = Math.sign(x1 - x0) || 1;
    const xs = style === 'plain' ? [] : r.cross.filter(([, cy]) => cy === y).map(([x]) => x).sort((a, b) => (a - b) * dir);
    let d = '';
    for (const x of xs) {
      const R = style === 'hop' ? HOP_R : GAP;
      d += `H${x - dir * R}`;
      d += style === 'hop' ? `A${R} ${R} 0 0 ${dir > 0 ? 1 : 0} ${x + dir * R} ${y}` : `M${x + dir * R} ${y}`;
    }
    return d + `H${x1}`;
  };
  return `M${sx} ${sy}` + hRun(sy, sx, r.lx) + `V${ty}` + hRun(ty, r.lx, tx);
}
