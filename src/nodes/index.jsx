import { Handle as RFHandle, Position } from '@xyflow/react';
import { switchGeom, andGeom, lampGeom } from './geom.js';

const SWG = switchGeom(), ANDG = andGeom(), LAMPG = lampGeom();
const HB = 22; // handle box centred on the knob chord: wire end lands 11px out = 1px inside the knob tip (tip = 12)

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
// The box is centred on the knob, so the edge endpoint sits on the knob's centreline (y exact).
function Handle({ nodeId, data, at, ...p }) {
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); data.onPort(p.id); } };
  return <RFHandle {...p} tabIndex={0} role="button" onKeyDown={key}
    style={{ left: at[0] - HB / 2, top: at[1] - HB / 2, width: HB, height: HB }}
    className={`port ${data.pending === nodeId && p.id === 'out' ? 'picked' : ''}`}
    aria-label={`${nodeId} ${p.id === 'out' ? 'output' : 'input ' + (+p.id.slice(2) + 1)}`} />;
}

// Outline = one path (body + knobs, one continuous stroke). Lit = second path: the true inset contour.
function Shape({ g, on }) {
  return (
    <svg className="shape" width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden="true">
      <path className="body" d={g.outline} />
      {on && <path className="lit" d={g.inset} />}
    </svg>
  );
}

const NAMES = { s1: 'A', s2: 'B' };

export function SwitchNode({ id, data }) {
  return (
    <div className="node sw" style={{ width: SWG.w, height: SWG.h }}>
      <Shape g={SWG} on={data.on} />
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); data.onToggle(); }} aria-pressed={!!data.on}
        aria-label={`Switch ${NAMES[id] ?? id}, ${data.on ? 'on' : 'off'}`} />
      <Handle nodeId={id} data={data} at={SWG.out} type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function GateNode({ id, data }) {
  return (
    <div className="node gate" style={{ width: ANDG.w, height: ANDG.h }} role="img" aria-label={`${data.type} gate, output ${data.on ? 1 : 0}`}>
      <Shape g={ANDG} on={data.on} />
      <Handle nodeId={id} data={data} at={ANDG.in[0]} type="target" position={Position.Left} id="in0" />
      <Handle nodeId={id} data={data} at={ANDG.in[1]} type="target" position={Position.Left} id="in1" />
      <Handle nodeId={id} data={data} at={ANDG.out} type="source" position={Position.Right} id="out" />
      {data.reject && (
        <p className="reject" role="alert" style={{ top: ANDG.in[data.reject.handle === 'in1' ? 1 : 0][1] }}>{data.reject.text}</p>
      )}
    </div>
  );
}

export function LampNode({ id, data }) {
  return (
    <div className="node lamp" style={{ width: LAMPG.w, height: LAMPG.h }} role="img" aria-label={data.on ? 'Lamp on' : 'Lamp off'}>
      <Shape g={LAMPG} on={data.on} />
      <Handle nodeId={id} data={data} at={LAMPG.in} type="target" position={Position.Left} id="in0" />
      {data.reject && <p className="reject" role="alert" style={{ top: LAMPG.in[1] }}>{data.reject.text}</p>}
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
