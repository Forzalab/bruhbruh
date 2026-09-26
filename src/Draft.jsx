import { getSmoothStepPath } from '@xyflow/react';

// In-progress wire (T1): the same right-angle step path a finished Wire draws (borderRadius 0), not React Flow's bezier.
export default function Draft({ fromX, fromY, toX, toY, fromPosition, toPosition }) {
  const [d] = getSmoothStepPath({ sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition,
    targetX: toX, targetY: toY, targetPosition: toPosition, borderRadius: 0 });
  return <path className="wire-draft" d={d} fill="none" />;
}
