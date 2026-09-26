import { useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useNodes, useStore } from '@xyflow/react';
import { getEdgePosition } from '@xyflow/system'; // React Flow's own edge-end maths (a dependency of @xyflow/react)
import { route, toPath, midpoint } from './route.js';
import { crossings, hopPath } from './hop.js';
import { STROKE, ZOOM_EXP } from './nodes/geom.js';

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
  // Hops: other nets' routes (same router, same inputs), crossings where my horizontal meets their vertical.
  // sw = the wire stroke in flow px (App's --stroke: STROKE * userZoom^(ZOOM_EXP-1); userZoom = zoom / frame, frame = canvas / 906).
  const others = useStore((s) => s.edges.filter((e) => e.source !== source).map((e) => {
    const p = getEdgePosition({ id: e.id, sourceNode: s.nodeLookup.get(e.source), targetNode: s.nodeLookup.get(e.target),
      sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, connectionMode: s.connectionMode });
    return p ? `${p.sourceX},${p.sourceY},${p.targetX},${p.targetY},${e.source},${e.target}` : null; }).filter(Boolean).join(';'));
  const sw = useStore((s) => STROKE * (s.transform[2] / (s.width / 906)) ** (ZOOM_EXP - 1));
  let path, mx, my;
  if (pts) {
    const lines = others ? others.split(';').map((r) => { const [a, b, c, d, so, ta] = r.split(',');
      return route([+a, +b], [+c, +d], { src: find(so), dst: find(ta), others: all.filter((n) => n.id !== so && n.id !== ta).map(boxOf) }); }).filter(Boolean) : [];
    path = hopPath(pts, crossings(pts, lines, sw), sw); [mx, my] = midpoint(pts);
  }
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
