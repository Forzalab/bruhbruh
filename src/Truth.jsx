import { useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from './sim.js';
import { ScrollCues } from './Palette.jsx';

// Truth table built from the circuit (Kerney req. 2). Inputs = switches ordered top-to-bottom on the canvas (then
// left-to-right), outputs = lamps in the same order. 2^n rows, MSB = the top switch. Rows are computed once per circuit
// SHAPE (wires, parts, order), not per toggle; only a window of rows is rendered, so 13 switches (8,192 rows) stay cheap.
// The live row = the switches' current values. Clicking a row sets the switches to it.
const letter = (i) => String.fromCharCode(65 + i);

export default function Truth({ circuit, view, fig, setSwitches }) {
  const byPos = (kind) => view.filter((n) => circuit.nodes[n.id]?.kind === kind)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).map((n) => n.id);
  const ins = byPos('S'), outs = byPos('L');
  const shape = JSON.stringify([ins, outs, circuit.wires, Object.values(circuit.nodes).map((n) => [n.id, n.kind, n.type])]);
  const rows = useMemo(() => {
    const n = ins.length, all = [];
    for (let r = 0; r < 2 ** n; r++) {
      const bits = ins.map((_, i) => (r >> (n - 1 - i)) & 1);
      const nodes = { ...circuit.nodes };
      ins.forEach((id, i) => { nodes[id] = { ...nodes[id], value: !!bits[i] }; });
      const v = evaluate({ ...circuit, nodes });
      all.push([...bits, ...outs.map((id) => +!!v[id])]);
    }
    return all;
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps

  const live = ins.reduce((acc, id) => acc * 2 + (circuit.nodes[id].value ? 1 : 0), 0);
  const heads = [...ins.map((_, i) => letter(i)), ...outs.map((_, i) => (outs.length === 1 ? 'OUT' : `Q${i + 1}`))];
  const classic = ins.length === 2 && outs.length === 1; // the fitted A / B / OUT header glyphs apply only here

  // Windowing: fixed row height measured from the first rendered row.
  const box = useRef(null);
  const [rowH, setRowH] = useState(40), [top, setTop] = useState(0), [boxH, setBoxH] = useState(400);
  const [more, setMore] = useState({ up: false, down: false, left: false, right: false }); // palette's scroll cues: only where rows / columns remain
  const cues = (el) => {
    const m = { up: el.scrollTop > 1, down: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
      left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 };
    setMore((o) => (Object.keys(m).some((k) => m[k] !== o[k]) ? m : o));
  };
  useEffect(() => {
    const el = box.current; if (!el) return;
    const tr = el.querySelector('tbody tr:not(.pad)'); if (tr) setRowH(tr.getBoundingClientRect().height || 40);
    setBoxH(el.clientHeight);
    cues(el);
  });
  const first = Math.max(0, Math.floor(top / rowH) - 2), last = Math.min(rows.length, first + Math.ceil(boxH / rowH) + 5);
  // Keep the live row in view when the switches change.
  useEffect(() => {
    const el = box.current; if (!el) return;
    const head = el.querySelector('thead')?.getBoundingClientRect().height || 0;
    el.style.scrollPaddingTop = `${head}px`; // manual scrolling snaps rows under the sticky header, never half a row
    const y = live * rowH, fit = Math.floor((el.clientHeight - head) / rowH); // whole rows that fit
    const firstShown = Math.round(el.scrollTop / rowH);
    if (live < firstShown) el.scrollTop = y;
    else if (live >= firstShown + fit) el.scrollTop = (live - fit + 1) * rowH; // always a whole-row boundary
  }, [live, rowH]);

  const cls = (h) => ({ A: 'hA', B: 'hB' })[h];
  const kind = (j) => (j < ins.length ? 'k-S' : 'k-L'); // column kind: switch (input) or lamp (output)
  const stop = live >= first && live < last ? live : first;
  return (
    <aside className="cell c-side r2 truth" aria-label="Truth table">
      <h2 className="label">Truth table</h2>
      <div className="tt-wrap">
      <div className={`tt ${classic ? 'classic' : ''}`} ref={box} onScroll={(e) => { setTop(e.currentTarget.scrollTop); cues(e.currentTarget); }}>
        <table style={{ '--n': heads.length }} role="grid" aria-label="Truth table rows; arrow keys set the switches">
          <thead><tr>
            {heads.map((h, j) => h === 'OUT' && classic
              ? <th key={h} className={kind(j)} scope="col" aria-label="OUT"><span className="sr">OUT</span><span aria-hidden="true"><span className="hO">O</span><span className="hU">U</span><span className="hT">T</span></span></th>
              : <th key={h} className={kind(j)} scope="col"><span className={classic ? cls(h) : undefined}>{h}</span></th>)}
          </tr></thead>
          <tbody>
            {first > 0 && <tr className="pad" style={{ height: first * rowH }} aria-hidden="true" />}
            {rows.slice(first, last).map((row, k) => {
              const i = first + k;
              return (
                <tr key={i} className={i === live ? 'live' : ''} tabIndex={i === stop ? 0 : -1}
                  aria-selected={i === live} data-row={i}
                  onClick={() => setSwitches(ins, row.slice(0, ins.length))}
                  onKeyDown={(e) => {
                    const go = (j) => { if (j < 0 || j >= rows.length) return; e.preventDefault();
                      setSwitches(ins, rows[j].slice(0, ins.length));
                      requestAnimationFrame(() => box.current?.querySelector(`tr[data-row="${j}"]`)?.focus()); };
                    if (e.key === 'ArrowDown') go(i + 1); else if (e.key === 'ArrowUp') go(i - 1);
                    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(rows.length - 1);
                    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSwitches(ins, row.slice(0, ins.length)); } }}>
                  {row.map((b, j) => <td key={j} className={kind(j)}>{fig(b)}</td>)}
                </tr>
              );
            })}
            {last < rows.length && <tr className="pad" style={{ height: (rows.length - last) * rowH }} aria-hidden="true" />}
          </tbody>
        </table>
      </div>
      <ScrollCues more={more} onWheel={(e) => box.current?.scrollBy(e.shiftKey ? { left: e.deltaY || e.deltaX } : { top: e.deltaY, left: e.deltaX })} />
      </div>
    </aside>
  );
}
