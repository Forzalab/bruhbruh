import { useMemo, useState } from 'react';
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
  { id: 's1', type: 'S', position: { x: 40, y: 80 }, data: {} },
  { id: 's2', type: 'S', position: { x: 40, y: 200 }, data: {} },
  { id: 'g1', type: 'G', position: { x: 260, y: 130 }, data: {} },
  { id: 'l1', type: 'L', position: { x: 460, y: 127 }, data: {} },
];

let nextWire = 1;

export default function App() {
  const [circuit, setCircuit] = useState(START);
  const [view, , onViewChange] = useNodesState(VIEW);
  const [showGrid, setShowGrid] = useState(false);
  const [status, setStatus] = useState({ text: 'Drag from a dot to a dot to wire. Click a switch to flip it.', bad: false });

  // Compute everything, then React commits the frame once. Drags never reach here.
  const values = useMemo(() => evaluate(circuit), [circuit]);

  const toggle = (id) =>
    setCircuit((c) => ({ ...c, nodes: { ...c.nodes, [id]: { ...c.nodes[id], value: !c.nodes[id].value } } }));

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

  // Truth table for the 2-switch AND demo; live row = current switch state.
  const a = !!values.s1, b = !!values.s2;
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];

  return (
    <div className="app">
      <div className="cell c-margin r1"><span className="rownum">01</span></div>
      <div className="cell c-main r1" />
      <div className="cell c-side r1">
        <button className="gridtoggle" aria-pressed={showGrid} onClick={() => setShowGrid((g) => !g)}>
          {showGrid ? 'HIDE GRID' : 'SHOW GRID'}
        </button>
      </div>
      <h1 className="wordmark" aria-label="Logic">Logic</h1>

      <div className="cell c-margin r2"><span className="rownum">02</span></div>
      <main className="cell c-main r2 canvas">
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
          fitViewOptions={{ padding: 0.35 }}
          proOptions={{ hideAttribution: true }}
        >
          {showGrid && <Background gap={20} color="var(--grid)" />}
        </ReactFlow>
      </main>
      <aside className="cell c-side r2 truth" aria-label="Truth table">
        <h2 className="label">Truth Table</h2>
        <table>
          <thead><tr><th>#</th><th>A</th><th>B</th><th>OUT</th></tr></thead>
          <tbody>
            {rows.map(([x, y], i) => (
              <tr key={i} className={x === +a && y === +b ? 'live' : ''}>
                <td>{String(i + 1).padStart(2, '0')}</td><td>{x}</td><td>{y}</td><td>{x & y}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Select a wire + Backspace to delete</p>
      </aside>

      <div className="cell c-margin r3"><span className="rownum">03</span></div>
      <footer className={`cell c-main r3 status ${status.bad ? 'bad' : ''}`}>
        <span className="label">Logic circuit editor</span>
        <span className="msg" role="status">{status.text}</span>
      </footer>
      <div className="cell c-side r3" />
    </div>
  );
}
