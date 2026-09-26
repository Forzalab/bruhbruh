// T4-tt: resolve enlarged pin hit zones against the neighbours (pure; zones.test.js).
// Input: parts = [{ id, x, y, g }] where g = portGeom(): { w, h, zones: {handle: rect}, pins: {handle: [x, y]} } (node-local).
// Output: { [id]: { [handle]: rect } } node-local rects such that
//   1. no zone overlaps another part's body box or its delete-X box, and
//   2. no two zones of different parts overlap (the overlap is split at the midline between the two pins, Voronoi-style).
// A zone always keeps its own pin; if a cut would remove the pin, that cut is skipped.
const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);
const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const holds = (r, p) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
// Largest of the four sub-rects of r that avoid obstacle o and still hold pin p.
function cut(r, o, p) {
  if (!hits(r, o)) return r;
  const c = [
    { ...r, w: o.x - r.x },                                   // keep the part left of o
    { x: o.x + o.w, y: r.y, w: r.x + r.w - (o.x + o.w), h: r.h }, // right of o
    { ...r, h: o.y - r.y },                                   // above o
    { x: r.x, y: o.y + o.h, w: r.w, h: r.y + r.h - (o.y + o.h) }, // below o
  ].filter((k) => k.w > 0 && k.h > 0 && holds(k, p));
  return c.length ? c.reduce((a, b) => (area(b) > area(a) ? b : a)) : r;
}
// Keep the side of the line (axis, m) that holds p.
function half(r, axis, m, p) {
  if (axis === 'x') return p[0] <= m ? { ...r, w: Math.min(r.w, m - r.x) } : { ...r, x: Math.max(r.x, m), w: r.x + r.w - Math.max(r.x, m) };
  return p[1] <= m ? { ...r, h: Math.min(r.h, m - r.y) } : { ...r, y: Math.max(r.y, m), h: r.y + r.h - Math.max(r.y, m) };
}
export const BODY_INSET_Y = 9;   // PAD - STROKE: the ink box of a part, top and bottom (knobs stick out left/right only)
export const X_BOX = 56;         // the delete X hit square, centred on the top edge (y = PAD = 12)
export function resolveZones(parts) {
  const Z = parts.map((p) => Object.entries(p.g.zones).map(([h, r]) => ({ id: p.id, h, r: { ...r, x: r.x + p.x, y: r.y + p.y },
    pin: [p.g.pins[h][0] + p.x, p.g.pins[h][1] + p.y] }))).flat();
  const obst = parts.map((p) => ({ id: p.id, boxes: [
    { x: p.x, y: p.y + BODY_INSET_Y, w: p.g.w, h: p.g.h - 2 * BODY_INSET_Y },
    { x: p.x + p.g.w / 2 - X_BOX / 2, y: p.y + 12 - X_BOX / 2, w: X_BOX, h: X_BOX } ] }));
  for (const z of Z) for (const o of obst) if (o.id !== z.id) for (const b of o.boxes) z.r = cut(z.r, b, z.pin);
  for (let i = 0; i < Z.length; i++) for (let j = i + 1; j < Z.length; j++) {
    const a = Z[i], b = Z[j];
    if (a.id === b.id || !hits(a.r, b.r)) continue;
    const dx = b.pin[0] - a.pin[0], dy = b.pin[1] - a.pin[1];
    const axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y', m = axis === 'x' ? a.pin[0] + dx / 2 : a.pin[1] + dy / 2;
    a.r = half(a.r, axis, m, a.pin); b.r = half(b.r, axis, m, b.pin);
  }
  const out = {};
  const at = Object.fromEntries(parts.map((p) => [p.id, p]));
  for (const z of Z) (out[z.id] ??= {})[z.h] = { x: z.r.x - at[z.id].x, y: z.r.y - at[z.id].y, w: z.r.w, h: z.r.h };
  return out;
}
