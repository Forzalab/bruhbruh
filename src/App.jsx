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
  { id: 'l1', type: 'L', position: { x: 460, y: 140 }, data: {} },
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
      <header className="bar">
        <span className="wordmark">Logic</span>
        <span className="hint">select a wire + Backspace to delete it</span>
      </header>
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
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="var(--grid)" />
      </ReactFlow>
      <footer className={`status ${status.bad ? 'bad' : ''}`} role="status">{status.text}</footer>
    </div>
  );
}
