import { Handle as RFHandle, Position, useStore } from '@xyflow/react';
import Remove from '../Remove.jsx';
import { TAKEN_VIEWBOX, TAKEN_EMPH, LOOP_VIEWBOX, LOOP_EMPH } from '../t4Lettering.js';
import { switchGeom, andGeom, orGeom, notGeom, nandGeom, norGeom, xorGeom, lampGeom, SW, PAD, KNOB } from './geom.js';

const SWG = switchGeom(), LAMPG = lampGeom();
const HB = 20; // handle box centred on the knob chord: the wire end lands 10px out, inside the knob ink ring (6..12)
const REACH = KNOB + 30; // how far a hit zone extends past the knob tip

// Per-node hit zones (Tony's sketch): the region between the gate body and the node edge, tiled
// by port so each side is fully covered with no gaps or overlaps. Rects are in node-local
// coordinates (same space as geom.js's `at` points), {x, y, w, h}.
const SW_X1 = PAD + SW.side;
const SW_ZONES = { out: { x: SW_X1, y: 0, w: REACH, h: SWG.h } };

// Generic gate hit zones from its geometry: each input gets a vertical slice of the left edge
// split at the midpoint between neighbouring pins (matches AND's in0/in1 split for the 2-pin case),
// the output gets the whole right edge starting at the body (same idiom as AND_ZONES.out).
function gateZones(g) {
  const zones = {};
  const ys = g.in.map(([, y]) => y);
  g.in.forEach(([x, y], i) => {
    const top = i === 0 ? 0 : (ys[i - 1] + y) / 2;
    const bottom = i === ys.length - 1 ? g.h : (y + ys[i + 1]) / 2;
    zones[`in${i}`] = { x: x - REACH, y: top, w: REACH, h: bottom - top };
  });
  zones.out = { x: g.out[0], y: 0, w: REACH, h: g.h };
  return zones;
}

// One geometry + zone set per gate type, built once (same pattern as SWG/LAMPG above).
const GATE_GEOM = {
  AND: andGeom(), OR: orGeom(), NOT: notGeom(), NAND: nandGeom(), NOR: norGeom(), XOR: xorGeom(),
};
const GATE_ZONES = Object.fromEntries(Object.entries(GATE_GEOM).map(([type, g]) => [type, gateZones(g)]));

const LAMP_KX = LAMPG.in[0];
const LAMP_ZONES = { in0: { x: LAMP_KX - REACH, y: 0, w: REACH, h: LAMPG.h } };

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
// The box is centred on the knob, so the edge endpoint sits on the knob's centreline (y exact).
// The hit area (::after) tiles the node's side instead, via CSS vars set from `zone`.
function Handle({ nodeId, data, at, zone, ...p }) {
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
function Shape({ g, on, idle }) {
  return (
    <svg className="shape" width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden="true">
      {g.extraCurve && <path className="body line" d={g.extraCurve} />}
      <path className="body" d={g.outline} />
      {g.bubble && <path className="body" d={g.bubble} />}
      {!idle && (g.bubble ? !on : on) && <path className="lit" d={g.inset} />}
      {!idle && g.bubble && on && <path className="lit" d={g.bubbleInset} />}
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
  const seg = (x0, x1, y, k) => <line key={k} x1={x0} y1={y} x2={x1} y2={y} />;
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
const X = ({ g, label, data }) => <Remove label={label} onRemove={data.onRemove}
  style={{ position: 'absolute', left: mass(g)[0], top: PAD, transform: 'translate(-50%, -50%) scale(var(--rs))' }} />;

// Pin heights in node-local coordinates, for snap guides: { ins: [y...], out: y | null }.
export function pinYs(kind, type) {
  if (kind === 'S') return { ins: [], out: SWG.out[1] };
  if (kind === 'L') return { ins: [LAMPG.in[1]], out: null };
  const g = GATE_GEOM[type]; return { ins: g.in.map(([, y]) => y), out: g.out[1] };
}

const NAMES = { s1: 'A', s2: 'B' };

// T4: in-place error mark on the offending input pin. at = pin centre (node-local px), r = { text, reason }.
// Static (no motion): appears on release, holds 2400 ms or until the next pointerdown (App.jsx).
const ERR = new URLSearchParams(location.search).get('err') || 'occupant';
function Reject({ at, r }) {
  const z = useStore((st) => st.transform[2]); // tag words counter-scale like the delete X: 1/sqrt(zoom)
  const [x, y] = at, tip = x - TIP; // TIP = knob ink tip (12 px left of the pin centre)
  const plug = <path className="rj-plug" d={`M${x} ${y - KNOB}A${KNOB} ${KNOB} 0 0 0 ${x} ${y + KNOB}Z`} />;
  const tag = (cls) => <span className={`rj-tag ${cls}`} style={{ left: x + 3, top: y - KNOB - 8, '--rs': 1 / Math.sqrt(z) }}>{r.text}</span>;
  const ring = <circle className="rj-ring" cx={x} cy={y} r={20} />;
  const svg = (kids) => <svg className="rj" aria-hidden="true">{kids}</svg>;
  if (ERR === 'tag') return <>{svg(plug)}{tag('')}</>;
  if (ERR === 'magenta') return <>{svg(<g className="mag">{plug}</g>)}{tag('mag')}</>;
  if (ERR === 'combo') return <>{svg(<>{ring}{plug}</>)}{tag('')}</>;
  if (ERR === 'hatch') return svg(<>
    <defs><pattern id={`hx${x}${y}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" /></pattern></defs>
    <rect className="rj-hatch" x={tip - 24} y={y - 12} width={24} height={24} fill={`url(#hx${x}${y})`} />{plug}</>);
  if (ERR === 'bubble') {
    const [vb, d] = r.reason === 'loop' ? [LOOP_VIEWBOX, LOOP_EMPH] : [TAKEN_VIEWBOX, TAKEN_EMPH];
    // ellipse 104x44 centred 66 px left and 34 px above the pin; straight tail to the knob tip
    const cx = tip - 56, cy = y - 36, rx = 52, ry = 22;
    return <>{svg(<>{plug}<path className="rj-bub" d={`M${cx + 30} ${cy + ry * Math.sqrt(1 - (30 / rx) ** 2)}A${rx} ${ry} 0 1 1 ${cx + 42} ${cy + ry * Math.sqrt(1 - (42 / rx) ** 2)}L${tip - 2} ${y - 4}Z`} /></>)}
      <svg className="rj-letter" viewBox={vb} style={{ left: cx, top: cy, width: r.reason === 'loop' ? 80 : 60 }} aria-hidden="true"><path d={d} /></svg></>;
  }
  return svg(<>{ring}{plug}</>); // occupant (default): wordless; App dashes the wire(s) that cause it
}

export function SwitchNode({ id, data }) {
  return (
    <div className="node sw" style={{ width: SWG.w, height: SWG.h }}>
      <Shape g={SWG} on={data.on} />
      <Stubs out={SWG.out} wired={data.wired} />
      <X g={SWG} label="Delete switch" data={data} />
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); data.onToggle(); }} aria-pressed={!!data.on}
        aria-label={`Switch ${NAMES[id] ?? id}, ${data.on ? 'on' : 'off'}`} />
      <Handle nodeId={id} data={data} at={SWG.out} zone={SW_ZONES.out} type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function GateNode({ id, data }) {
  const g = GATE_GEOM[data.type], zones = GATE_ZONES[data.type];
  const rejectPin = data.reject && +data.reject.handle.slice(2);
  return (
    <div className="node gate" style={{ width: g.w, height: g.h }} role="img" aria-label={`${data.type} gate, output ${data.on ? 1 : 0}`}>
      <Shape g={g} on={data.on} />
      <Stubs ins={g.in} out={g.out} wired={data.wired} />
      <X g={g} label={`Delete ${data.type} gate`} data={data} />
      {g.in.map((at, i) => (
        <Handle key={i} nodeId={id} data={data} at={at} zone={zones[`in${i}`]} type="target" position={Position.Left} id={`in${i}`} />
      ))}
      <Handle nodeId={id} data={data} at={g.out} zone={zones.out} type="source" position={Position.Right} id="out" />
      {data.reject && <Reject at={g.in[rejectPin]} r={data.reject} />}
    </div>
  );
}

export function LampNode({ id, data }) {
  return (
    <div className="node lamp" style={{ width: LAMPG.w, height: LAMPG.h }} role="img" aria-label={data.on ? 'Lamp on' : 'Lamp off'}>
      <Shape g={LAMPG} on={data.on} />
      <Stubs ins={[LAMPG.in]} wired={data.wired} />
      <X g={LAMPG} label="Delete lamp" data={data} />
      <Handle nodeId={id} data={data} at={LAMPG.in} zone={LAMP_ZONES.in0} type="target" position={Position.Left} id="in0" />
      {data.reject && <Reject at={LAMPG.in} r={data.reject} />}
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
