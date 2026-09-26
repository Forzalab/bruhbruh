import { getSmoothStepPath } from '@xyflow/react';

// In-progress wire (restored from pit2/archive-T1 it.2, ported to the 3px stroke system): a thin solid "pencil" line
// at rule weight (2 screen px, non-scaling) on the same right-angle step route a finished Wire takes (borderRadius 0).
// It turns 20 flow units out of the knob, not at the midpoint, and a paper casing keeps it readable where it crosses an
// existing ink or orange wire, so it always reads as starting AT the knob.
export default function Draft({ fromX, fromY, toX, toY, fromPosition, toPosition }) {
  const dir = fromPosition === 'left' ? -1 : 1;
  const [d] = getSmoothStepPath({ sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition,
    targetX: toX, targetY: toY, targetPosition: toPosition, borderRadius: 0, offset: 20, centerX: fromX + dir * 20 });
  return (
    <g>
      <path className="wire-draft-casing" d={d} fill="none" />
      <path className="wire-draft" d={d} fill="none" />
    </g>
  );
}
