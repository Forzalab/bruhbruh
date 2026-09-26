import { useStore } from '@xyflow/react';

// Delete control (Tony, Sep 25): a square ink tile with a white X, shown on hover of a wire or node.
// Lives in flow space, so it zooms with the canvas, but counter-scaled by 1/sqrt(zoom): 4x zoom -> 2x size, 0.25x -> 0.5x.
export default function Remove({ label, onRemove, onHover, style, className = '' }) {
  const z = useStore((s) => s.transform[2]);
  return (
    <button className={`remove nodrag nopan ${className}`} aria-label={label} title={label}
      style={{ ...style, '--rs': 1 / Math.sqrt(z) }}
      onPointerEnter={() => onHover?.(true)} onPointerLeave={() => onHover?.(false)}
      onClick={(e) => { e.stopPropagation(); onRemove(); }}>
      <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 -6L6 6M6 -6L-6 6" /></svg>
    </button>
  );
}
