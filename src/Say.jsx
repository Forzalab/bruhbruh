import { useEffect, useRef, useState } from 'react';
import { SAY } from './sayLettering.js';

// A speech balloon said by a part (gate, lamp) or by the Figur wordmark, drawn like the palette hint: a white 2:1 ellipse
// with a curved tail, and the fixed phrase lettered in outlined Anime Ace 3 BB (src/sayLettering.js). The <p> is placed
// by its TAIL TIP (CSS --ax/--ay): the tail aims at the speaker and stops short of it (Blambot, Comic Book Grammar).
// --k is the unit: 1px inside React Flow nodes (the viewport zoom already scales them), var(--u) in the app grid.
export default function Say({ phrase, className = '', role = 'status', text }) {
  const p = SAY[phrase];
  const ref = useRef(null);
  const [flip, setFlip] = useState({ x: false, y: false });
  useEffect(() => {
    const el = ref.current;
    const canvas = el?.closest('.canvas');
    if (!el || !canvas) return;
    const b = el.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    const next = { y: b.top < c.top, x: b.right > c.right };
    setFlip((f) => (f.x === next.x && f.y === next.y ? f : next));
  });
  if (!p) return null;
  const [vx, vy, vw, vh] = p.view;
  const style = { '--dx': p.tip[0] - vx, '--dy': p.tip[1] - vy, '--w': vw, '--h': vh };
  return (
    <p ref={ref} className={`say ${className} ${flip.y ? 'flip-y' : ''} ${flip.x ? 'flip-x' : ''}`} role={role} style={style}>
      <span className="sr">{text ?? p.text}</span>
      <svg viewBox={p.view.join(' ')} aria-hidden="true">
        <path className="bal" d={p.balloon} />
        <path className="emph" d={p.emph} />
        <path className="rest" d={p.rest} />
      </svg>
    </p>
  );
}
