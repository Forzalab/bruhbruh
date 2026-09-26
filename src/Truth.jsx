import { useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from './sim.js';
import Tag, { VIA } from './Tag.jsx';

// Truth table built from the circuit (Kerney req. 2). Columns = switches A, B, C... then lamps 1, 2... in NAME order
// (names are stable per part, so dragging a part never re-letters a column). 2^n rows, MSB = A. Rows are computed once
// per circuit SHAPE, not per toggle; only a window of rows is rendered, so 13 switches (8,192 rows) stay cheap.
// The live row = the switches' current values. Clicking a row sets the switches to it.
// T3: the header row lives OUTSIDE the scroller (thead and tbody are separate blocks), so no row can ever slide under it;
// the scroller is exactly N whole rows tall and every scroll comes to rest on a whole-row boundary.
export default function Truth({ circuit, names, fig, setSwitches }) {
  const byName = (kind) => Object.values(circuit.nodes).filter((n) => n.kind === kind).map((n) => n.id)
    .sort((a, b) => names[a].localeCompare(names[b], 'en', { numeric: true }));
  const ins = byName('S'), outs = byName('L');
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
  const cols = ins.length + outs.length;
  // "via" line under an output head: the name of the part that drives that lamp (gate codename or switch letter).
  const via = (id) => { const w = Object.values(circuit.wires).find((x) => x.target === id); return w ? names[w.source] : ''; };

  // Windowing: fixed row height, read from CSS (--rh is a whole px, so scrollTop = k * rowH is exact).
  const box = useRef(null);
  const [rowH, setRowH] = useState(60), [top, setTop] = useState(0), [boxH, setBoxH] = useState(300);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const tr = el.querySelector('tr:not(.pad)'); if (tr) setRowH(tr.getBoundingClientRect().height || 60);
    setBoxH(el.clientHeight);
  });
  const first = Math.max(0, Math.floor(top / rowH) - 2), last = Math.min(rows.length, first + Math.ceil(boxH / rowH) + 5);
  // Keep the live row in view when the switches change (header is outside the scroller: no offset needed).
  useEffect(() => {
    const el = box.current; if (!el) return;
    const fit = Math.round(el.clientHeight / rowH), firstShown = Math.round(el.scrollTop / rowH);
    if (live < firstShown) el.scrollTop = live * rowH;
    else if (live >= firstShown + fit) el.scrollTop = (live - fit + 1) * rowH;
  }, [live, rowH]);
  // Whole-row rest: when a scroll ends (wheel, drag, keys, arrows), round to the nearest row. No animation.
  const settle = useRef(0);
  const onScroll = (e) => {
    const el = e.currentTarget; setTop(el.scrollTop);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => { const k = Math.round(el.scrollTop / rowH) * rowH; if (Math.abs(k - el.scrollTop) > 0.5) el.scrollTop = k; }, 120);
  };

  const head = (id, i) => (
    <th key={id} scope="col" role="columnheader" aria-label={i < ins.length ? `Switch ${names[id]}` : `Lamp ${names[id]}`}>
      <Tag text={names[id]} className="th-tag" />
      {VIA && i >= ins.length && <span className="via" aria-hidden="true">{via(id)}</span>}
    </th>
  );
  return (
    <aside className="cell c-side r2 truth" aria-label="Truth table">
      <h2 className="label">Truth table</h2>
      <div className={`tt ${VIA ? 'has-via' : ''}`} style={{ '--cols': cols }}>
        <table role="table">
          <thead role="rowgroup"><tr role="row">{[...ins, ...outs].map(head)}</tr></thead>
          <tbody role="rowgroup" ref={box} onScroll={onScroll} tabIndex={0} aria-label="Rows">
            {first > 0 && <tr className="pad" style={{ height: first * rowH }} aria-hidden="true" />}
            {rows.slice(first, last).map((row, k) => {
              const i = first + k;
              return (
                <tr key={i} role="row" className={i === live ? 'live' : ''} onClick={() => setSwitches(ins, row.slice(0, ins.length))}>
                  {row.map((b, j) => <td key={j} role="cell">{fig(b)}</td>)}
                </tr>
              );
            })}
            {last < rows.length && <tr className="pad" style={{ height: (rows.length - last) * rowH }} aria-hidden="true" />}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
