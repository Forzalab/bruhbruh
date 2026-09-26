import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Say from './Say.jsx';

// First-visit coach marks (blind test: nobody found wiring or the switch). Five steps; the person's own action
// completes each one, so a step never times out while it waits for them. Only the last (read the table) asks for
// no action: it follows the balloon rule (gone after 3 s or at the next pointer/key). Esc or SKIP ends the tour.
// Two schools, one step list (VARIANT, set per branch; ?coach=a|b overrides for dogfood):
//   a  spotlight   : the page dims to ink 60%, the parts the step needs stay lit (Apple-style coach marks).
//   b  panels      : the page washes to paper 82%, each lit part gets a 3px ink panel frame + numbered caption box.
// The arrow keeps the site's dot rule: dash = w, gap = 2w, butt caps, w = the 2u rule; solid ink head.
export const VARIANT = 'a';
export const TOUR_KEY = 'gob.tour';
export const TOUR_MS = 3000;
const seen = () => { try { return localStorage.getItem(TOUR_KEY) === 'done'; } catch { return false; } };
const markSeen = () => { try { localStorage.setItem(TOUR_KEY, 'done'); localStorage.setItem('gob.paletteHint', '1'); } catch { /* private mode */ } };
export const tourPending = () => !seen();

export const STEPS = [
  { key: 'open', say: 'hint', help: 'Open the parts drawer' },
  { key: 'drag', say: 'tourDrag', help: 'Drag a part onto the canvas' },
  { key: 'wire', say: 'tourWire', help: 'Drag from a pin dot to a pin dot' },
  { key: 'click', say: 'tourClick', help: 'Click a switch square' },
  { key: 'read', say: 'tourRead', help: 'Read the truth table' },
];

// Which elements a step lights, where its arrow runs, and who speaks. All rects are client px.
const q = (s) => document.querySelector(s);
const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? r : null; };
const mid = (r) => [r.left + r.width / 2, r.top + r.height / 2];
function measure(step, circuit, palOpen) {
  const canvas = rect(q('.canvas'));
  if (!canvas) return null;
  if (step === 1 && !palOpen) step = 0; // drawer closed again mid-step: point back at the tab
  if (step === 0) {
    const tab = rect(q('.pal-tab')); if (!tab) return null;
    const [x, y] = mid(tab);
    return { holes: [tab], arrow: [[x + 120, y + 110], [tab.right, y + 8]], say: 'hint', tip: [tab.right, y], k: 'lowleft' };
  }
  if (step === 1) {
    const item = rect(q('.pal-group:nth-child(2) .pal-item')) ?? rect(q('.pal-item')); if (!item) return null;
    const drop = { left: canvas.left + canvas.width * 0.42, top: canvas.top + canvas.height * 0.72, width: canvas.width * 0.16, height: canvas.height * 0.2 };
    drop.right = drop.left + drop.width; drop.bottom = drop.top + drop.height;
    return { holes: [item, drop], drop: true, arrow: [[item.right, mid(item)[1]], mid(drop)], say: 'tourDrag', tip: [item.right - item.width * 0.2, item.top + item.height * 0.15] };
  }
  const nodes = Object.values(circuit.nodes), wires = Object.values(circuit.wires);
  const el = (id) => q(`.react-flow__node[data-id="${id}"]`);
  const hnd = (id, h) => rect(el(id)?.querySelector(`.react-flow__handle[data-handleid="${h}"]`));
  if (step === 2) {
    const sw = nodes.find((n) => n.kind === 'S' && !wires.some((w) => w.source === n.id)) ?? nodes.find((n) => n.kind === 'S');
    const pins = (n) => (n.kind === 'L' || n.type === 'NOT' ? [0] : [0, 1]);
    let dst = null;
    for (const n of nodes) if (n.kind === 'G') { const p = pins(n).find((i) => !wires.some((w) => w.target === n.id && w.pin === i)); if (p != null) { dst = [n.id, p]; break; } }
    if (!sw || !dst) return null;
    const a = hnd(sw.id, 'out'), b = hnd(dst[0], `in${dst[1]}`), sa = rect(el(sw.id)), sb = rect(el(dst[0]));
    if (!a || !b || !sa || !sb) return null;
    return { holes: [sa, sb], arrow: [mid(a), mid(b)], say: 'tourWire', tip: [mid(a)[0] - 4, sa.top - 6], from: a, to: b };
  }
  if (step === 3) {
    const sw = nodes.find((n) => n.kind === 'S' && wires.some((w) => w.source === n.id)) ?? nodes.find((n) => n.kind === 'S');
    const btn = sw && rect(el(sw.id)?.querySelector('.switch')), box = sw && rect(el(sw.id)); if (!btn || !box) return null;
    const [x, y] = mid(btn);
    return { holes: [box], arrow: [[x + 110, y - 90], [x, y]], say: 'tourClick', tip: [x, box.top - 6], to: btn };
  }
  const t = rect(q('.truth')); if (!t) return null;
  const live = rect(q('.truth tr.live')) ?? t;
  return { holes: [t], arrow: [[t.left - 90, mid(live)[1] + 70], [live.left, mid(live)[1]]], say: 'tourRead', tip: [t.left - 6, t.top + t.height * 0.12], to: live };
}

// Arrow: from a -> b, stopping GAP short of both ends, head = solid triangle 5w long. Gentle bow (one quadratic).
function Arrow({ a, b, w, ink }) {
  const GAP = 6 * w, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L < 3 * GAP) return null;
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  const bow = Math.min(0.12 * L, 40); // perpendicular sag of the control point
  const c = [(a[0] + b[0]) / 2 + uy * bow, (a[1] + b[1]) / 2 - ux * bow];
  // end direction = tangent at t=1: (b - c)
  const s = [a[0] + ux * GAP, a[1] + uy * GAP];
  const tl = Math.hypot(b[0] - c[0], b[1] - c[1]), tx = (b[0] - c[0]) / tl, ty = (b[1] - c[1]) / tl;
  const tip = [b[0] - tx * GAP, b[1] - ty * GAP], H = 5 * w, base = [tip[0] - tx * H, tip[1] - ty * H];
  const head = `M${tip[0]} ${tip[1]}L${base[0] - ty * H * 0.55} ${base[1] + tx * H * 0.55}L${base[0] + ty * H * 0.55} ${base[1] - tx * H * 0.55}Z`;
  return (
    <g className={`coach-arrow ${ink ? '' : 'on-veil'}`} data-tip={`${tip[0]},${tip[1]}`} data-dir={`${tx},${ty}`}>
      <path className="halo" d={`M${s[0]} ${s[1]}Q${c[0]} ${c[1]} ${base[0]} ${base[1]}`} strokeWidth={w * 3} />
      <path className="shaft" d={`M${s[0]} ${s[1]}Q${c[0]} ${c[1]} ${base[0]} ${base[1]}`} strokeWidth={w} strokeDasharray={`${w} ${2 * w}`} />
      <path className="head" d={head} />
    </g>
  );
}

export default function Coach({ circuit, palOpen, parts, slot, variant: v0 = VARIANT }) {
  const variant = (import.meta.env.DEV && new URLSearchParams(location.search).get('coach')) || v0;
  const [step, setStep] = useState(() => (seen() ? -1 : 0));
  const [geo, setGeo] = useState(null);
  const box = useRef(null);
  const base = useRef({ parts, wires: Object.keys(circuit.wires).length, sw: '' });
  const swSig = Object.values(circuit.nodes).filter((n) => n.kind === 'S').map((n) => `${n.id}${+!!n.value}`).join();
  const nWires = Object.keys(circuit.wires).length;
  const end = () => { setStep(-1); markSeen(); };
  const replay = () => { base.current = { parts, wires: nWires, sw: swSig }; setStep(0); }; // row 03 help button
  // Advance on the person's own action.
  useEffect(() => {
    const b = base.current;
    if (step === 0 && palOpen) setStep(1);
    else if (step === 1 && parts > b.parts) setStep(2);
    else if (step === 2 && nWires > b.wires) { b.sw = swSig; setStep(3); }
    else if (step === 3 && swSig !== b.sw) setStep(4);
    if (step < 2) { b.parts = Math.min(b.parts, parts); b.wires = nWires; } // a delete before the step still counts the next add
    if (step === 2) b.sw = swSig;
  }, [step, palOpen, parts, nWires, swSig]);
  // Last step: the balloon rule (3 s or the next action). Esc ends any step.
  useEffect(() => {
    if (step < 0) return;
    const esc = (e) => { if (e.key === 'Escape') end(); };
    addEventListener('keydown', esc);
    if (step !== 4) return () => removeEventListener('keydown', esc);
    const t = setTimeout(end, TOUR_MS);
    const any = (e) => { if (!e.target.closest?.('.coach-bar')) end(); };
    addEventListener('pointerdown', any, true); addEventListener('keydown', any, true);
    return () => { clearTimeout(t); removeEventListener('keydown', esc); removeEventListener('pointerdown', any, true); removeEventListener('keydown', any, true); };
  }, [step]);
  // Track the targets every frame while the tour runs (parts move, the drawer slides); state only changes on a change.
  useLayoutEffect(() => {
    if (step < 0) return setGeo(null);
    let raf, last = '';
    const tick = () => {
      const app = box.current?.parentElement?.getBoundingClientRect();
      const m = app && measure(step, circuit, palOpen);
      if (m) { const o = [app.left, app.top];
        const sh = (r) => ({ x: r.left - o[0], y: r.top - o[1], w: r.width, h: r.height });
        const g = { ...m, holes: m.holes.map(sh), arrow: m.arrow.map((p) => [p[0] - o[0], p[1] - o[1]]), tip: [m.tip[0] - o[0], m.tip[1] - o[1]], W: app.width, H: app.height };
        const s = JSON.stringify(g); if (s !== last) { last = s; setGeo(g); } }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step, circuit, palOpen]);

  const bar = slot && createPortal(step < 0 ? <button className="coach-replay" onClick={replay}>Show me how</button> : (
    <div className="coach-bar" role="status">
      <span className="n">{step + 1}/{STEPS.length}</span>
      {variant === 'c' && <span className="what">{STEPS[step].help}</span>}
      <span className="sr">{variant === 'c' ? '' : STEPS[step].help}</span>
      <button onClick={end}>Skip</button>
    </div>), slot);
  if (step < 0 || !geo) return <><div ref={box} hidden />{bar}</>;
  const w = Math.max(1, Math.round(2 * geo.W / 1440)); // the 2u rule, whole px
  const pad = Math.round(10 * geo.W / 1440);
  const holes = geo.holes.map((r) => ({ x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad }));
  const veil = `M0 0H${geo.W}V${geo.H}H0Z` + holes.map((r) => `M${r.x} ${r.y}v${r.h}h${r.w}v${-r.h}Z`).join('');
  return (
    <>
      <div ref={box} className={`coach coach-${variant}`} aria-hidden="true">
        <svg width={geo.W} height={geo.H}>
          {variant !== 'c' && <path className="veil" d={veil} fillRule="evenodd" />}
          {variant === 'b' && holes.map((r, i) => <rect key={i} className="panel" x={r.x} y={r.y} width={r.w} height={r.h} />)}
          {geo.drop && <rect className="drop" x={geo.holes[1].x} y={geo.holes[1].y} width={geo.holes[1].w} height={geo.holes[1].h}
            strokeWidth={w} strokeDasharray={`${w} ${2 * w}`} />}
          <Arrow a={geo.arrow[0]} b={geo.arrow[1]} w={w} ink={variant !== 'a'} />
        </svg>
        {variant === 'b' && <span className="cap" style={{ left: holes[0].x, top: holes[0].y }}>{step + 1}</span>}
        {variant !== 'c' && <Say phrase={geo.say} role="presentation" className="coach-say"
          text="" key={step} />}
        <style>{`.coach-say{--ax:${geo.tip[0]}px;--ay:${geo.tip[1]}px}`}</style>
      </div>
      {bar}
    </>
  );
}
