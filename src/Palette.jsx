import { useEffect, useRef, useState } from 'react';
import { Glyph } from './nodes/index.jsx';
import Say from './Say.jsx';

// Vertical palette (Tony, Sep 25): groups in/out | plain ("yea") | inverted ("nah"), glyphs only.
// Each plain gate sits in the same slot as its inverted twin (AND/NAND, OR/NOR, XOR/NOT).
export const GROUPS = [
  [{ kind: 'S', name: 'Switch' }, { kind: 'L', name: 'Lamp' }],
  [{ kind: 'G', type: 'AND' }, { kind: 'G', type: 'OR' }, { kind: 'G', type: 'XOR' }],
  [{ kind: 'G', type: 'NAND' }, { kind: 'G', type: 'NOR' }, { kind: 'G', type: 'NOT' }],
];
// The scroll cues, shared with the truth table so both scrollers say "more" the same way.
export const ScrollCues = ({ more, onWheel }) => [
  <span key="u" className={`pal-more up ${more.up ? 'on' : ''}`} aria-hidden="true" onWheel={onWheel}><svg viewBox="0 0 16 8"><path d="M0 8L8 0L16 8Z" /></svg></span>,
  <span key="d" className={`pal-more down ${more.down ? 'on' : ''}`} aria-hidden="true" onWheel={onWheel}><svg viewBox="0 0 16 8"><path d="M0 0L8 8L16 0Z" /></svg></span>,
];
export const DND = 'application/x-gob-node';
const HINT_KEY = 'gob.paletteHint';

const seen = () => { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; } };
const markSeen = () => { try { localStorage.setItem(HINT_KEY, '1'); } catch { /* private mode: hint may show again */ } };

// open/setOpen and `tucked` (a drag is running: bar slides away, state restored after) come from App.
export default function Palette({ open, setOpen, tucked, onDrag, switchFull, onAdd }) {
  const list = useRef(null);
  const [more, setMore] = useState({ up: false, down: false });
  const [hint, setHint] = useState(false);

  // Scroll cues: a black arrow tile shows only on a side that still has items past the edge.
  const measure = () => {
    const el = list.current;
    if (!el) return;
    setMore({ up: el.scrollTop > 1, down: el.scrollTop + el.clientHeight < el.scrollHeight - 1 });
  };
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, [open]);

  // Onboarding: the bubble shows the first time only, 1s after load, if the person has not started yet.
  // Once shown, the first click or key anywhere retires it for good; every later close/tuck just hides the bar.
  useEffect(() => {
    if (seen()) return;
    let shown = false;
    const t = setTimeout(() => { shown = true; setHint(true); }, 1000);
    const stop = () => { clearTimeout(t); if (shown) { setHint(false); markSeen(); } off(); };
    const off = () => { window.removeEventListener('pointerdown', stop); window.removeEventListener('keydown', stop); };
    window.addEventListener('pointerdown', stop);
    window.addEventListener('keydown', stop);
    return () => { clearTimeout(t); off(); };
  }, []);

  const wheel = (e) => list.current?.scrollBy({ top: e.deltaY });

  const item = (it) => {
    const label = it.name ?? it.type;
    const off = it.kind === 'S' && switchFull;
    return (
      <li key={label}>
        <button className="pal-item" draggable={!off} aria-disabled={off || undefined}
          aria-label={off ? `${label}, 13 switches max` : `Add ${label}`}
          onDragStart={(e) => { if (off) return e.preventDefault(); e.dataTransfer.setData(DND, JSON.stringify(it)); e.dataTransfer.effectAllowed = 'copy';
            requestAnimationFrame(() => onDrag(true)); }} // after the drag image is taken
          onDragEnd={() => onDrag(false)}
          onClick={() => !off && onAdd(it)}>
          <Glyph kind={it.kind} type={it.type} />
        </button>
      </li>
    );
  };

  return (
    <div className={`palette ${open ? 'open' : ''} ${tucked ? 'tucked' : ''}`}
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}>
      <nav className="pal-bar" aria-label="Parts" aria-hidden={!open || undefined} inert={!open || undefined}>
        <ul ref={list} className={`pal-list ${more.up ? 'fu' : ''} ${more.down ? 'fd' : ''}`} onScroll={measure}>
          {GROUPS.map((g, i) => <li key={i} className="pal-group"><ul>{g.map(item)}</ul></li>)}
        </ul>
        {/* Scroll cues: a bare ink arrowhead in a one-baseline paper margin, no box and no fill behind it (a solid block
            reads as a button, Refactoring UI p.52-53). It swallows clicks (so the half-hidden part under it can't be grabbed
            by accident) and hands the wheel to the list. */}
        <ScrollCues more={more} onWheel={wheel} />
      </nav>
      <button className="pal-tab" aria-expanded={open} aria-label={open ? 'Close parts' : 'Open parts'} onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 40" aria-hidden="true"><path d={open ? 'M16 8L6 20L16 32' : 'M8 8L18 20L8 32'} /></svg>
      </button>
      {hint && !open && !tucked && (
        <Say phrase="hint" className="pal-hint" />
      )}
    </div>
  );
}
