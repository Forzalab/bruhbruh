import { useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import Remove from './Remove.jsx';
import { wirePath, DOT_R } from './route.js';

// Wire = right-angle step path. data.route (from route.js, computed once in App) gives its lane x, crossings,
// junction dots and the X spot. Unrouted wires (backward / very short) keep React Flow's own step path.
// Hover shows the delete X on the wire's own last run (never on a shared trunk or a bundle); hovering the X
// previews the result (the wire goes dotted).
export default function Wire({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
  const r = data.route;
  let path, mx, my;
  if (r) { path = wirePath(sourceX, sourceY, targetX, targetY, r, data.crossStyle); [mx, my] = r.xAt; }
  else [path, mx, my] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 0 });
  const [hover, setHover] = useState(false), [arm, setArm] = useState(false);
  const t = useRef(0);
  const enter = () => { clearTimeout(t.current); setHover(true); };
  const leave = () => { t.current = setTimeout(() => setHover(false), 150); }; // lets the pointer travel onto the X
  return (
    <>
      <g className={arm ? 'armed' : ''}><BaseEdge id={id} path={path} interactionWidth={24} /></g>
      {r?.dots.map(([x, y]) => <circle key={`${x},${y}`} className="junction" cx={x} cy={y} r={DOT_R} />)}
      <path className="wire-hit" d={path} fill="none" stroke="transparent" strokeWidth={24} onPointerEnter={enter} onPointerLeave={leave} />
      {hover && (
        <EdgeLabelRenderer>
          <Remove label="Delete wire" onRemove={() => data.onRemove(id)}
            onHover={(on) => { setArm(on); on ? enter() : leave(); }}
            style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${mx}px, ${my}px) scale(var(--rs))` }} />
        </EdgeLabelRenderer>
      )}
    </>
  );
}
