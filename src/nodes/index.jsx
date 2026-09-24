import { Handle, Position } from '@xyflow/react';

const NAMES = { s1: 'A', s2: 'B' };

// Target port: the rejected port itself turns orange + aria-invalid (WCAG 3.3.1 / ARIA aria-invalid).
function Port({ node, data, id, style }) {
  const bad = data.reject && data.reject.handle === id;
  return <Handle type="target" position={Position.Left} id={id} style={style} tabIndex={0}
    className={bad ? 'invalid' : ''} aria-invalid={bad || undefined} aria-label={`${node} input ${id.slice(2)}`} />;
}

export function SwitchNode({ id, data }) {
  return (
    <div className="sw-wrap">
      <span className="node-tag">{NAMES[id] ?? id.toUpperCase()}</span>
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={data.onToggle} aria-pressed={data.on}
        aria-label={`switch ${NAMES[id] ?? id} ${data.on ? 'on' : 'off'}`}>
        <span className="switch-core" />
      </button>
      <Handle type="source" position={Position.Right} id="out" tabIndex={0} aria-label={`switch ${NAMES[id] ?? id} output`} />
    </div>
  );
}

// IEEE distinctive-shape AND: flat back, semicircular front. Label sits inside.
export function GateNode({ data }) {
  return (
    <div className={`gate ${data.on ? 'on' : ''}`} aria-label={`${data.type} gate`}>
      <svg width="104" height="80" viewBox="0 0 104 80" aria-hidden="true">
        <path d="M2 2 H62 A38 38 0 0 1 62 78 H2 Z" />
      </svg>
      <div className="gate-label">{data.type}</div>
      <Port node="gate" data={data} id="in0" style={{ top: 22 }} />
      <Port node="gate" data={data} id="in1" style={{ top: 58 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ top: 40 }} tabIndex={0} aria-label="gate output" />
      {data.reject && (
        <p className="reject" role="alert" style={{ top: data.reject.handle === 'in0' ? 22 : 58 }}>{data.reject.text}</p>
      )}
    </div>
  );
}

export function LampNode({ data }) {
  return (
    <div className="lamp-wrap">
      <span className="node-tag">OUT</span>
      <Port node="lamp" data={data} id="in0" />
      {data.reject && <p className="reject" role="alert" style={{ top: 'auto', bottom: 18 }}>{data.reject.text}</p>}
      <div className={`lamp ${data.on ? 'on' : ''}`} role="img" aria-label={data.on ? 'lamp on' : 'lamp off'} />
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
