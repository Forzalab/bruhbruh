// Wire crossing hops (Tony pick B, pit2/t2-hop). Pure geometry, drawn on top of route.js; no routing changes.
// Convention (IEC 60617 / IEEE 315 bridge): where a horizontal run crosses a vertical run of ANOTHER net, the horizontal
// bridges over. Shape: a 45-degree trapezoid (metro-map angles), NOT a semicircle, so it can never be read as a pin
// knob (knobs are round). All sizes come from the stroke sw:
//   rise R = 3sw, shoulder 3sw (45 deg), flat top half-width T = 2sw (clears the crossed sw line with 1.5sw of paper).
//   footprint half-width = T + R = 5sw (15 px at the 3 px stroke).
// A hop is drawn only when its footprint stays >= BEND_CLEAR (20) from every corner and end of BOTH runs; closer than
// that the crossing is left plain (a corner and a bump would fuse into one blob).
export const BEND_CLEAR = 20;
const hopHalf = (sw) => 5 * sw;

// Crossings of my horizontals with other wires' verticals. mine / others: point lists [[x, y], ...].
export function crossings(mine, others, sw) {
  const H = hopHalf(sw), out = [];
  for (let i = 1; i < mine.length; i++) {
    const [a, b] = [mine[i - 1], mine[i]]; if (a[1] !== b[1]) continue;
    const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]);
    for (const o of others) for (let k = 1; k < o.length; k++) {
      const [c, d] = [o[k - 1], o[k]]; if (c[0] !== d[0]) continue;
      const x = c[0], vlo = Math.min(c[1], d[1]), vhi = Math.max(c[1], d[1]), y = a[1];
      if (!(x > lo && x < hi && y > vlo && y < vhi)) continue;
      const ok = x - H - lo >= BEND_CLEAR && hi - (x + H) >= BEND_CLEAR && y - vlo >= H + BEND_CLEAR && vhi - y >= H + BEND_CLEAR;
      out.push({ x, y, ok });
    }
  }
  return out;
}

// Path with hops (only the ok crossings). Same M/L polyline as route.js toPath, plus the bridge pieces.
export function hopPath(pts, cross, sw) {
  const T = 2 * sw, R = 3 * sw;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i];
    if (py === y) {
      const dir = Math.sign(x - px) || 1;
      const hs = cross.filter((c) => c.ok && c.y === y && (c.x - px) * dir > 0 && (x - c.x) * dir > 0).sort((p, q) => (p.x - q.x) * dir);
      for (const { x: cx } of hs) d += `L${cx - dir * (T + R)} ${y}L${cx - dir * T} ${y - R}L${cx + dir * T} ${y - R}L${cx + dir * (T + R)} ${y}`;
    }
    d += `L${x} ${y}`;
  }
  return d;
}
