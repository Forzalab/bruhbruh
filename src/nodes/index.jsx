import { Handle as RFHandle, Position } from '@xyflow/react';

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
function Handle({ nodeId, data, ...p }) {
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); data.onPort(p.id); } };
  return <RFHandle {...p} tabIndex={0} role="button" onKeyDown={key}
    className={data.pending === nodeId && p.id === 'out' ? 'picked' : ''}
    aria-label={`${nodeId} ${p.id === 'out' ? 'output' : 'input ' + p.id.slice(2)}`} />;
}

const NAMES = { s1: 'A', s2: 'B' };

export function SwitchNode({ id, data }) {
  return (
    <div className="sw-wrap">
      <span className="node-tag">{NAMES[id] ?? id.toUpperCase()}</span>
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={data.onToggle} aria-pressed={data.on}
        aria-label={`switch ${NAMES[id] ?? id} ${data.on ? 'on' : 'off'}`}>
        <span className="switch-core" />
      </button>
      <Handle nodeId={id} data={data} type="source" position={Position.Right} id="out" />
    </div>
  );
}

// IEEE distinctive-shape AND: flat back, semicircular front. Label sits inside.
export function GateNode({ id, data }) {
  return (
    <div className={`gate ${data.on ? 'on' : ''}`}>
      <svg width="104" height="80" viewBox="0 0 104 80" aria-hidden="true">
        <path d="M2 2 H62 A38 38 0 0 1 62 78 H2 Z" />
      </svg>
      <div className="gate-label">{data.type}</div>
      <Handle nodeId={id} data={data} type="target" position={Position.Left} id="in0" style={{ top: 22 }} />
      <Handle nodeId={id} data={data} type="target" position={Position.Left} id="in1" style={{ top: 58 }} />
      <Handle nodeId={id} data={data} type="source" position={Position.Right} id="out" style={{ top: 40 }} />
      {data.reject && (
        <p className="reject" role="alert" style={{ top: data.reject.handle === 'in0' ? 22 : 58 }}>{data.reject.text}</p>
      )}
    </div>
  );
}

export function LampNode({ id, data }) {
  return (
    <div className="lamp-wrap">
      <span className="node-tag">OUT</span>
      <Handle nodeId={id} data={data} type="target" position={Position.Left} id="in0" />
      {data.reject && <p className="reject" role="alert" style={{ top: 'auto', bottom: 18 }}>{data.reject.text}</p>}
      <div className={`lamp ${data.on ? 'on' : ''}`} role="img" aria-label={data.on ? 'lamp on' : 'lamp off'} />
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
