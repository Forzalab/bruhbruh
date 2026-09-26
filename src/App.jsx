import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, useNodesState, ViewportPortal } from '@xyflow/react';
import { canConnect, canAddSwitch, evaluate } from './sim.js';
import { nodeTypes, pinYs } from './nodes/index.jsx';
import Palette, { DND } from './Palette.jsx';
import Wire from './Wire.jsx';
import Truth from './Truth.jsx';
import Controls from './Controls.jsx';

// T4 prototype switches (mockups only): ?err=tag|hatch|bubble|magenta|occupant &bar=A|B|C &icons=hook|step|arc
const Q = new URLSearchParams(location.search);
export const T4 = { err: Q.get('err') || 'occupant', bar: Q.get('bar') || 'C', icons: Q.get('icons') || 'step' };
const HISTORY = 10; // linear undo stack depth (Tony)
const REJECT_MS = 2400; // an error mark holds this long, or until the next pointerdown

const edgeTypes = { wire: Wire };

// Sim data: the truth. Positions live separately in React Flow (view only).
const START = {
  nodes: {
    s1: { id: 's1', kind: 'S', value: false },
    s2: { id: 's2', kind: 'S', value: false },
    g1: { id: 'g1', kind: 'G', type: 'AND' },
    l1: { id: 'l1', kind: 'L' },
  },
  wires: {},
};

const VIEW = [
  // Canvas origin = (55, 254) at 1440x810. Switch knobs at y 392/592, gate + lamp centred on 492.
  { id: 's1', type: 'S', position: { x: 26, y: 95 }, data: {} },
  { id: 's2', type: 'S', position: { x: 26, y: 295 }, data: {} },
  { id: 'g1', type: 'G', position: { x: 403, y: 184 }, data: {} },
  { id: 'l1', type: 'L', position: { x: 736, y: 181 }, data: {} },
];

let nextWire = 1, nextNode = 1;

// Per-figure spans: each figure gets its own width fit against ref3 (see theme.css, table figures).
// Glyph spans are aria-hidden; one visually hidden run carries the whole word ("01", not "0 1").
const fig = (v) => [<span key="t" className="sr">{String(v)}</span>,
  <span key="g" aria-hidden="true">{[...String(v)].map((c, k) => <span key={k} className={'f' + c}>{c}</span>)}</span>];

export default function App() {
  const [circuit, setCircuit] = useState(START);
  const [view, setView, onViewChange] = useNodesState(VIEW);
  const [showGrid, setShowGrid] = useState(false);
  const [reject, setReject] = useState(null); // inline error beside the failed port (GOV.UK error message)
  const [edgeSel, setEdgeSel] = useState(() => new Set()); // controlled wire selection, so Backspace can delete a wire
  const [pending, setPending] = useState(null); // keyboard wiring: source picked with Enter/Space
  const [status, setStatus] = useState({ text: '', bad: false }); // screen-reader only now (visually hidden live region)
  const [armed, setArmed] = useState(false); // wipe: first click arms, second confirms
  // Palette: open is the person's choice; tucked hides it only while a drag runs, so it comes back as it was.
  const [palOpen, setPalOpen] = useState(false);
  const [tucked, setTucked] = useState(false);
  // Canvas scale = frame width / 1440, the same factor as the CSS --u (100cqw / 1440). React Flow's viewport zoom
  // scales node geometry, strokes and knobs together, so wires stay on pin centres (React Flow docs: Viewport, zoom).
  const frame = useRef(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = frame.current;
    const ro = new ResizeObserver(() => setZoom(el.clientWidth / 1440));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Pan/zoom are the user's (React Flow docs: Viewport). A resize rescales the current viewport by zoom/zoom_prev
  // instead of resetting it, so the user's own pan and zoom survive (React Flow docs: getViewport / setViewport).
  const [rf, setRf] = useState(null);
  const prevZoom = useRef(null);
  useLayoutEffect(() => {
    if (!rf) return;
    if (prevZoom.current == null) rf.setViewport({ x: 0, y: 0, zoom });
    else if (prevZoom.current !== zoom) {
      const v = rf.getViewport(), k = zoom / prevZoom.current;
      rf.setViewport({ x: v.x * k, y: v.y * k, zoom: v.zoom * k });
    }
    prevZoom.current = zoom;
  }, [rf, zoom]);

  // Compute everything, then React commits the frame once. Drags never reach here.
  const values = useMemo(() => evaluate(circuit), [circuit]);

  // Undo/redo: one linear stack of whole snapshots {circuit, view}; 10 deep; any new edit clears redo.
  const [hist, setHist] = useState({ past: [], future: [] });
  // `v` keeps the live view array's identity: two commits from ONE event (e.g. React Flow deletes a node, then its
  // wires) see the same circuit + view objects, so the second is dropped and one action = one undo step.
  const snap = () => ({ circuit, v: view, view: view.map(({ id, type, position }) => ({ id, type, position, data: {} })) });
  const commit = (s = snap()) => setHist((h) => {
    const top = h.past[h.past.length - 1];
    if (top && top.circuit === s.circuit && top.v === s.v) return h;
    return { past: [...h.past, s].slice(-HISTORY), future: [] };
  });
  const restore = (s) => { setCircuit(s.circuit); setView(s.view); setReject(null); setPending(null); setEdgeSel(new Set()); setArmed(false); };
  const undo = () => { if (!hist.past.length) return; const prev = hist.past[hist.past.length - 1];
    setHist({ past: hist.past.slice(0, -1), future: [snap(), ...hist.future].slice(0, HISTORY) }); restore(prev); };
  const redo = () => { if (!hist.future.length) return; const next = hist.future[0];
    setHist({ past: [...hist.past, snap()].slice(-HISTORY), future: hist.future.slice(1) }); restore(next); };
  const wipe = () => { commit(); setCircuit({ nodes: {}, wires: {} }); setView([]); setReject(null); setPending(null); setEdgeSel(new Set()); };
  const keys = useRef(); keys.current = { undo, redo };
  useEffect(() => {
    const k = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return;
      const key = e.key.toLowerCase();
      if (key === 'z') { e.preventDefault(); e.shiftKey ? keys.current.redo() : keys.current.undo(); }
      else if (key === 'y' && !e.metaKey) { e.preventDefault(); keys.current.redo(); } // Windows convention
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  // Error mark lifetime: REJECT_MS, or the next pointerdown anywhere.
  useEffect(() => {
    if (!reject) return;
    const t = setTimeout(() => setReject(null), REJECT_MS);
    const d = () => setReject(null);
    const arm = setTimeout(() => window.addEventListener('pointerdown', d, true), 0);
    return () => { clearTimeout(t); clearTimeout(arm); window.removeEventListener('pointerdown', d, true); };
  }, [reject]);

  const toggle = (id) => {
    commit();
    setCircuit((c) => ({ ...c, nodes: { ...c.nodes, [id]: { ...c.nodes[id], value: !c.nodes[id].value } } }));
  };

  const wires = Object.values(circuit.wires);
  const nodes = view.map((n) => ({
    ...n,
    data: { ...circuit.nodes[n.id], on: values[n.id],
      wired: { in: [0, 1].map((pin) => wires.some((w) => w.target === n.id && w.pin === pin)), out: wires.some((w) => w.source === n.id) }, onToggle: () => { setReject(null); toggle(n.id); },
      reject: reject && reject.node === n.id ? reject : null,
      pending, onPort: (handle) => onPort(n.id, handle), onRemove: () => removeNodes([n.id]) },
  }));

  const edges = Object.values(circuit.wires).map((w) => ({
    id: w.id,
    source: w.source,
    sourceHandle: 'out',
    target: w.target,
    targetHandle: `in${w.pin}`,
    type: 'wire',
    selectable: false, focusable: false, // a click on a wire does nothing; only its X deletes
    data: { onRemove: (id) => onEdgesChange([{ type: 'remove', id }]) },
    className: `${values[w.source] ? 'on' : ''} ${['occupant', 'combo'].includes(T4.err) && reject?.wires?.includes(w.id) ? 'blocked' : ''}`,
    selected: edgeSel.has(w.id),
  }));

  // New node from the palette. `at` = flow position of the drop; none (click / Enter) = canvas centre,
  // nudged per add so repeated adds don't stack exactly.
  const switchFull = !canAddSwitch(circuit).ok;
  const addNode = (it, at) => {
    if (it.kind === 'S' && switchFull) return;
    commit();
    const id = `${it.kind.toLowerCase()}${it.type ? it.type.toLowerCase() : ''}_${nextNode++}`; // "_" keeps added parts clear of the demo ids (s1, s2, g1, l1)
    if (!at) {
      const box = frame.current.querySelector('.canvas').getBoundingClientRect();
      const c = rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      at = { x: c.x - 60 + ((nextNode % 5) * 20), y: c.y - 54 + ((nextNode % 5) * 20) };
    }
    setCircuit((c) => ({ ...c, nodes: { ...c.nodes, [id]: { id, kind: it.kind, ...(it.type && { type: it.type }), ...(it.kind === 'S' && { value: false }) } } }));
    setView((v) => [...v, { id, type: it.kind, position: at, data: {} }]);
  };
  const onDrop = (e) => {
    const raw = e.dataTransfer.getData(DND);
    if (!raw) return;
    e.preventDefault();
    const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(JSON.parse(raw), { x: p.x - 40, y: p.y - 54 }); // pointer lands near the glyph's middle
  };

  // Plain-language copy for reasons a person might actually hit; anything else falls back to the raw reason.
  // Visible words: <= 2, uppercase (Tony). Full sentence goes to the screen-reader live region only.
  const REJECT_TEXT = { 'pin taken': 'Pin taken', loop: 'No loops' };
  const REJECT_SR = { 'pin taken': 'That input already has a wire', loop: 'That wire would make a loop' };
  // Wires to point at: the occupant of the pin, or the path that would close the loop (target ... -> source).
  const culprits = (reason, source, target, pin) => {
    const ws = Object.values(circuit.wires);
    if (reason === 'pin taken') return ws.filter((w) => w.target === target && w.pin === pin).map((w) => w.id);
    if (reason === 'loop') {
      const walk = (id, seen) => { if (id === source) return []; if (seen.has(id)) return null; seen.add(id);
        for (const w of ws.filter((x) => x.source === id)) { const r = walk(w.target, seen); if (r) return [w.id, ...r]; } return null; };
      return walk(target, new Set()) ?? [];
    }
    return [];
  };

  const onConnect = ({ source, target, targetHandle }) => {
    const pin = Number(targetHandle.slice(2));
    const check = canConnect(circuit, source, target, pin);
    if (!check.ok) {
      const text = REJECT_TEXT[check.reason] ?? 'No';
      setReject({ node: target, handle: targetHandle, text, reason: check.reason, wires: culprits(check.reason, source, target, pin) });
      return setStatus({ text: REJECT_SR[check.reason] ?? `Can't connect: ${check.reason}`, bad: true });
    }
    setReject(null);
    commit();
    const id = `w${nextWire++}`;
    setCircuit((c) => ({ ...c, wires: { ...c.wires, [id]: { id, source, target, pin } } }));
    setStatus({ text: '', bad: false }); // silent success: ref3 leaves row 03 empty
  };

  // The drop target is decided HERE, by the port hit zones under the pointer (the same big zones a
  // drag starts from). React Flow's own snap is off (connectionRadius 0): it only looks within a
  // radius of each knob centre, ignores the zones, and could lose a fast release on a busy first load.
  // The drag origin is kept ourselves: on a fast release React Flow's connection state can already be cleared.
  const dragFrom = useRef(null);
  const dragSnap = useRef(null); // snapshot at node-drag start; pushed on drop only if something moved
  const onConnectStart = (_, { nodeId, handleId, handleType }) => { dragFrom.current = { node: nodeId, handle: handleId, type: handleType }; setTucked(true); };
  const onConnectEnd = (e, cs) => {
    setTucked(false); setGuides([]);
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!from || (cs.toHandle && cs.isValid)) return; // React Flow already connected it
    const pt = e.changedTouches ? e.changedTouches[0] : e;
    const el = document.elementFromPoint(pt.clientX, pt.clientY)?.closest('.react-flow__handle');
    const node = el?.closest('.react-flow__node')?.dataset.id;
    if (!node || el.classList.contains(from.type)) return; // nothing there, or same-kind port
    const to = { node, handle: el.dataset.handleid };
    const [src, dst] = from.type === 'source' ? [from, to] : [to, from];
    onConnect({ source: src.node, target: dst.node, targetHandle: dst.handle });
  };

  // Keyboard wiring (WCAG 2.1.1): Enter/Space on an output picks it, on an input connects it.
  const onPort = (node, handle) => {
    if (handle === 'out') { setPending(node); return setStatus({ text: `Wiring from ${node.toUpperCase()}: pick an input`, bad: false }); }
    if (!pending) { setReject({ node, handle, text: 'Output first', reason: 'no source', wires: [] }); return setStatus({ text: 'Pick an output first', bad: true }); }
    setPending(null);
    onConnect({ source: pending, target: node, targetHandle: handle });
  };

  // Node delete (double-click, or select + Backspace/Delete): drop the node and every wire touching it.
  const removeNodes = (ids) => {
    if (!ids.length) return;
    commit();
    setView((v) => v.filter((n) => !ids.includes(n.id)));
    setCircuit((c) => ({
      nodes: Object.fromEntries(Object.entries(c.nodes).filter(([id]) => !ids.includes(id))),
      wires: Object.fromEntries(Object.entries(c.wires).filter(([, w]) => !ids.includes(w.source) && !ids.includes(w.target))),
    }));
    setReject(null); setPending(null);
    setStatus({ text: '', bad: false });
  };
  // Snap guides (Tony, Sep 25; Figma/Canva smart guides). A pin within SNAP flow units of another node's pin height
  // pulls the dragged node onto that line, and a thin dotted --ink-2 guide shows it. SNAP = 8: the 20u grid already
  // quantizes positions, but pin heights differ per part (switch 43, gates 33/75, lamp 57), so grid snap alone never
  // lines pins up; 8 catches "nearly level" without fighting the grid.
  const SNAP = 8;
  const [guides, setGuides] = useState([]);
  const pinsAbs = (n, which) => { const c = circuit.nodes[n.id]; if (!c) return []; const p = pinYs(c.kind, c.type);
    const ys = which === 'in' ? p.ins : which === 'out' ? (p.out == null ? [] : [p.out]) : [...p.ins, ...(p.out == null ? [] : [p.out])];
    return ys.map((y) => n.position.y + y); };
  const snapNode = (ch) => {
    const me = view.find((n) => n.id === ch.id); if (!me) return ch;
    const moved = { ...me, position: ch.position }; let best = null;
    for (const y of pinsAbs(moved)) for (const o of view) if (o.id !== ch.id) for (const oy of pinsAbs(o)) {
      const d = oy - y; if (Math.abs(d) <= SNAP && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, y: oy };
    }
    setGuides(best ? [best.y] : []);
    return best ? { ...ch, position: { ...ch.position, y: ch.position.y + best.d } } : ch;
  };
  const onNodesChange = (changes) => {
    removeNodes(changes.filter((ch) => ch.type === 'remove').map((ch) => ch.id));
    // The release also carries a (grid-snapped) position: snap it too, or it undoes the alignment by up to 1px.
    onViewChange(changes.filter((ch) => ch.type !== 'remove').map((ch) => (ch.type === 'position' && ch.position ? snapNode(ch) : ch)));
    if (changes.some((ch) => ch.type === 'position' && ch.dragging === false)) setGuides([]);
  };
  // Wire drag: a guide on every pin of the other kind whose height is within SNAP of the cursor.
  const wireGuides = (e) => {
    const from = dragFrom.current; if (!from || !rf) return;
    const { y } = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const want = from.type === 'source' ? 'in' : 'out';
    setGuides(view.filter((n) => n.id !== from.node).flatMap((n) => pinsAbs(n, want)).filter((py) => Math.abs(py - y) <= SNAP));
  };

  const onEdgesChange = (changes) => {
    const sel = changes.filter((ch) => ch.type === 'select');
    if (sel.length) setEdgeSel((prev) => { const next = new Set(prev); sel.forEach((ch) => (ch.selected ? next.add(ch.id) : next.delete(ch.id))); return next; });
    const gone = changes.filter((ch) => ch.type === 'remove').map((ch) => ch.id);
    if (!gone.length) return;
    commit();
    setCircuit((c) => ({ ...c, wires: Object.fromEntries(Object.entries(c.wires).filter(([id]) => !gone.includes(id))) }));
  };

  // A truth-table row click sets every input switch to that row's bits.
  const setSwitches = (ids, bits) => (commit(), setCircuit((c) => ({ ...c, nodes: { ...c.nodes,
    ...Object.fromEntries(ids.map((id, i) => [id, { ...c.nodes[id], value: !!bits[i] }])) } })));

  return (
    <div className="frame" ref={frame}>
    <div className="app">
      <div className="cell c-margin r1"><span className="rownum">{fig('01')}</span></div>
      <div className="cell c-main r1" />
      <div className="cell c-side r1">
        <button className="disk" aria-pressed={showGrid} aria-label={showGrid ? 'Hide grid' : 'Show grid'} title={showGrid ? 'Hide grid' : 'Show grid'}
          onClick={() => setShowGrid((g) => !g)}>
          <svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="M-36.5 0H26M-0.6 -27.9L27.3 0L-0.6 27.9" /></svg>
        </button>
        <p className="lockup">Circuit<br /> editor</p>
      </div>
      <h1 className="wordmark" lang="sv" aria-label="Figur"><span className="sr">Figur</span><span aria-hidden="true"><span className="wF">F</span><span className="wi">i</span><span className="wg">g</span><span className="wu">u</span><span className="wr">r</span></span></h1>

      <div className="cell c-margin r2"><span className="rownum">{fig('02')}</span></div>
      {/* Part drops are caught here in the capture phase, so a drop that lands on an existing node still adds the part
          (nodes like the switch button would otherwise swallow it). */}
      <main className="cell c-main r2 canvas"
        onDragOverCapture={(e) => { if (e.dataTransfer.types.includes(DND)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }}
        onDropCapture={onDrop} onPointerMove={wireGuides}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onNodeContextMenu={(e, n) => { e.preventDefault(); removeNodes([n.id]); }}
          onEdgeContextMenu={(e, w) => { e.preventDefault(); onEdgesChange([{ type: 'remove', id: w.id }]); }}
          connectionRadius={0}
          deleteKeyCode={['Backspace', 'Delete']}
          zoomOnDoubleClick={false}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onPaneClick={() => setPalOpen(false)} // HIG: an overlay panel is transient; a click on the work closes it
          onNodeDragStart={() => { setTucked(true); dragSnap.current = snap(); }}
          onNodeDragStop={() => { setTucked(false); const s = dragSnap.current; dragSnap.current = null;
            if (s && view.some((n) => { const o = s.view.find((x) => x.id === n.id); return o && (o.position.x !== n.position.x || o.position.y !== n.position.y); })) commit(s); }}
          snapToGrid
          snapGrid={[20, 20]}
          onInit={setRf}
          defaultViewport={{ x: 0, y: 0, zoom }}
          minZoom={0.25}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          {showGrid && <Background gap={20} color="var(--grid)" />}
          <ViewportPortal>{guides.map((y) => <div key={y} className="guide" style={{ top: y }} />)}</ViewportPortal>
        </ReactFlow>
        <Palette open={palOpen} setOpen={setPalOpen} tucked={tucked} onDrag={setTucked} switchFull={switchFull} onAdd={(it) => addNode(it)} />
      </main>
      <Truth circuit={circuit} view={view} fig={fig} setSwitches={setSwitches} />

      <div className="cell c-margin r3"><span className="rownum">{fig('03')}</span></div>
      <footer className="cell c-main r3 status">
        <Controls variant={T4.bar} icons={T4.icons} canUndo={hist.past.length > 0} canRedo={hist.future.length > 0}
          canWipe={view.length > 0} armed={armed} setArmed={setArmed} onUndo={undo} onRedo={redo} onWipe={wipe}
          force={window.__t4force} />
        <span className="sr" role="status">{status.text}</span>
      </footer>
      <div className="cell c-side r3 help" />
    </div>
    </div>
  );
}
