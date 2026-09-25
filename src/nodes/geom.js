// Component geometry. One stroke system: 6px ink outline (IBM Carbon / Müller-Brockmann: a single
// line weight), knobs as semicircles appended INTO the outline path (one continuous stroke),
// and the lit state as a TRUE inset contour: the outline offset inward by (stroke/2 + gap).

export const STROKE = 6;         // outline + wire weight
export const GAP = 6;            // paper gap between outline and orange inset
export const INSET = STROKE / 2 + GAP; // centreline -> inset contour distance (9)
export const KNOB = 9;           // knob centreline radius: ink reaches 12 from the outline centreline = a 9px bump past the 3px outer ink
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

/* ---------- OR gate: IEEE Std 91, curved (concave) back ---------- */
export const OR = { H: 84, a: 46, bulge: 20 }; // centreline height, front span, back-curve reach
export function orGeom() {
  const { H, a, bulge } = OR, R = H / 2;
  const x0 = PAD, y0 = PAD, cx = x0 + a, cy = y0 + R;
  const xb = x0 + bulge; // back curve's mid-height apex, pulled toward the front
  const inY = [y0 + H / 4, y0 + (3 * H) / 4];
  const ox = cx + Math.sqrt(R * R - KNOB * KNOB);
  const kOut = knob(ox, cy, +1);
  const kIn1 = knob(xb, inY[1], -1); // bottom -> top on the curved back, same order as AND
  const kIn0 = knob(xb, inY[0], -1);
  const outline =
    `M${x0} ${y0}H${cx}` +
    `A${R} ${R} 0 0 1 ${f(ox)} ${f(cy - KNOB)}` + kOut.arc +
    `A${R} ${R} 0 0 1 ${cx} ${y0 + H}H${x0}` +
    `Q${f(xb)} ${f(y0 + H)} ${f(kIn1.from[0])} ${f(kIn1.from[1])}` + kIn1.arc +
    `Q${f(xb)} ${f(cy)} ${f(kIn0.from[0])} ${f(kIn0.from[1])}` + kIn0.arc +
    `Q${f(xb)} ${f(y0)} ${x0} ${y0}Z`;
  // Approximate inset: straight edges move in by d as AND does; the curved back keeps its shape,
  // scaled toward the front by d (good enough for the paper-gap glow, not a true offset curve).
  const d = INSET, r = R - d;
  const inset =
    `M${x0 + d} ${y0 + d}H${cx}A${r} ${r} 0 0 1 ${cx} ${y0 + H - d}H${x0 + d}` +
    `Q${f(xb + d)} ${f(y0 + H - d)} ${f(x0 + d + bulge * 0.6)} ${f(cy)}` +
    `Q${f(xb + d)} ${f(y0 + d)} ${x0 + d} ${y0 + d}Z`;
  return { w: cx + R + PAD, h: y0 + H + PAD, outline, inset, in: [[xb, inY[0]], [xb, inY[1]]], out: [ox, cy] };
}

/* ---------- NOT gate: triangle, knob fused into the flat side, inversion bubble at the tip ---------- */
export const NOT = { H: 68, a: 58 }; // centreline height, tip span
export function notGeom() {
  const { H, a } = NOT;
  const x0 = PAD, y0 = PAD, y1 = y0 + H, cy = (y0 + y1) / 2, tipX = x0 + a;
  const kIn = knob(x0, cy, -1); // fused into the flat side, same idiom as the lamp's input knob
  const bubbleR = KNOB - 2, gap = 3;
  const bubbleCx = tipX + bubbleR + gap;
  const ox = bubbleCx + bubbleR + gap;
  const kOut = knob(ox, cy, +1);
  const outline =
    `M${f(kIn.from[0])} ${f(kIn.from[1])}${kIn.arc}` +
    `L${x0} ${y1}L${tipX} ${cy}L${x0} ${y0}Z`;
  const bubble = `M${bubbleCx - bubbleR} ${cy}A${bubbleR} ${bubbleR} 0 1 1 ${bubbleCx + bubbleR} ${cy}` +
    `A${bubbleR} ${bubbleR} 0 1 1 ${bubbleCx - bubbleR} ${cy}Z`;
  // Inset triangle: scale each corner toward the centroid by d (true inset of a straight-edge
  // triangle keeps mitred corners; the centroid scale is exact for an isoceles triangle like this one).
  const d = INSET, cxC = (x0 + x0 + tipX) / 3, s = 1 - d / (a / 3 + d);
  const toward = (x, y) => [f(cxC + (x - cxC) * s), f(cy + (y - cy) * s)];
  const [ax, ay] = toward(x0, y0), [bx, by] = toward(tipX, cy), [dx2, dy2] = toward(x0, y1);
  const inset = `M${ax} ${ay}L${bx} ${by}L${dx2} ${dy2}Z`;
  return { w: ox + KNOB + PAD, h: y1 + PAD, outline, bubble, inset, in: [[x0, cy]], out: [ox, cy] };
}

// NAND/NOR = AND/OR + an inversion bubble stitched onto the output knob (IEEE Std 91 negation).
// The knob stays put; the bubble and the wire start just sit further out, so `out` moves and `w` grows.
function withBubble(base) {
  const [ox, oy] = base.out, bubbleR = KNOB - 2, gap = 3;
  const bubbleCx = ox + bubbleR + gap;
  const newOx = bubbleCx + bubbleR + gap;
  const bubble = `M${bubbleCx - bubbleR} ${oy}A${bubbleR} ${bubbleR} 0 1 1 ${bubbleCx + bubbleR} ${oy}` +
    `A${bubbleR} ${bubbleR} 0 1 1 ${bubbleCx - bubbleR} ${oy}Z`;
  return { ...base, w: base.w + 2 * (bubbleR + gap), bubble, out: [newOx, oy] };
}
export function nandGeom() { return withBubble(andGeom()); }
export function norGeom() { return withBubble(orGeom()); }

// XOR = OR with an extra curved line just behind the back curve (IEEE Std 91 XOR).
export function xorGeom() {
  const base = orGeom();
  const { H, bulge } = OR, R = OR.H / 2, x0 = PAD, y0 = PAD, cy = y0 + R, xb = x0 + bulge, extra = 8;
  const x0e = Math.max(0, x0 - extra);
  const extraCurve = `M${x0e} ${y0}Q${f(xb - extra)} ${f(cy)} ${x0e} ${y0 + H}`;
  return { ...base, extraCurve };
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
