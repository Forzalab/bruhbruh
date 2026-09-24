// Component geometry. One stroke system: 6px ink outline (IBM Carbon / Müller-Brockmann: a single
// line weight), knobs as semicircles appended INTO the outline path (one continuous stroke),
// and the lit state as a TRUE inset contour: the outline offset inward by (stroke/2 + gap).

export const STROKE = 6;         // outline + wire weight
export const GAP = 6;            // paper gap between outline and orange inset
export const INSET = STROKE / 2 + GAP; // centreline -> inset contour distance (9)
export const KNOB = 9;           // knob centreline radius: outer tip 12 past the centreline = 9px past the outer ink (ref3 bump 9)
export const PAD = 12;           // svg padding around the outline centreline

const f = (n) => +n.toFixed(3);

// Knob on a vertical edge at (x, y), bulging towards `dir` (+1 right, -1 left).
// The path is always traversed clockwise, so the sweep flag is always 1.
function knob(x, y, dir) {
  const y0 = y - dir * KNOB, y1 = y + dir * KNOB;
  return { from: [x, y0], arc: `A${KNOB} ${KNOB} 0 0 1 ${f(x)} ${f(y1)}` };
}

/* ---------- Switch: square, knob on the right edge ---------- */
export const SW = { side: 62 }; // centreline side; outer ink = 68
export function switchGeom() {
  const x0 = PAD, y0 = PAD, s = SW.side, x1 = x0 + s, y1 = y0 + s, cy = y0 + s / 2;
  const k = knob(x1, cy, +1);
  const outline = `M${x0} ${y0}H${x1}V${k.from[1]}${k.arc}V${y1}H${x0}Z`;
  // True inset of a square: every edge moved inward by INSET, corners stay mitred.
  const d = INSET;
  const inset = `M${x0 + d} ${y0 + d}H${x1 - d}V${y1 - d}H${x0 + d}Z`;
  return { w: x1 + PAD, h: y1 + PAD, outline, inset, out: [x1, cy] };
}

/* ---------- AND gate: IEEE Std 91 distinctive shape ---------- */
export const AND = { H: 84, a: 46 }; // centreline height, flat-back length
export function andGeom() {
  const { H, a } = AND, R = H / 2;
  const x0 = PAD, y0 = PAD, cx = x0 + a, cy = y0 + R;
  const inY = [y0 + H / 4, y0 + (3 * H) / 4];
  // Output knob sits on the arc apex: split the front arc where the knob's chord meets it.
  const ox = cx + Math.sqrt(R * R - KNOB * KNOB);
  const kOut = knob(ox, cy, +1);
  const kIn1 = knob(x0, inY[1], -1); // traversed bottom -> top on the back edge
  const kIn0 = knob(x0, inY[0], -1);
  const outline =
    `M${x0} ${y0}H${cx}` +
    `A${R} ${R} 0 0 1 ${f(ox)} ${f(cy - KNOB)}` + kOut.arc +
    `A${R} ${R} 0 0 1 ${cx} ${y0 + H}H${x0}` +
    `V${kIn1.from[1]}` + kIn1.arc + `V${kIn0.from[1]}` + kIn0.arc + 'Z';
  // True inset contour at distance d: straight edges move in by d, the arc keeps its centre
  // and loses d of radius. The back corners stay mitred (inner offset of a convex corner).
  const d = INSET, r = R - d;
  const inset = `M${x0 + d} ${y0 + d}H${cx}A${r} ${r} 0 0 1 ${cx} ${y0 + H - d}H${x0 + d}Z`;
  return { w: cx + R + PAD, h: y0 + H + PAD, outline, inset, in: inY.map((y) => [x0, y]), out: [ox, cy] };
}

/* ---------- Lamp: ring, knob fused into the left side ---------- */
export const LAMP = { R: 45 }; // centreline radius; outer Ø = 96
export function lampGeom() {
  const R = LAMP.R, cx = PAD + R, cy = PAD + R;
  const kx = cx - Math.sqrt(R * R - KNOB * KNOB);
  const k = knob(kx, cy, -1);
  const outline = `M${f(kx)} ${f(cy + KNOB)}${k.arc}A${R} ${R} 0 1 1 ${f(kx)} ${f(cy + KNOB)}Z`;
  const r = R - INSET;
  const inset = `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;
  return { w: cx + R + PAD, h: cy + R + PAD, outline, inset, in: [kx, cy] };
}
