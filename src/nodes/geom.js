// Component geometry. One stroke system: 3px ink outline at rest (pit2/t1w-d, Tony's T1 verdict: parts
// drop to 3px, --rule stays 2u), knobs as semicircles appended INTO the outline path (one continuous
// stroke), and the lit state as a TRUE inset contour: the outline offset inward by (stroke/2 + gap).
// STROKE is the flow-space (userZoom-independent) base used for every derived geometry constant below;
// App.jsx's --stroke CSS var is the actual on-screen line weight and now grows slightly with zoom
// (screen px = STROKE * userZoom^0.3), so STROKE here is the userZoom=1 value, screen px == STROKE.

export const STROKE = 3;         // outline + wire weight at userZoom 1 (was 4 on pit2/t1w-a, 6 on base)
// Tony's T1 verdict: lines no longer hold perfectly constant screen px as the user zooms; they grow
// SLIGHTLY thicker zooming in. screen px = STROKE * userZoom^ZOOM_EXP. 0.3 is well under 1 (sublinear):
// a 2x zoom range (0.75-1.5) only moves screen px by ~1.23x (2.75 -> 3.4 at STROKE 3), enough to read as
// "a bit bolder up close" without the line competing with zoomed-in detail the way a linear (1.0) or
// zoom-locked (0) grow rate would. App.jsx turns this into the CSS --stroke value it sets per frame:
// cssStroke = STROKE * userZoom^(ZOOM_EXP - 1), so React Flow's viewport-zoom multiply lands on target.
export const ZOOM_EXP = 0.3;
export const GAP = 6;            // paper gap between outline and orange inset
export const INSET = STROKE / 2 + GAP; // centreline -> inset contour distance (recomputed: 7.5)
export const KNOB = 12 - STROKE / 2; // knob centreline radius: ink reaches a fixed 12 from the outline centreline (recomputed: 10.5)
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

/* ---------- Inversion bubble (IEEE Std 91 negation): a ring that IS the output ---------- */
// It touches the body at (x, y) and the wire leaves from its far side. Lit = orange disc inside
// the ring, so an inverting gate shows both values: body = before the NOT, bubble = the output.
export const BUB = 12; // bubble centreline radius
function bubbleAt(x, y) {
  const cx = x + BUB, r = BUB - STROKE / 2 - 2;
  const ring = (R) => `M${cx - R} ${y}A${R} ${R} 0 1 1 ${cx + R} ${y}A${R} ${R} 0 1 1 ${cx - R} ${y}Z`;
  return { bubble: ring(BUB), bubbleInset: ring(r), out: [cx + BUB, y] };
}

/* ---------- AND gate: IEEE Std 91 distinctive shape ---------- */
export const AND = { H: 84, a: 46 }; // centreline height, flat-back length
export function andGeom(inv = false) {
  const { H, a } = AND, R = H / 2;
  const x0 = PAD, y0 = PAD, cx = x0 + a, cy = y0 + R;
  const inY = [y0 + H / 4, y0 + (3 * H) / 4];
  const kIn1 = knob(x0, inY[1], -1); // traversed bottom -> top on the back edge
  const kIn0 = knob(x0, inY[0], -1);
  // Output knob sits on the arc apex: split the front arc where the knob's chord meets it.
  // Inverted: no knob, the bubble sits on the apex instead.
  const ox = cx + Math.sqrt(R * R - KNOB * KNOB);
  const front = inv
    ? `A${R} ${R} 0 0 1 ${cx} ${y0 + H}`
    : `A${R} ${R} 0 0 1 ${f(ox)} ${f(cy - KNOB)}` + knob(ox, cy, +1).arc + `A${R} ${R} 0 0 1 ${cx} ${y0 + H}`;
  const outline =
    `M${x0} ${y0}H${cx}` + front + `H${x0}` +
    `V${kIn1.from[1]}` + kIn1.arc + `V${kIn0.from[1]}` + kIn0.arc + 'Z';
  // True inset contour at distance d: straight edges move in by d, the arc keeps its centre
  // and loses d of radius. The back corners stay mitred (inner offset of a convex corner).
  const d = INSET, r = R - d;
  const inset = `M${x0 + d} ${y0 + d}H${cx}A${r} ${r} 0 0 1 ${cx} ${y0 + H - d}H${x0 + d}Z`;
  const g = { h: y0 + H + PAD, outline, inset, in: inY.map((y) => [x0, y]) };
  if (!inv) return { ...g, w: cx + R + PAD, out: [ox, cy] };
  const b = bubbleAt(cx + R, cy);
  return { ...g, ...b, w: b.out[0] + PAD };
}

/* ---------- OR gate: IEEE Std 91, concave circular back + pointed (ogive) front ---------- */
// Front: two arcs of radius F, each tangent to its flat edge at xs, meeting at the tip on the axis.
// Back: one arc of radius B through both back corners, bulging `bulge` into the body.
export const OR = { H: 84, a: 16, F: 84, bulge: 12 }; // centreline height, flat edge, front radius, back sagitta
export function orGeom(inv = false, shift = 0) {
  const { H, a, F, bulge } = OR, R = H / 2;
  const x0 = PAD + shift, y0 = PAD, xs = x0 + a, cy = y0 + R;
  const B = (R * R + bulge * bulge) / (2 * bulge), bx = x0 + bulge - B; // back arc centre (bx, cy)
  const backX = (y, rad = B) => bx + Math.sqrt(rad * rad - (y - cy) ** 2);
  const frontX = (dy, rad = F) => xs + Math.sqrt(rad * rad - (F - dy) ** 2); // dy = distance down from the flat edge
  const inY = [y0 + H / 4, y0 + (3 * H) / 4];
  const tip = frontX(R);
  // Output knob: vertical chord where the front arcs are KNOB above/below the axis.
  const ox = frontX(R - KNOB);
  const front = inv
    ? `A${F} ${F} 0 0 1 ${f(tip)} ${cy}A${F} ${F} 0 0 1 ${xs} ${y0 + H}`
    : `A${F} ${F} 0 0 1 ${f(ox)} ${f(cy - KNOB)}` + knob(ox, cy, +1).arc + `A${F} ${F} 0 0 1 ${xs} ${y0 + H}`;
  // Input knobs ride the back arc (bottom -> top): arc to the knob's lower end, bulge left, arc on.
  let back = '';
  for (const y of [inY[1], inY[0]]) {
    back += `A${f(B)} ${f(B)} 0 0 0 ${f(backX(y + KNOB))} ${y + KNOB}` +
      `A${KNOB} ${KNOB} 0 0 1 ${f(backX(y - KNOB))} ${y - KNOB}`;
  }
  const outline = `M${x0} ${y0}H${xs}` + front + `H${x0}` + back + `A${f(B)} ${f(B)} 0 0 0 ${x0} ${y0}Z`;
  // True inset at d: flat edges move in by d, front arcs keep their centres and lose d,
  // the concave back keeps its centre and GAINS d.
  const d = INSET, Fi = F - d, Bo = B + d, yt = y0 + d, yb = y0 + H - d;
  const inset =
    `M${f(backX(yt, Bo))} ${yt}H${xs}A${Fi} ${Fi} 0 0 1 ${f(xs + Math.sqrt(Fi * Fi - (F - R) ** 2))} ${cy}` +
    `A${Fi} ${Fi} 0 0 1 ${xs} ${yb}H${f(backX(yb, Bo))}A${f(Bo)} ${f(Bo)} 0 0 0 ${f(backX(yt, Bo))} ${yt}Z`;
  const g = { h: y0 + H + PAD, outline, inset, in: inY.map((y) => [f(backX(y)), y]) };
  if (!inv) return { ...g, w: ox + KNOB + STROKE + PAD, out: [ox, cy] };
  const b = bubbleAt(tip, cy);
  return { ...g, ...b, w: b.out[0] + PAD };
}

/* ---------- NOT gate: triangle, knob fused into the flat side, bubble at the tip ---------- */
export const NOT = { H: 84, a: 72 }; // centreline height, tip span
export function notGeom() {
  const { H, a } = NOT;
  const x0 = PAD, y0 = PAD, y1 = y0 + H, cy = (y0 + y1) / 2, tipX = x0 + a;
  const kIn = knob(x0, cy, -1); // fused into the flat side, same idiom as the lamp's input knob
  const outline =
    `M${f(kIn.from[0])} ${f(kIn.from[1])}${kIn.arc}` +
    `L${x0} ${y1}L${tipX} ${cy}L${x0} ${y0}Z`;
  // Inset triangle: scale each corner toward the centroid by d (true inset of a straight-edge
  // triangle keeps mitred corners; the centroid scale is exact for an isoceles triangle like this one).
  const d = INSET, cxC = (x0 + x0 + tipX) / 3, s = 1 - d / (a / 3 + d);
  const toward = (x, y) => [f(cxC + (x - cxC) * s), f(cy + (y - cy) * s)];
  const [ax, ay] = toward(x0, y0), [bx, by] = toward(tipX, cy), [dx2, dy2] = toward(x0, y1);
  const inset = `M${ax} ${ay}L${bx} ${by}L${dx2} ${dy2}Z`;
  const b = bubbleAt(tipX, cy);
  return { ...b, w: b.out[0] + PAD, h: y1 + PAD, outline, inset, in: [[x0, cy]] };
}

export const nandGeom = () => andGeom(true);
export const norGeom = () => orGeom(true);

// XOR = OR shifted right by XOR_GAP, plus a second back arc XOR_GAP behind the first (IEEE Std 91).
export const XOR_GAP = 12;
export function xorGeom() {
  const g = orGeom(false, XOR_GAP), { H, bulge } = OR, R = H / 2;
  const B = (R * R + bulge * bulge) / (2 * bulge), x = PAD, y0 = PAD;
  return { ...g, extraCurve: `M${x} ${y0}A${f(B)} ${f(B)} 0 0 1 ${x} ${y0 + H}` };
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
