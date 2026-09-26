import { getSmoothStepPath, useStore } from '@xyflow/react';

// In-progress wire (T1 it.2): a thin solid "pencil" line (rule weight) on the same right-angle step route a finished
// Wire takes. It turns 20u out of the knob (not at the midpoint), and a paper casing (circuit-diagram crossing idiom)
// keeps it visible where it runs over an existing ink or orange wire, so it always reads as starting AT the knob.
export default function Draft({ fromX, fromY, toX, toY, fromPosition, toPosition }) {
  const iz = useStore((s) => 1 / s.transform[2]);
  const k = useStore((s) => (s.width / 906) / s.transform[2]);
  const dir = fromPosition === 'left' ? -1 : 1;
  const [d] = getSmoothStepPath({ sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition,
    targetX: toX, targetY: toY, targetPosition: toPosition, borderRadius: 0, offset: 20 * k, centerX: fromX + dir * 20 * k });
  return (
    <g>
      <path className="wire-draft-casing" d={d} fill="none" />
      <path className="wire-draft" d={d} fill="none" />
    </g>
  );
}
