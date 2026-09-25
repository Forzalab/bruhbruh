import { useEffect, useRef, useState } from 'react';
import { Glyph } from './nodes/index.jsx';

// Vertical palette (Tony, Sep 25): groups in/out | plain ("yea") | inverted ("nah"), glyphs only.
// Each plain gate sits in the same slot as its inverted twin (AND/NAND, OR/NOR, XOR/NOT).
export const GROUPS = [
  [{ kind: 'S', name: 'Switch' }, { kind: 'L', name: 'Lamp' }],
  [{ kind: 'G', type: 'AND' }, { kind: 'G', type: 'OR' }, { kind: 'G', type: 'XOR' }],
  [{ kind: 'G', type: 'NAND' }, { kind: 'G', type: 'NOR' }, { kind: 'G', type: 'NOT' }],
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

  // Onboarding: the bubble shows once ever, 1s after load, only if the person has not started yet.
  useEffect(() => {
    if (seen()) return;
    let touched = false;
    const stop = () => { touched = true; };
    window.addEventListener('pointerdown', stop, { once: true });
    window.addEventListener('keydown', stop, { once: true });
    const t = setTimeout(() => { if (!touched) setHint(true); }, 1000);
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', stop); window.removeEventListener('keydown', stop); };
  }, []);
  useEffect(() => { if (open && hint) { setHint(false); markSeen(); } }, [open, hint]);

  const page = (dir) => list.current?.scrollBy({ top: dir * list.current.clientHeight * 0.8, behavior: 'smooth' });

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
        <ul ref={list} className="pal-list" onScroll={measure}>
          {GROUPS.map((g, i) => <li key={i} className="pal-group"><ul>{g.map(item)}</ul></li>)}
        </ul>
        <button className={`pal-more up ${more.up ? 'on' : ''}`} tabIndex={-1} aria-hidden="true" onClick={() => page(-1)}>
          <svg viewBox="-50 -50 100 100"><path d="M0 36V-26M-27.9 0.6L0 -27.3L27.9 0.6" /></svg>
        </button>
        <button className={`pal-more down ${more.down ? 'on' : ''}`} tabIndex={-1} aria-hidden="true" onClick={() => page(1)}>
          <svg viewBox="-50 -50 100 100"><path d="M0 -36V26M-27.9 -0.6L0 27.3L27.9 -0.6" /></svg>
        </button>
      </nav>
      <button className="pal-tab" aria-expanded={open} aria-label={open ? 'Close parts' : 'Open parts'} onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 40" aria-hidden="true"><path d={open ? 'M16 8L6 20L16 32' : 'M8 8L18 20L8 32'} /></svg>
      </button>
      {hint && !open && (
        <p className="pal-hint" role="status">
          <svg viewBox="0 0 238 112" aria-hidden="true">
            {/* one outline: ellipse cut on its left side, closed by a straight tail that points at the tab */}
            <path d="M42 72.4A100 48 0 1 0 42 39.6L4 62Z" />
          </svg>
          <span>Gates are<br />in <em>here.</em></span>
        </p>
      )}
    </div>
  );
}
