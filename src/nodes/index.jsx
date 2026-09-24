import { Handle as RFHandle, Position } from '@xyflow/react';
import { switchGeom, andGeom, lampGeom, SW, PAD, KNOB } from './geom.js';

const SWG = switchGeom(), ANDG = andGeom(), LAMPG = lampGeom();
const HB = 20; // handle box centred on the knob chord: the wire end lands 10px out, inside the knob ink ring (6..12)
const REACH = KNOB + 30; // how far a hit zone extends past the knob tip

// Per-node hit zones (Tony's sketch): the region between the gate body and the node edge, tiled
// by port so each side is fully covered with no gaps or overlaps. Rects are in node-local
// coordinates (same space as geom.js's `at` points), {x, y, w, h}.
const SW_X1 = PAD + SW.side;
const SW_ZONES = { out: { x: SW_X1, y: 0, w: REACH, h: SWG.h } };

const AND_X0 = PAD, AND_CY = ANDG.out[1], AND_OX = ANDG.out[0];
const AND_ZONES = {
  in0: { x: AND_X0 - REACH, y: 0, w: REACH, h: AND_CY },
  in1: { x: AND_X0 - REACH, y: AND_CY, w: REACH, h: ANDG.h - AND_CY },
  out: { x: AND_OX, y: 0, w: REACH, h: ANDG.h }, // starts at the curve apex: the body itself stays a drag target
};

const LAMP_KX = LAMPG.in[0];
const LAMP_ZONES = { in0: { x: LAMP_KX - REACH, y: 0, w: REACH, h: LAMPG.h } };

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
// The box is centred on the knob, so the edge endpoint sits on the knob's centreline (y exact).
// The hit area (::after) tiles the node's side instead, via CSS vars set from `zone`.
function Handle({ nodeId, data, at, zone, ...p }) {
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); data.onPort(p.id); } };
  const left = at[0] - HB / 2, top = at[1] - HB / 2;
  return <RFHandle {...p} tabIndex={0} role="button" onKeyDown={key}
    style={{ left, top, width: HB, height: HB,
      '--hit-left': `${zone.x - left}px`, '--hit-top': `${zone.y - top}px`, '--hit-w': `${zone.w}px`, '--hit-h': `${zone.h}px` }}
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
      <Handle nodeId={id} data={data} at={SWG.out} zone={SW_ZONES.out} type="source" position={Position.Right} id="out" />
    </div>
  );
}

export function GateNode({ id, data }) {
  return (
    <div className="node gate" style={{ width: ANDG.w, height: ANDG.h }} role="img" aria-label={`${data.type} gate, output ${data.on ? 1 : 0}`}>
      <Shape g={ANDG} on={data.on} />
      <Handle nodeId={id} data={data} at={ANDG.in[0]} zone={AND_ZONES.in0} type="target" position={Position.Left} id="in0" />
      <Handle nodeId={id} data={data} at={ANDG.in[1]} zone={AND_ZONES.in1} type="target" position={Position.Left} id="in1" />
      <Handle nodeId={id} data={data} at={ANDG.out} zone={AND_ZONES.out} type="source" position={Position.Right} id="out" />
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
      <Handle nodeId={id} data={data} at={LAMPG.in} zone={LAMP_ZONES.in0} type="target" position={Position.Left} id="in0" />
      {data.reject && <p className="reject" role="alert" style={{ top: LAMPG.in[1] }}>{data.reject.text}</p>}
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
