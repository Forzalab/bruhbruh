import { useMemo, useState } from 'react';
import { ReactFlow, Background, useNodesState } from '@xyflow/react';
import { canConnect, evaluate } from './sim.js';
import { nodeTypes } from './nodes/index.jsx';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/inter-tight/800.css';

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
  { id: 's1', type: 'S', position: { x: 0, y: 40 }, data: {} },
  { id: 's2', type: 'S', position: { x: 0, y: 220 }, data: {} },
  { id: 'g1', type: 'G', position: { x: 220, y: 120 }, data: {} },
  { id: 'l1', type: 'L', position: { x: 480, y: 126 }, data: {} },
];

let nextWire = 1;

export default function App() {
  const [circuit, setCircuit] = useState(START);
  const [view, , onViewChange] = useNodesState(VIEW);
  const [status, setStatus] = useState({ text: 'Drag from a dot to a dot to wire. Click a switch to flip it.', bad: false });

  // Compute everything, then React commits the frame once. Drags never reach here.
  const values = useMemo(() => evaluate(circuit), [circuit]);

  const toggle = (id) =>
    setCircuit((c) => ({ ...c, nodes: { ...c.nodes, [id]: { ...c.nodes[id], value: !c.nodes[id].value } } }));

  // Truth table: re-run the live circuit for each A/B combination.
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => {
    const v = evaluate({ ...circuit, nodes: { ...circuit.nodes, s1: { ...circuit.nodes.s1, value: !!a }, s2: { ...circuit.nodes.s2, value: !!b } } });
    return { a, b, out: v.l1 ? 1 : 0, live: !!circuit.nodes.s1.value === !!a && !!circuit.nodes.s2.value === !!b };
  });

  const nodes = view.map((n) => ({
    ...n,
    data: { ...circuit.nodes[n.id], on: values[n.id], onToggle: () => toggle(n.id) },
  }));

  const edges = Object.values(circuit.wires).map((w) => ({
    id: w.id,
    source: w.source,
    sourceHandle: 'out',
    target: w.target,
    targetHandle: `in${w.pin}`,
    type: 'step',
    className: values[w.source] ? 'on' : '',
  }));

  const onConnect = ({ source, target, targetHandle }) => {
    const pin = Number(targetHandle.slice(2));
    const check = canConnect(circuit, source, target, pin);
    if (!check.ok) return setStatus({ text: `Can't connect: ${check.reason}.`, bad: true });
    const id = `w${nextWire++}`;
    setCircuit((c) => ({ ...c, wires: { ...c.wires, [id]: { id, source, target, pin } } }));
    setStatus({ text: 'Connected.', bad: false });
  };

  const onEdgesChange = (changes) => {
    const gone = changes.filter((ch) => ch.type === 'remove').map((ch) => ch.id);
    if (!gone.length) return;
    setCircuit((c) => ({ ...c, wires: Object.fromEntries(Object.entries(c.wires).filter(([id]) => !gone.includes(id))) }));
  };

  return (
    <div className="app">
      {['01', '02', '03'].map((n, i) => <span key={n} className={`num n${i + 1}`} aria-hidden="true">{n}</span>)}
      <h1 className="wordmark" aria-label="Logic">Logic</h1>
      <div className="cell-head" aria-hidden="true" />
      <a className="cell-cta" href="#canvas">
        <span className="cta-disk" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="56" height="56"><path d="M6 24 H40 M26 10 L40 24 L26 38" /></svg>
        </span>
        <span className="cta-label">Circuit<br />Editor</span>
      </a>
      <nav className="rail" aria-label="Gates">
        <div className="rail-tool" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2 L4 20 L9 15 L13 23 L16 21.5 L12 14 L19 14 Z" /></svg>
        </div>
        {['AND', 'OR', 'XOR', 'NOT'].map((g) => <span key={g} className="chip">{g}</span>)}
      </nav>
      <main className="canvas" id="canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onViewChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          fitViewOptions={{ padding: { top: '30%', bottom: '12%', left: '10%', right: '10%' }, maxZoom: 1.5 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1.2} color="var(--grid)" />
        </ReactFlow>
      </main>
      <aside className="side">
        <h2 className="label">Truth Table</h2>
        <table className="tt">
          <thead><tr><th>#</th><th>A</th><th>B</th><th>Out</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.live ? 'live' : ''} aria-current={r.live ? 'true' : undefined}>
                <td>0{i + 1}</td><td>{r.a}</td><td>{r.b}</td><td>{r.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Select a wire + Backspace to delete</p>
      </aside>
      <footer className={`status ${status.bad ? 'bad' : ''}`} role="status">
        <span className="label">Logic Circuit Editor</span>
        <span className="status-text">{status.text}</span>
      </footer>
      <div className="foot-side" aria-hidden="true" />
    </div>
  );
}
