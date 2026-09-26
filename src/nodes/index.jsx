import { useId, useRef, useState } from 'react';
import { Handle as RFHandle, Position } from '@xyflow/react';
import Remove from '../Remove.jsx';
import Say from '../Say.jsx';
import { switchGeom, andGeom, orGeom, notGeom, nandGeom, norGeom, xorGeom, lampGeom, SW, PAD, KNOB, INSET, BUB, STROKE } from './geom.js';

const SWG = switchGeom(), LAMPG = lampGeom();
const HB = 20; // handle box centred on the knob chord: the wire end lands 10px out, inside the knob ink ring (6..12)
const REACH = KNOB + 50; // T4-tt: hit zone reaches 50 px past the knob tip into empty space (was 30)
const EXT = 20; // T4-tt: end zones also reach 20 px above / below the node box; App.jsx clips every zone to the gap

// Per-node hit zones (Tony's sketch): the region between the gate body and the node edge, tiled
// by port so each side is fully covered with no gaps or overlaps. Rects are in node-local
// coordinates (same space as geom.js's `at` points), {x, y, w, h}.
const SW_X1 = PAD + SW.side;
const SW_ZONES = { out: { x: SW_X1, y: -EXT, w: REACH, h: SWG.h + 2 * EXT } };

// Generic gate hit zones from its geometry: each input gets a vertical slice of the left edge
// split at the midpoint between neighbouring pins (matches AND's in0/in1 split for the 2-pin case),
// the output gets the whole right edge starting at the body (same idiom as AND_ZONES.out).
function gateZones(g) {
  const zones = {};
  const ys = g.in.map(([, y]) => y);
  g.in.forEach(([x, y], i) => {
    const top = i === 0 ? -EXT : (ys[i - 1] + y) / 2;
    const bottom = i === ys.length - 1 ? g.h + EXT : (y + ys[i + 1]) / 2;
    zones[`in${i}`] = { x: x - REACH, y: top, w: REACH, h: bottom - top };
  });
  zones.out = { x: g.out[0], y: -EXT, w: REACH, h: g.h + 2 * EXT };
  return zones;
}

// One geometry + zone set per gate type, built once (same pattern as SWG/LAMPG above).
const GATE_GEOM = {
  AND: andGeom(), OR: orGeom(), NOT: notGeom(), NAND: nandGeom(), NOR: norGeom(), XOR: xorGeom(),
};
const GATE_ZONES = Object.fromEntries(Object.entries(GATE_GEOM).map(([type, g]) => [type, gateZones(g)]));

const LAMP_KX = LAMPG.in[0];
const LAMP_ZONES = { in0: { x: LAMP_KX - REACH, y: -EXT, w: REACH, h: LAMPG.h + 2 * EXT } };

// T4-tt: port geometry for the App's zone resolver. body = the part's ink box (node-local), pins = { handle: [x, y] }.
export function portGeom(kind, type) {
  if (kind === 'S') return { w: SWG.w, h: SWG.h, zones: SW_ZONES, pins: { out: SWG.out } };
  if (kind === 'L') return { w: LAMPG.w, h: LAMPG.h, zones: LAMP_ZONES, pins: { in0: LAMPG.in } };
  const g = GATE_GEOM[type];
  return { w: g.w, h: g.h, zones: GATE_ZONES[type], pins: { ...Object.fromEntries(g.in.map((p, i) => [`in${i}`, p])), out: g.out } };
}

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
// The box is centred on the knob, so the edge endpoint sits on the knob's centreline (y exact).
// The hit area (::after) tiles the node's side instead, via CSS vars set from `zone`.
function Handle({ nodeId, data, at, zone: base, ...p }) {
  const zone = data.zones?.[p.id] ?? base; // clipped by App.jsx so no zone overlaps a neighbour's body or zone
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); data.onPort(p.id); } };
  const left = at[0] - HB / 2, top = at[1] - HB / 2;
  return <RFHandle {...p} tabIndex={0} role="button" onKeyDown={key}
    style={{ left, top, width: HB, height: HB,
      '--hit-left': `${zone.x - left}px`, '--hit-top': `${zone.y - top}px`, '--hit-w': `${zone.w}px`, '--hit-h': `${zone.h}px` }}
    className={`port ${data.pending === nodeId && p.id === 'out' ? 'picked' : ''}`}
    aria-label={`${nodeId} ${p.id === 'out' ? 'output' : 'input ' + (+p.id.slice(2) + 1)}`} />;
}

// Outline = one path (body + knobs, one continuous stroke). Lit = second path: the true inset contour.
// bubble (NAND/NOR/NOT) and extraCurve (XOR) are optional extra ink paths, same stroke system.
// Inverting gates: the body shows the value before the NOT, the bubble shows the output.
// Pin bleed (Tony's sketch): the lit body fill flows OUT through the pin as a 6px neck and becomes the wire, one
// orange piece. The neck is drawn over the ink, so the outline opens exactly where the orange passes and the knob's
// ink wraps around the neck on both sides; everywhere else the outline stays ink. When the body behind a lit pin is
// unlit (e.g. one input of an AND at 1), the neck stops at the outline's inner ink edge: the wire's 1 enters, nothing to join.
export const XORV = 'e2';
// Midline where the dotted empty half meets the orange half: f1 = orange dots, f2 = no midline, f3 = grey dots; f1/f3 sit 4px into the paper, off the orange edge.
export const MIDV = 'f2';
const KI = KNOB + 5; // 2px past // knob ink tip from the pin centreline (the wire end lands inside it)
const HALF = STROKE / 2; // half the outline/wire weight: the neck's half-width, so it butts the ink flush
const DEEP = INSET + HALF; // reaches half a stroke into the lit inset contour so the joint has no seam
const band = (x0, x1, y, h) => `M${Math.min(x0, x1)} ${y - h}H${Math.max(x0, x1)}V${y + h}H${Math.min(x0, x1)}Z`;
const neck = (x0, x1, y) => band(x0, x1, y, HALF);
// Lit pins (Tony's bulb sketch, jn round): a pin at 1 fills its knob solid orange and the wire flows into it as ONE
// tapered shape: the 3px wire widens (tangent hull of two circles) into a disk that fills the knob inside its ink ring.
// The knob ink stays, opened only a wire's width where the orange passes (the neck). Same for inversion bubbles:
// the bubble's disk fills and the wire tapers out of it. When the body behind the pin is lit, the disk also joins
// the body's inset fill (one orange piece, as before). Unlit pins are unchanged.
const BULB = KNOB - HALF - 2; // disk radius: 2px of paper inside the knob ink ring
function bulb(cx, cy, r0, tx, r1) { // hull of circle (cx,cy,r0) and circle (tx,cy,r1), sampled as a polygon
  const d = Math.abs(tx - cx), u = Math.sign(tx - cx), phi = Math.acos(Math.min(1, (r0 - r1) / d)), pts = [];
  const arc = (x, r, a0, a1) => { for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; pts.push([x + u * r * Math.cos(a), cy + r * Math.sin(a)]); } };
  arc(tx, r1, -phi, phi);                 // round tip, around the far side of the small circle
  arc(cx, r0, phi, 2 * Math.PI - phi);    // around the back of the disk
  return 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z';
}
function bleeds(g, lit, bodyLit, on) {
  if (!lit) return { fill: '', neck: '' };
  let fill = '', nk = '';
  const ins = Array.isArray(g.in?.[0]) ? g.in : g.in ? [g.in] : [];
  const multi = ins.length > 1;
  // XOR: its knob tips touch the extra back curve; the extra curve stays ink over the neck (e2, the wire hops it).
  ins.forEach(([x, y], i) => {
    if (!lit.in?.[i]) return;
    fill += bulb(x, y, BULB, x - KI, HALF);
    if (bodyLit || multi) fill += band(x, x + DEEP, y, BULB);
    nk += neck(x - KI, x - KNOB + 2 * HALF + 2, y);
  });
  if (g.out && lit.out) {
    const [x, y] = g.out;
    if (g.bubble) { if (on) { const cx = x - BUB; fill += bulb(cx, y, BUB - HALF - 2, x + 6, HALF); nk += neck(x - 2 * HALF - 2, x + 10, y); } }
    else {
      fill += bulb(x, y, BULB, x + KI, HALF);
      if (bodyLit) fill += band(x - DEEP, x, y, BULB);
      nk += neck(x + KNOB - 2 * HALF - 2, x + KI, y);
    }
  }
  return { fill, neck: nk };
}

function Shape({ g, on, idle, lit, hit }) {
  const bodyLit = !idle && (g.bubble ? !on : on);
  const z = idle ? { fill: '', neck: '' } : bleeds(g, lit, bodyLit, on);
  // Half fills: body unlit, some inputs lit -> the inset clipped to the lit inputs' halves (split at the midline).
  const cid = useId();
  const halves = !idle && !bodyLit && lit && Array.isArray(g.in?.[0]) && g.in.length > 1
    ? g.in.map((_, i) => lit.in?.[i] && (i === 0 ? [0, g.h / 2] : [g.h / 2, g.h])).filter(Boolean) : [];
  return (
    <svg className="shape" width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden="true">
      {g.extraCurve && <path className="body line" d={g.extraCurve} />}
      <path className={hit ? 'body hit' : 'body'} d={g.outline} {...hit} />
      {g.bubble && <path className={hit ? 'body hit' : 'body'} d={g.bubble} {...hit} />}
      {!idle && (g.bubble ? !on : on) && <path className="lit" d={g.inset} />}
      {!idle && g.bubble && on && <path className="lit" d={g.bubbleInset} />}
      {halves.length > 0 && <>
        <clipPath id={cid}>{halves.map(([y0, y1], i) => <rect key={i} x={0} y={y0} width={g.w} height={y1 - y0} />)}</clipPath>
        <path className="lit" d={g.inset} clipPath={`url(#${cid})`} />
      </>}
      {z.fill && z.fill.split('Z').filter(Boolean).map((d, i) => <path key={i} className="lit" d={d + 'Z'} />)}
      {z.fill && <path className="body line" d={g.outline} />}
      {z.fill && g.bubble && <path className="body line" d={g.bubble} />}
      {z.neck && <path className="lit" d={z.neck} />}
      {g.extraCurve && XORV === 'e2' && z.fill && <path className="body line" d={g.extraCurve} />}
      {halves.length === 1 && (() => {
        // Tony's sketch: the unlit half = a dotted outline of its empty wedge, and the unlit pin's stub dots into it.
        // Same dots as the free-pin stubs (.stubs line): --ink-2, 2px, 2 4, butt.
        const j = halves[0][0] === 0 ? 1 : 0, [px, py] = g.in[j], off = MIDV === 'f2' ? 0 : 4;
        return <g className="dots">
          <clipPath id={cid + 'o'}><rect x={0} y={j ? g.h / 2 + off : 0} width={g.w} height={g.h / 2 - off} /></clipPath>
          <clipPath id={cid + 'i'}><path d={g.inset} /></clipPath>
          <path d={g.inset} clipPath={`url(#${cid}o)`} />
          {MIDV !== 'f2' && <line className={MIDV === 'f1' ? 'one' : ''} x1={0} x2={g.w} clipPath={`url(#${cid}i)`}
            y1={g.h / 2 + (j ? off : -off)} y2={g.h / 2 + (j ? off : -off)} />}
          <line x1={px - KNOB + HALF} x2={px + INSET} y1={py} y2={py} />
        </g>;
      })()}
    </svg>
  );
}

// Palette glyph: the same Shape a node draws, never lit (a part in the tray has no value yet), sized by CSS (--gw = geometry width in px at 1440).
export function Glyph({ kind, type }) {
  const g = kind === 'S' ? SWG : kind === 'L' ? LAMPG : GATE_GEOM[type];
  return <span className="glyph" style={{ '--gw': g.w, '--gh': g.h }}><Shape g={g} idle /></span>;
}

// Free-pin stubs (Tony's sketch): a dotted lead on every pin with no wire yet, drawn exactly over that pin's grab
// zone (from the knob's ink tip out to the zone edge), so what you see is what you can grab. They vanish once wired
// (RUI p.205: supporting UI only while it does something); --ink-2 dots at rule weight = a quiet, shape-coded cue.
const TIP = KNOB + 3; // knob ink tip, measured from the pin's centreline
function Stubs({ ins = [], out, wired }) {
  const seg = (x0, x1, y, k) => <line key={k} className={k === 'o' ? 's-out' : 's-in' + k} x1={x0} y1={y} x2={x1} y2={y} />;
  return (
    <svg className="stubs" aria-hidden="true">
      {ins.map(([x, y], i) => !wired.in[i] && seg(x - TIP, x - REACH, y, i))}
      {out && !wired.out && seg(out[0] + TIP, out[0] + REACH, out[1], 'o')}
    </svg>
  );
}

// Optical centre (RUI: centre by visual weight, not by box): x of the filled outline's area centroid. The bubble and
// pointed noses stretch the box without adding mass, so box-centre sat 5-18px right of the shape's mass (measured).
const mass = (() => {
  const memo = new Map();
  return (g) => {
    if (memo.has(g)) return memo.get(g);
    const c = document.createElement('canvas'); c.width = Math.ceil(g.w); c.height = Math.ceil(g.h);
    const x = c.getContext('2d'); x.fill(new Path2D(g.outline)); if (g.bubble) x.fill(new Path2D(g.bubble));
    const d = x.getImageData(0, 0, c.width, c.height).data; let sx = 0, sy = 0, n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 127) { const p = (i - 3) / 4; sx += p % c.width; sy += Math.floor(p / c.width); n++; }
    const v = n ? [sx / n, sy / n] : [g.w / 2, g.h / 2]; memo.set(g, v); return v;
  };
})();

// Delete X on node hover, on the top edge at the shape's optical centre (Tony's sketch). Not inside the body (variant E):
// the centre is where a node is grabbed, so an X there blocked dragging and turned a grab-click into a delete.
// Right-click still deletes (testing).
// Restored from pit2/archive-T2: the X shows ONLY while the pointer is inside the drawn shape (outline + bubble fill,
// SVG hit test, pointer-events: visiblePainted), never for the node box, a pin zone or the gap around it. A 150ms grace
// lets the pointer travel from the shape onto the X (same idiom as Wire.jsx); the X's own hover keeps it up.
function useShapeHover() {
  const [on, set] = useState(false), t = useRef(0);
  const enter = () => { clearTimeout(t.current); set(true); };
  const leave = () => { t.current = setTimeout(() => set(false), 150); };
  return [on, { onPointerEnter: enter, onPointerLeave: leave }, (v) => (v ? enter() : leave())];
}
const X = ({ g, label, data, show, onHover }) => !data.reject && <Remove label={label} onRemove={data.onRemove}
  onHover={onHover} className={show ? 'show' : ''}
  style={{ position: 'absolute', left: mass(g)[0], top: PAD, transform: 'translate(-50%, -50%) scale(var(--rs))' }} />;

// Pin heights in node-local coordinates, for snap guides: { ins: [y...], out: y | null }.
export function pinYs(kind, type) {
  if (kind === 'S') return { ins: [], out: SWG.out[1] };
  if (kind === 'L') return { ins: [LAMPG.in[1]], out: null };
  const g = GATE_GEOM[type]; return { ins: g.in.map(([, y]) => y), out: g.out[1] };
}

// Name plate (T3 Swedish "skylt"). Switch + lamp: a keyline plate = "this is a table column"; lit orange when the
// part is 1 (orange = logic 1 only). Gate: bare name, no plate (gates are not table columns). Hung under the outline,
// pointer-events none, so it never widens the node's hover (the delete X keeps its own hit rule).
export const PLATE = (import.meta.env.DEV && new URLSearchParams(location.search).get('plate')) || 'hang'; // 'hang' (8u gap) | 'tab' (joined to the outline) | 'ink' (inverted plate)
function Plate({ g, x, name, on, bare }) {
  if (!name) return null;
  return <span className={`plate p-${PLATE} ${bare ? 'bare' : ''} ${on && !bare ? 'on' : ''}`} aria-hidden="true"
    style={{ left: x, top: g.h - PAD }}>{name}</span>;
}

// T4 error mark: the one non-text signal on a refused port (words belong to the comic balloon). One shape: a SOLID
// ring round the knob at the wire weight (dots already mean "free pin"). r 24 flow px = 48 px across at 1440, 34 at 1024.
const MARK_R = 24;
function Mark({ data, at }) {
  const r = data.reject;
  if (!r) return null;
  const p = at[r.handle];
  if (!p) return null;
  return <svg className="mark" aria-hidden="true"><circle cx={p[0]} cy={p[1]} r={MARK_R} /></svg>;
}

export function SwitchNode({ id, data }) {
  const [inside, hit, xHover] = useShapeHover();
  return (
    <div className="node sw" style={{ width: SWG.w, height: SWG.h }}>
      <Shape g={SWG} on={data.on} lit={data.lit} hit={hit} />
      <Stubs out={SWG.out} wired={data.wired} />
      <X g={SWG} label="Delete switch" data={data} show={inside} onHover={xHover} />
      <Plate g={SWG} x={PAD + SW.side / 2} name={data.name} on={data.on} />
      <Mark data={data} at={{ out: SWG.out }} />
      <button {...hit} className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); data.onToggle(); }} aria-pressed={!!data.on}
        aria-label={`Switch ${data.name ?? id}, ${data.on ? 'on' : 'off'}`} />
      <Handle nodeId={id} data={data} at={SWG.out} zone={SW_ZONES.out} type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function GateNode({ id, data }) {
  const g = GATE_GEOM[data.type], zones = GATE_ZONES[data.type];
  const [inside, hit, xHover] = useShapeHover();
  return (
    <div className="node gate" style={{ width: g.w, height: g.h }} role="img" aria-label={`${data.type} gate ${data.name ?? ''}, output ${data.on ? 1 : 0}`}>
      <Shape g={g} on={data.on} lit={data.lit} hit={hit} />
      <Stubs ins={g.in} out={g.out} wired={data.wired} />
      <X g={g} label={`Delete ${data.type} gate`} data={data} show={inside} onHover={xHover} />
      <Plate g={g} x={mass(g)[0]} name={data.name} bare />
      <Mark data={data} at={{ ...Object.fromEntries(g.in.map((p, i) => [`in${i}`, p])), out: g.out }} />
      {g.in.map((at, i) => (
        <Handle key={i} nodeId={id} data={data} at={at} zone={zones[`in${i}`]} type="target" position={Position.Left} id={`in${i}`} />
      ))}
      <Handle nodeId={id} data={data} at={g.out} zone={zones.out} type="source" position={Position.Right} id="out" />
      {data.reject && (
        <Say phrase={data.reject.phrase} text={data.reject.text} className="say-part" role="alert" />
      )}
    </div>
  );
}

export function LampNode({ id, data }) {
  const [inside, hit, xHover] = useShapeHover();
  return (
    <div className="node lamp" style={{ width: LAMPG.w, height: LAMPG.h }} role="img" aria-label={`Lamp ${data.name ?? ''} ${data.on ? 'on' : 'off'}`}>
      <Shape g={LAMPG} on={data.on} lit={data.lit} hit={hit} />
      <Stubs ins={[LAMPG.in]} wired={data.wired} />
      <X g={LAMPG} label="Delete lamp" data={data} show={inside} onHover={xHover} />
      <Plate g={LAMPG} x={PAD + 45} name={data.name} on={data.on} />
      <Mark data={data} at={{ in0: LAMPG.in }} />
      <Handle nodeId={id} data={data} at={LAMPG.in} zone={LAMP_ZONES.in0} type="target" position={Position.Left} id="in0" />
      {data.reject && <Say phrase={data.reject.phrase} text={data.reject.text} className="say-part" role="alert" />}
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
