// Junctions (Tony's sketch, jn round). Pure geometry, no React.
// Wires from one output share a trunk: the router is asked to reuse the first sibling's corner x (route `prefer`),
// so fan-out wires run together and split at a junction. Every collinear overlap between two wires is a shared run:
//   same net (same source)   -> a trunk: drawn per JN variant (a thick, b twin lines, c plain), dots where it splits
//   different nets            -> one line, same thickness, alternating lit/unlit dashes when the states differ
import { routeMetro as route } from './route.js';

export const JN = 'a';            // a = thick trunk, b = twin lines, c = dot only
export const DOT_R = 4.5;          // junction dot radius, flow px = 1.5 strokes (a 9px dot on a 3px wire)

// list: [{ id, source, s, t, src, dst, others }] -> { id: pts | null }
export function routeAll(list) {
  const out = {}, first = {};
  const order = [...list].sort((a, b) => (a.source === b.source ? a.t[1] - b.t[1] : a.source < b.source ? -1 : 1));
  for (const w of order) {
    const f = first[w.source];
    let p = route(w.s, w.t, { src: w.src, dst: w.dst, others: w.others, prefer: f && f.length > 2 && f[0][1] === w.s[1] ? f[1][0] : undefined });
    out[w.id] = p;
    if (p && !f) first[w.source] = p;
  }
  return out;
}

const segs = (p) => p.slice(1).map((b, i) => [p[i], b]);
// Collinear overlap of two axis-aligned segments, or null.
function overlap([a, b], [c, d]) {
  if (a[1] === b[1] && c[1] === d[1] && a[1] === c[1]) {
    const lo = Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])), hi = Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0]));
    return hi - lo > 0.5 ? [[lo, a[1]], [hi, a[1]]] : null;
  }
  if (a[0] === b[0] && c[0] === d[0] && a[0] === c[0]) {
    const lo = Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1])), hi = Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1]));
    return hi - lo > 0.5 ? [[a[0], lo], [a[0], hi]] : null;
  }
  return null;
}
const same = (p, q) => Math.abs(p[0] - q[0]) < 0.5 && Math.abs(p[1] - q[1]) < 0.5;

// routes { id: pts }, nets { id: { source, on } } -> { id: { runs: [{ a, b, same, mix }], dots: [[x, y]] } }
export function shares(routes, nets) {
  const ids = Object.keys(routes).filter((id) => routes[id]), res = Object.fromEntries(ids.map((id) => [id, { runs: [], dots: [] }]));
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const P = routes[ids[i]], Q = routes[ids[j]], n1 = nets[ids[i]], n2 = nets[ids[j]];
    const sameNet = n1.source === n2.source;
    const ends = [];
    for (const s1 of segs(P)) for (const s2 of segs(Q)) {
      const o = overlap(s1, s2); if (!o) continue;
      const run = { a: o[0], b: o[1], same: sameNet, mix: !sameNet && !!n1.on !== !!n2.on };
      res[ids[i]].runs.push(run); res[ids[j]].runs.push(run); // both draw the same overlay, so edge order cannot matter
      ends.push(...o);
    }
    // A dot at each end of the shared stretch: an end that is not also the start of the next shared segment (a corner
    // both wires turn together) and not a pin (a fan-out leaving its knob needs none).
    const pins = [P[0], P.at(-1), Q[0], Q.at(-1)];
    for (const e of ends) if (ends.filter((q) => same(q, e)).length === 1 && !pins.some((q) => same(q, e)))
      for (const id of [ids[i], ids[j]]) if (!res[id].dots.some((d) => same(d, e))) res[id].dots.push(e);
  }
  return res;
}
