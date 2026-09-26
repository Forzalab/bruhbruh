import { useEffect, useRef } from 'react';
import { WIPE_VIEWBOX, WIPE_EMPH, WIPE_REST } from './t4Lettering.js';

// Row 03 control bar: [undo] [wipe] [redo]. Icons on a 24-unit square grid, one stroke weight (3 = 12.5%, the grid
// disk's 13/100), butt caps, miter joins: the site's stroke language (Muller-Brockmann p.163: SBB pictograms from one
// basic element of fixed length and thickness).
export const ICONS = {
  hook: {
    undo: 'M9 5L4 10L9 15M4 10H14.5A4.5 4.5 0 0 1 14.5 19H7',
    wipe: 'M3 6.5H21M9 6.5V3.5H15V6.5M5.5 6.5L7 20.5H17L18.5 6.5M10 10V17M14 10V17',
  },
  step: {
    undo: 'M9 4L4 9L9 14M4 9H19.5V20',
    wipe: 'M3 6.5H21M9 6.5V3.5H15V6.5M6 6.5V20.5H18V6.5M10 10V17M14 10V17',
  },
  arc: {
    undo: 'M5 13A7 7 0 1 0 12 6H8M11 3L8 6L11 9',
    wipe: 'M3 6.5H21M9 6.5V3.5H15V6.5M5.5 6.5L6.5 20.5H17.5L18.5 6.5M9.5 10.5L14.5 16.5M14.5 10.5L9.5 16.5',
  },
};

const Icon = ({ d, flip }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} transform={flip ? 'matrix(-1 0 0 1 24 0)' : undefined} /></svg>
);

// Wipe confirm bubble: same family as the palette hint (ellipse + straight tail, paper fill, ink outline, Anime Ace
// lettering as paths). Ellipse 232x72u, straight tail from its lower left down to the button, lettering 174u wide
// (hint scale 0.023u per font unit), centred on the ellipse.
export function WipeBubble() {
  return (
    <p className="wipe-bubble" role="alert">
      <svg viewBox="0 0 240 100" aria-hidden="true">
        {/* ellipse centre (132, 40), rx 116, ry 36; opened at its lower left between x 40 (y 61.9) and x 64 (y 69.2);
            straight tail to the tip (36, 96), which sits over the wipe button's centre line */}
        <path d="M40 61.9A116 36 0 1 1 64 69.2L36 96Z" />
      </svg>
      <span className="sr">Wipe canvas? Click again to wipe.</span>
      <svg className="lettering" viewBox={WIPE_VIEWBOX} aria-hidden="true"><path d={WIPE_EMPH} /><path className="rest" d={WIPE_REST} /></svg>
    </p>
  );
}

export default function Controls({ variant = 'C', icons = 'hook', canUndo, canRedo, canWipe, armed, setArmed, onUndo, onRedo, onWipe, force }) {
  const I = ICONS[icons] ?? ICONS.hook;
  const wipeRef = useRef(null);
  // Armed wipe disarms on any pointerdown outside the wipe button, or Escape.
  useEffect(() => {
    if (!armed) return;
    const down = (e) => { if (!wipeRef.current?.contains(e.target)) setArmed(false); };
    const key = (e) => { if (e.key === 'Escape') setArmed(false); };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key); };
  }, [armed, setArmed]);
  const f = (k) => (force && force[k]) || '';
  return (
    <div className={`ctl ctl-${variant}`} role="toolbar" aria-label="History">
      <button className={`cb ${f('undo')}`} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" onClick={onUndo}><Icon d={I.undo} /></button>
      <span className="cb-wrap">
        <button ref={wipeRef} className={`cb wipe ${armed ? 'armed' : ''} ${f('wipe')}`} disabled={!canWipe} aria-pressed={armed}
          aria-label={armed ? 'Confirm: wipe canvas' : 'Wipe canvas'} title={armed ? undefined : 'Wipe canvas'}
          onClick={() => (armed ? (setArmed(false), onWipe()) : setArmed(true))}><Icon d={I.wipe} /></button>
        {armed && <WipeBubble />}
      </span>
      <button className={`cb ${f('redo')}`} disabled={!canRedo} aria-label="Redo" title="Redo (Shift+Ctrl+Z)" onClick={onRedo}><Icon d={I.undo} flip /></button>
    </div>
  );
}
