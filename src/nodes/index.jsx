import { Handle as RFHandle, Position, useStore, useUpdateNodeInternals } from '@xyflow/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import Remove from '../Remove.jsx';
import { switchGeom, andGeom, orGeom, notGeom, nandGeom, norGeom, xorGeom, lampGeom, SW, PAD, configure } from './geom.js';
import * as G from './geom.js';

const BASE = { B: 4 }[typeof document !== 'undefined' && document.documentElement.dataset.v] ?? 6;
const CACHE = new Map();
// Geometry set for detail scale k (quantized to 0.05 so zooming rebuilds at most ~40 sets).
function build(k) {
  const q = Math.round(k * 20) / 20, key = q;
  if (CACHE.has(key)) return CACHE.get(key);
  configure(q, BASE);
  const KNOB = G.KNOB, REACH = KNOB + 30, TIP = KNOB + G.STROKE / 2;
  const SWG = switchGeom(), LAMPG = lampGeom();
  const SW_X1 = PAD + SW.side;
  const SW_ZONES = { out: { x: SW_X1, y: 0, w: REACH, h: SWG.h } };
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
  const GATE_GEOM = { AND: andGeom(), OR: orGeom(), NOT: notGeom(), NAND: nandGeom(), NOR: norGeom(), XOR: xorGeom() };
  const GATE_ZONES = Object.fromEntries(Object.entries(GATE_GEOM).map(([t, g]) => [t, gateZones(g)]));
  const LAMP_ZONES = { in0: { x: LAMPG.in[0] - REACH, y: 0, w: REACH, h: LAMPG.h } };
  const set = { SWG, LAMPG, SW_ZONES, GATE_GEOM, GATE_ZONES, LAMP_ZONES, REACH, TIP, HB: 2 * (KNOB + q) };
  CACHE.set(key, set); return set;
}
// Detail scale for a node: --k = frame scale / viewport zoom. Frame scale = canvas width / 1440 approximated by the
// React Flow pane width / 906 (canvas column is 906u).
function useGeo(id) {
  const k = useStore((s) => (s.width / 906) / s.transform[2]);
  const set = build(document.documentElement.dataset.v ? k : 1), upd = useUpdateNodeInternals(); // main: details zoom with the canvas
  useEffect(() => { upd(id); }, [set, id, upd]);
  return set;
}
const { SWG, LAMPG, GATE_GEOM } = build(1); // k = 1 set for the palette glyphs and pinYs

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
// The box is centred on the knob, so the edge endpoint sits on the knob's centreline (y exact).
// The hit area (::after) tiles the node's side instead, via CSS vars set from `zone`.
function Handle({ nodeId, data, at, zone, HB = 20, ...p }) {
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
  const ref = useRef(null);
  // T1 it.2 pixel snap: a 2px rule is crisp only when its centreline sits on a device-px boundary. Pick the scale so the
  // body's straight run (gate H 84 / switch side 62) is a whole number of px, then shift the svg so the PAD corner
  // (top-left straight edges' centreline) lands on a whole px. Arcs stay anti-aliased (they must).
  useLayoutEffect(() => {
    const el = ref.current?.querySelector('svg'); if (!el || !document.documentElement.dataset.v) return;
    const fit = () => {
      el.style.cssText = ''; const box = el.parentNode.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      const sc0 = box.width / g.w, body = kind === 'S' ? SW.side : kind === 'L' ? 0 : 84;
      const sc = body ? Math.round(body * sc0 * dpr) / dpr / body : sc0;
      const snap = (v) => Math.round(v * dpr) / dpr - v;
      // Chromium pixel-snaps a replaced element's box before painting (measured: +0.34px drift otherwise), so start from the rounded box.
      const dx = snap(Math.round(box.left) + PAD * sc), dy = snap(Math.round(box.top) + PAD * sc);
      el.style.cssText = `width:${g.w * sc}px;height:${g.h * sc}px;transform:translate(${dx}px,${dy}px)`;
    };
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, [g, kind]);
  return <span ref={ref} className="glyph" style={{ '--gw': g.w, '--gh': g.h }}><Shape g={g} idle /></span>;
}

// Free-pin stubs (Tony's sketch): a dotted lead on every pin with no wire yet, drawn exactly over that pin's grab
// zone (from the knob's ink tip out to the zone edge), so what you see is what you can grab. They vanish once wired
// (RUI p.205: supporting UI only while it does something); --ink-2 dots at rule weight = a quiet, shape-coded cue.
function Stubs({ ins = [], out, wired, geo }) {
  const { TIP, REACH } = geo;
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

export function SwitchNode({ id, data }) {
  const geo = useGeo(id), { SWG, SW_ZONES } = geo;
  return (
    <div className="node sw" style={{ width: SWG.w, height: SWG.h }}>
      <Shape g={SWG} on={data.on} />
      <Stubs out={SWG.out} wired={data.wired} geo={geo} />
      <X g={SWG} label="Delete switch" data={data} />
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); data.onToggle(); }} aria-pressed={!!data.on}
        aria-label={`Switch ${NAMES[id] ?? id}, ${data.on ? 'on' : 'off'}`} />
      <Handle nodeId={id} data={data} at={SWG.out} zone={SW_ZONES.out} HB={geo.HB} type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function GateNode({ id, data }) {
  const geo = useGeo(id), g = geo.GATE_GEOM[data.type], zones = geo.GATE_ZONES[data.type];
  const rejectPin = data.reject && +data.reject.handle.slice(2);
  return (
    <div className="node gate" style={{ width: g.w, height: g.h }} role="img" aria-label={`${data.type} gate, output ${data.on ? 1 : 0}`}>
      <Shape g={g} on={data.on} />
      <Stubs ins={g.in} out={g.out} wired={data.wired} geo={geo} />
      <X g={g} label={`Delete ${data.type} gate`} data={data} />
      {g.in.map((at, i) => (
        <Handle key={i} nodeId={id} data={data} at={at} zone={zones[`in${i}`]} HB={geo.HB} type="target" position={Position.Left} id={`in${i}`} />
      ))}
      <Handle nodeId={id} data={data} at={g.out} zone={zones.out} HB={geo.HB} type="source" position={Position.Right} id="out" />
      {data.reject && (
        <p className="reject" role="alert" style={{ top: g.in[rejectPin][1] }}>{data.reject.text}</p>
      )}
    </div>
  );
}

export function LampNode({ id, data }) {
  const geo = useGeo(id), { LAMPG, LAMP_ZONES } = geo;
  return (
    <div className="node lamp" style={{ width: LAMPG.w, height: LAMPG.h }} role="img" aria-label={data.on ? 'Lamp on' : 'Lamp off'}>
      <Shape g={LAMPG} on={data.on} />
      <Stubs ins={[LAMPG.in]} wired={data.wired} geo={geo} />
      <X g={LAMPG} label="Delete lamp" data={data} />
      <Handle nodeId={id} data={data} at={LAMPG.in} zone={LAMP_ZONES.in0} HB={geo.HB} type="target" position={Position.Left} id="in0" />
      {data.reject && <p className="reject" role="alert" style={{ top: LAMPG.in[1] }}>{data.reject.text}</p>}
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
