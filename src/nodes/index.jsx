import { Handle, Position } from '@xyflow/react';

const NAMES = { s1: 'A', s2: 'B' };

export function SwitchNode({ id, data }) {
  return (
    <div className="sw-wrap">
      <span className="node-tag">{NAMES[id] ?? id.toUpperCase()}</span>
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={data.onToggle} aria-pressed={data.on}
        aria-label={`switch ${NAMES[id] ?? id} ${data.on ? 'on' : 'off'}`}>
        <span className="switch-core" />
      </button>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

// IEEE distinctive-shape AND: flat back, semicircular front. Label sits inside.
export function GateNode({ data }) {
  return (
    <div className={`gate ${data.on ? 'on' : ''}`}>
      <svg width="104" height="80" viewBox="0 0 104 80" aria-hidden="true">
        <path d="M2 2 H62 A38 38 0 0 1 62 78 H2 Z" />
      </svg>
      <div className="gate-label">{data.type}</div>
      <Handle type="target" position={Position.Left} id="in0" style={{ top: 22 }} />
      <Handle type="target" position={Position.Left} id="in1" style={{ top: 58 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ top: 40 }} />
    </div>
  );
}

export function LampNode({ data }) {
  return (
    <div className="lamp-wrap">
      <span className="node-tag">OUT</span>
      <Handle type="target" position={Position.Left} id="in0" />
      <div className={`lamp ${data.on ? 'on' : ''}`} role="img" aria-label={data.on ? 'lamp on' : 'lamp off'} />
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
