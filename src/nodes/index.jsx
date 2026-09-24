import { useId } from 'react';
import { Handle as RFHandle, Position } from '@xyflow/react';

// Every port is a real tab stop (WCAG 2.1.1 / 2.4.7); Enter or Space wires it.
// The handle is an invisible hit box centred on the knob; the visible knob lives in the SVG.
function Handle({ nodeId, data, ...p }) {
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); data.onPort(p.id); } };
  return <RFHandle {...p} tabIndex={0} role="button" onKeyDown={key}
    className={data.pending === nodeId && p.id === 'out' ? 'picked' : ''}
    aria-label={`${nodeId} ${p.id === 'out' ? 'output' : 'input ' + p.id.slice(2)}`} />;
}

// One 6px system. The contour sits 3px inside the node box so the outer ink edge is flush
// with the box, and every knob centre sits exactly on that outer ink edge.
const S = 6, H = S / 2, K = 6; // stroke, half stroke, knob ring centreline radius (outer r = 9: a 9px bump past the ink edge)

// Lit inset: the SAME path drawn twice. Pass 1 = orange (or paper) fill with an 18px paper
// stroke clipped to the shape, so 9px of paper eats inward: 3px under the ink + a 6px gap.
// Pass 2 = the 6px ink outline. Knobs are drawn first, so the body hides their inner half.
function Body({ d, knobs, on }) {
  const clip = 'c' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg className="body" aria-hidden="true">
      <defs><clipPath id={clip}><path d={d} /></clipPath></defs>
      {knobs.map(([x, y]) => <circle key={`${x},${y}`} className="knob" cx={x} cy={y} r={K} />)}
      <path d={d} className={`fill ${on ? 'on' : ''}`} clipPath={`url(#${clip})`} />
      <path d={d} className="outline" />
    </svg>
  );
}

const SW = 68; // switch outer size (ref3: 67px; even so the knob centre is a whole pixel)
const SW_D = `M${H} ${H} H${SW - H} V${SW - H} H${H} Z`;

export function SwitchNode({ id, data }) {
  return (
    <div className="sw-wrap" style={{ width: SW, height: SW }}>
      <button className={`switch nodrag ${data.on ? 'on' : ''}`} onClick={data.onToggle} aria-pressed={data.on}
        aria-label={`switch ${id} ${data.on ? 'on' : 'off'}`}>
        <Body d={SW_D} knobs={[[SW, 34]]} on={data.on} />
      </button>
      <Handle nodeId={id} data={data} type="source" position={Position.Right} id="out" style={{ top: 34 }} />
    </div>
  );
}

// IEEE Std 91-1984 distinctive-shape AND: flat back, semicircular front. 90px outer, no text.
const G = 90, R = (G - S) / 2;
const GATE_D = `M${H} ${H} H${G / 2} A${R} ${R} 0 0 1 ${G / 2} ${G - H} H${H} Z`;
const IN = [24, 66];

export function GateNode({ id, data }) {
  return (
    <div className={`gate ${data.on ? 'on' : ''}`} style={{ width: G, height: G }}>
      <Body d={GATE_D} knobs={[[0, IN[0]], [0, IN[1]], [G, G / 2]]} on={data.on} />
      <Handle nodeId={id} data={data} type="target" position={Position.Left} id="in0" style={{ top: IN[0] }} />
      <Handle nodeId={id} data={data} type="target" position={Position.Left} id="in1" style={{ top: IN[1] }} />
      <Handle nodeId={id} data={data} type="source" position={Position.Right} id="out" style={{ top: G / 2 }} />
      {data.reject && (
        <p className="reject" role="alert" style={{ top: data.reject.handle === 'in0' ? IN[0] : IN[1] }}>{data.reject.text}</p>
      )}
    </div>
  );
}

// Lamp: 96px ring, same inset when lit; its input knob is fused into the ring's left side.
const L = 96, LR = (L - S) / 2;
const LAMP_D = `M${H} ${L / 2} A${LR} ${LR} 0 1 1 ${L - H} ${L / 2} A${LR} ${LR} 0 1 1 ${H} ${L / 2} Z`;

export function LampNode({ id, data }) {
  return (
    <div className="lamp-wrap" style={{ width: L, height: L }}>
      <div role="img" aria-label={data.on ? 'lamp on' : 'lamp off'}>
        <Body d={LAMP_D} knobs={[[0, L / 2]]} on={data.on} />
      </div>
      <Handle nodeId={id} data={data} type="target" position={Position.Left} id="in0" style={{ top: L / 2 }} />
      {data.reject && <p className="reject" role="alert" style={{ top: L / 2 }}>{data.reject.text}</p>}
    </div>
  );
}

export const nodeTypes = { S: SwitchNode, G: GateNode, L: LampNode };
