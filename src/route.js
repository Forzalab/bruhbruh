// Wire router geometry (pure, no React). Wires leave an output going right and enter an input from the left.
// Points are [x, y]; boxes are { x, y, w, h } in flow units.
//
// Bend cap MAX_BENDS = 4. Why 4: it is the fewest bends that can still honour both pin directions when the target
// input sits LEFT of the source output (out right -> up/down -> back left -> down/up -> in right = 4 corners).
// Forward wires need 0 or 2. Anything a 4-bend route cannot solve would need 6+ corners, which reads as spaghetti
// on a 20u grid; there we fall back to a plain step path and accept the overlap.
export const MAX_BENDS = 4;
export const STUB = 20;   // straight run out of / into a pin before the first corner (one grid cell)
export const MARGIN = 14; // clearance kept from other node boxes

const inflate = (b, m) => ({ x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m });

// Does the axis-aligned segment a-b pass through the open interior of box b?
export function segHitsBox([ax, ay], [bx, by], b) {
  const x0 = b.x, x1 = b.x + b.w, y0 = b.y, y1 = b.y + b.h;
  if (ay === by) { const lo = Math.min(ax, bx), hi = Math.max(ax, bx); return ay > y0 && ay < y1 && hi > x0 && lo < x1; }
  const lo = Math.min(ay, by), hi = Math.max(ay, by); return ax > x0 && ax < x1 && hi > y0 && lo < y1;
}

export const bends = (pts) => {
  let n = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const h1 = a[1] === b[1], h2 = b[1] === c[1];
    if (h1 !== h2) n++;
  }
  return n;
};
const length = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.abs(p[0] - pts[i][0]) + Math.abs(p[1] - pts[i][1]), 0);
const clean = (pts) => { // drop zero-length and collinear points
  const out = [];
  for (const p of pts) { if (out.length && out.at(-1)[0] === p[0] && out.at(-1)[1] === p[1]) continue; out.push(p); }
  for (let i = out.length - 2; i > 0; i--) {
    const [a, b, c] = [out[i - 1], out[i], out[i + 1]];
    if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) out.splice(i, 1);
  }
  return out;
};

// Is the polyline clear of every obstacle? Source/target boxes are obstacles too (a wire must not run back
// through its own parts), but only their exact outline, so the pin stubs on the edge are allowed.
export function clear(pts, obstacles) {
  for (let i = 1; i < pts.length; i++) for (const b of obstacles) if (segHitsBox(pts[i - 1], pts[i], b)) return false;
  return true;
}

// Plain step path (what getSmoothStepPath draws for a forward wire): corners at the midpoint x.
export function stepPoints(s, t) {
  const mx = (s[0] + t[0]) / 2;
  return clean([s, [mx, s[1]], [mx, t[1]], t]);
}

// Capped router. Returns points with <= MAX_BENDS corners that clear all boxes, or null (caller falls back).
// ends = { src, dst } boxes of the wire's own nodes; others = every other node box.
export function route(s, t, { src, dst, others = [] } = {}, maxBends = MAX_BENDS) {
  // Pins can sit inside their own box (knobs, padding): trim the source box at the pin's x, and the target box too.
  const own = [src && { ...src, w: Math.min(src.w, s[0] - src.x) }, dst && { ...dst, x: Math.max(dst.x, t[0]), w: dst.x + dst.w - Math.max(dst.x, t[0]) }];
  const obs = [...others.map((b) => inflate(b, MARGIN)), ...own.filter((b) => b && b.w > 0)];
  const all = [...others, src, dst].filter(Boolean).map((b) => inflate(b, MARGIN));
  const xs1 = new Set([s[0] + STUB]), xs2 = new Set([t[0] - STUB]), ys = new Set([s[1], t[1]]);
  for (const b of all) { xs1.add(b.x + b.w); xs2.add(b.x); ys.add(b.y); ys.add(b.y + b.h); }
  const mids = new Set([(s[0] + t[0]) / 2, ...xs1, ...xs2]);
  const cands = [];
  if (s[1] === t[1] && t[0] >= s[0]) cands.push([s, t]);
  // 2 bends: s -> (x, s.y) -> (x, t.y) -> t
  for (const x of mids) if (x >= s[0] + STUB && x <= t[0] - STUB) cands.push(clean([s, [x, s[1]], [x, t[1]], t]));
  // 4 bends: s -> (x1, s.y) -> (x1, y) -> (x2, y) -> (x2, t.y) -> t
  if (maxBends >= 4) for (const x1 of xs1) if (x1 >= s[0] + STUB) for (const x2 of xs2) if (x2 <= t[0] - STUB)
    for (const y of ys) cands.push(clean([s, [x1, s[1]], [x1, y], [x2, y], [x2, t[1]], t]));
  let best = null, bestCost = Infinity;
  for (const p of cands) {
    const n = bends(p); if (n > maxBends || !clear(p, obs)) continue;
    const cost = length(p) + 40 * n; // a corner costs two grid cells of length
    if (cost < bestCost) { best = p; bestCost = cost; }
  }
  return best;
}

// Deny-the-drop check. parts = { id: { x, y, w, h, out: y|null, ins: [y...] } } (pin heights local to the part),
// wires = [{ source, target, pin }]. Returns null when the layout is fine, else { reason, node } naming a culprit.
export function placementProblem(parts, wires, moved) {
  const ids = Object.keys(parts), box = (id) => parts[id];
  const over = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const a of ids) for (const b of ids) if (a < b && over(box(a), box(b))) return { reason: 'overlap', node: moved ?? a };
  for (const w of wires) {
    const S = box(w.source), T = box(w.target); if (!S || !T || S.out == null) continue;
    const s = [S.x + S.w, S.y + S.out], t = [T.x, T.y + T.ins[w.pin]];
    const culprit = moved ?? w.target;
    if (t[0] < s[0] + 2 * STUB) return { reason: 'backwards', node: culprit };
    const others = ids.filter((id) => id !== w.source && id !== w.target).map(box);
    if (!clear(stepPoints(s, t), others)) return { reason: 'blocked', node: culprit };
  }
  return null;
}

export const toPath =(pts) => 'M' + pts.map((p) => `${p[0]} ${p[1]}`).join('L');
// Label point = middle of the longest segment (where the delete X sits).
export function midpoint(pts) {
  let bi = 1, bl = -1;
  for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); if (l > bl) { bl = l; bi = i; } }
  return [(pts[bi][0] + pts[bi - 1][0]) / 2, (pts[bi][1] + pts[bi - 1][1]) / 2];
}
