import { Handle, Position } from '@xyflow/react';

export function SwitchNode({ data }) {
  return (
    <>
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={data.onToggle} aria-pressed={data.on}>
        {data.on ? '1' : '0'}
      </button>
      <Handle type="source" position={Position.Right} id="out" />
    </>
  );
}

// True AND shape: flat back, round front.
export function GateNode({ data }) {
  return (
    <div className={`gate ${data.on ? 'on' : ''}`}>
      <svg width="72" height="60" viewBox="0 0 72 60">
        <path d="M4 4 H36 A26 26 0 0 1 36 56 H4 Z" />
      </svg>
      <Handle type="target" position={Position.Left} id="in0" style={{ top: 20 }} />
      <Handle type="target" position={Position.Left} id="in1" style={{ top: 40 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ top: 30 }} />
      <div className="gate-label">{data.type}</div>
    </div>
  );
}

export function LampNode({ data }) {
  return (
    <>
      <Handle type="target" position={Position.Left} id="in0" />
      <div className={`lamp ${data.on ? 'on' : ''}`} role="img" aria-label={data.on ? 'lamp on' : 'lamp off'} />
    </>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
