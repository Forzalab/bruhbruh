import { Handle, Position } from '@xyflow/react';

const NAMES = { s1: 'A', s2: 'B' };

export function SwitchNode({ id, data }) {
  return (
    <div className="switch-wrap">
      <span className="node-tag">{NAMES[id] ?? id}</span>
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={data.onToggle} aria-pressed={!!data.on} aria-label={`Switch ${NAMES[id] ?? id}: ${data.on ? '1' : '0'}`}>
        <span className="switch-core" />
      </button>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

// Filled black pill, handles sit on its edge.
export function GateNode({ data }) {
  return (
    <div className={`gate ${data.on ? 'on' : ''}`}>
      <Handle type="target" position={Position.Left} id="in0" style={{ top: 18 }} />
      <Handle type="target" position={Position.Left} id="in1" style={{ top: 38 }} />
      <span className="gate-label">{data.type}</span>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function LampNode({ data }) {
  return (
    <div className="lamp-wrap">
      <span className="node-tag">Out</span>
      <Handle type="target" position={Position.Left} id="in0" />
      <div className={`lamp ${data.on ? 'on' : ''}`} role="img" aria-label={data.on ? 'lamp on' : 'lamp off'} />
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
