import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, useNodesState } from '@xyflow/react';
import { canConnect, evaluate } from './sim.js';
import { nodeTypes } from './nodes/index.jsx';

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

let nextWire = 1;

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
  const [status, setStatus] = useState({ text: '', bad: false });
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

  const toggle = (id) =>
    setCircuit((c) => ({ ...c, nodes: { ...c.nodes, [id]: { ...c.nodes[id], value: !c.nodes[id].value } } }));

  const nodes = view.map((n) => ({
    ...n,
    data: { ...circuit.nodes[n.id], on: values[n.id], onToggle: () => { setReject(null); toggle(n.id); },
      reject: reject && reject.node === n.id ? reject : null,
      pending, onPort: (handle) => onPort(n.id, handle) },
  }));

  const edges = Object.values(circuit.wires).map((w) => ({
    id: w.id,
    source: w.source,
    sourceHandle: 'out',
    target: w.target,
    targetHandle: `in${w.pin}`,
    type: 'step',
    className: values[w.source] ? 'on' : '',
    selected: edgeSel.has(w.id),
  }));

  const onConnect = ({ source, target, targetHandle }) => {
    const pin = Number(targetHandle.slice(2));
    const check = canConnect(circuit, source, target, pin);
    if (!check.ok) {
      setReject({ node: target, handle: targetHandle, text: `Can't connect: ${check.reason}` });
      return setStatus({ text: `Rejected: ${check.reason}`, bad: true });
    }
    setReject(null);
    const id = `w${nextWire++}`;
    setCircuit((c) => ({ ...c, wires: { ...c.wires, [id]: { id, source, target, pin } } }));
    setStatus({ text: '', bad: false }); // silent success: ref3 leaves row 03 empty
  };

  // React Flow picks the drop target on pointermove. A fast release while the main thread is busy
  // (first load: fonts, first render) can end the drag before that move is processed, and the wire
  // is lost. On release with no target, read the port under the pointer and connect to it ourselves.
  const onConnectEnd = (e, cs) => {
    if (cs.toHandle || !cs.fromHandle) return;
    const pt = e.changedTouches ? e.changedTouches[0] : e;
    const el = document.elementFromPoint(pt.clientX, pt.clientY)?.closest('.react-flow__handle');
    const node = el?.closest('.react-flow__node')?.dataset.id;
    if (!node || el.classList.contains(cs.fromHandle.type)) return; // nothing there, or same-kind port
    const from = { node: cs.fromHandle.nodeId, handle: cs.fromHandle.id };
    const to = { node, handle: el.dataset.handleid };
    const [src, dst] = cs.fromHandle.type === 'source' ? [from, to] : [to, from];
    onConnect({ source: src.node, target: dst.node, targetHandle: dst.handle });
  };

  // Keyboard wiring (WCAG 2.1.1): Enter/Space on an output picks it, on an input connects it.
  const onPort = (node, handle) => {
    if (handle === 'out') { setPending(node); return setStatus({ text: `Wiring from ${node.toUpperCase()}: pick an input`, bad: false }); }
    if (!pending) return setStatus({ text: 'Pick an output first', bad: true });
    setPending(null);
    onConnect({ source: pending, target: node, targetHandle: handle });
  };

  // Node delete (double-click, or select + Backspace/Delete): drop the node and every wire touching it.
  const removeNodes = (ids) => {
    if (!ids.length) return;
    setView((v) => v.filter((n) => !ids.includes(n.id)));
    setCircuit((c) => ({
      nodes: Object.fromEntries(Object.entries(c.nodes).filter(([id]) => !ids.includes(id))),
      wires: Object.fromEntries(Object.entries(c.wires).filter(([, w]) => !ids.includes(w.source) && !ids.includes(w.target))),
    }));
    setReject(null); setPending(null);
    setStatus({ text: '', bad: false });
  };
  const onNodesChange = (changes) => {
    removeNodes(changes.filter((ch) => ch.type === 'remove').map((ch) => ch.id));
    onViewChange(changes.filter((ch) => ch.type !== 'remove'));
  };

  const onEdgesChange = (changes) => {
    const sel = changes.filter((ch) => ch.type === 'select');
    if (sel.length) setEdgeSel((prev) => { const next = new Set(prev); sel.forEach((ch) => (ch.selected ? next.add(ch.id) : next.delete(ch.id))); return next; });
    const gone = changes.filter((ch) => ch.type === 'remove').map((ch) => ch.id);
    if (!gone.length) return;
    setCircuit((c) => ({ ...c, wires: Object.fromEntries(Object.entries(c.wires).filter(([id]) => !gone.includes(id))) }));
  };

  // Truth table for the 2-switch AND demo; live row = current switch state.
  const a = !!circuit.nodes.s1?.value, b = !!circuit.nodes.s2?.value; // switch state itself, never a derived value
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];

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
      <h1 className="wordmark" aria-label="Logic"><span className="sr">Logic</span><span aria-hidden="true"><span className="wL">L</span><span className="wo">o</span><span className="wg">g</span><span className="wi">i</span><span className="wc">c</span></span></h1>

      <div className="cell c-margin r2"><span className="rownum">{fig('02')}</span></div>
      <main className="cell c-main r2 canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeContextMenu={(e, n) => { e.preventDefault(); removeNodes([n.id]); }}
          onEdgeContextMenu={(e, w) => { e.preventDefault(); onEdgesChange([{ type: 'remove', id: w.id }]); }}
          connectionRadius={36}
          deleteKeyCode={['Backspace', 'Delete']}
          zoomOnDoubleClick={false}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          snapToGrid
          snapGrid={[20, 20]}
          onInit={setRf}
          defaultViewport={{ x: 0, y: 0, zoom }}
          minZoom={0.25}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          {showGrid && <Background gap={20} color="var(--grid)" />}
        </ReactFlow>
      </main>
      <aside className="cell c-side r2 truth" aria-label="Truth table">
        <h2 className="label">Truth table</h2>
        <table>
          <thead><tr><th scope="col"><span className="hN">#</span></th><th scope="col"><span className="hA">A</span></th><th scope="col"><span className="hB">B</span></th><th scope="col" aria-label="OUT"><span className="sr">OUT</span><span aria-hidden="true"><span className="hO">O</span><span className="hU">U</span><span className="hT">T</span></span></th></tr></thead>
          <tbody>
            {rows.map(([x, y], i) => (
              <tr key={i} className={x === +a && y === +b ? 'live' : ''}>
                <td>{fig(String(i + 1).padStart(2, '0'))}</td><td>{fig(x)}</td><td>{fig(y)}</td><td>{fig(x & y)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>

      <div className="cell c-margin r3"><span className="rownum">{fig('03')}</span></div>
      <footer className="cell c-main r3 status">
        <span className={`msg ${status.bad ? 'bad' : ''}`} role="status">{status.text}</span>
      </footer>
      <div className="cell c-side r3 help">
        <p>
          <svg className="mouse" width="14" height="20" viewBox="0 0 14 20" aria-hidden="true">
            <path className="q" d="M7 1A6 6 0 0 0 1 7V9H7Z" />
            <rect x="1" y="1" width="12" height="18" rx="6" />
            <path d="M7 1V9M1 9H13" />
          </svg>
          <span className="sr">Click</span> to flip<i aria-hidden="true">·</i><span className="sr">, </span>drag <span className="to2">to</span> wire<i aria-hidden="true">·</i><span className="sr">, </span><kbd>Bksp</kbd> to delete
        </p>
      </div>
    </div>
    </div>
  );
}
