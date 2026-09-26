import { useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useNodes } from '@xyflow/react';
import { route, toPath, midpoint } from './route.js';

const boxOf = (n) => ({ x: n.position.x, y: n.position.y, w: n.measured?.width ?? n.width ?? 0, h: n.measured?.height ?? n.height ?? 0 });
import Remove from './Remove.jsx';

// Wire = right-angle step path. Hover shows the delete X at the path midpoint; hovering the X previews the result
// (the wire goes dotted, like a free pin's stub). A click on the wire itself does nothing.
// Capped router (route.js): <= 4 bends, detours around node boxes; past the cap it falls back to the plain step path.
export default function Wire({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
  const all = useNodes();
  const find = (nid) => { const n = all.find((m) => m.id === nid); return n && boxOf(n); };
  const pts = route([sourceX, sourceY], [targetX, targetY],
    { src: find(source), dst: find(target), others: all.filter((n) => n.id !== source && n.id !== target).map(boxOf) });
  let path, mx, my;
  if (pts) { path = toPath(pts); [mx, my] = midpoint(pts); }
  else [path, mx, my] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 0 });
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
