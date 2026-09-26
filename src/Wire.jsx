import { useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import Remove from './Remove.jsx';

// Wire = right-angle step path. Hover shows the delete X at the path midpoint; hovering the X previews the result
// (the wire goes dotted, like a free pin's stub). A click on the wire itself does nothing.
export default function Wire({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
  const [path, mx, my] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 0 });
  const [hover, setHover] = useState(false), [arm, setArm] = useState(false);
  const t = useRef(0);
  const enter = () => { clearTimeout(t.current); setHover(true); };
  const leave = () => { t.current = setTimeout(() => setHover(false), 150); }; // lets the pointer travel onto the X
  return (
    <>
      <g className={arm ? 'armed' : ''}><BaseEdge id={id} path={path} interactionWidth={24} /></g>
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
