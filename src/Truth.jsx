import { useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from './sim.js';

// Truth table built from the circuit (Kerney req. 2). Inputs = switches ordered top-to-bottom on the canvas (then
// left-to-right), outputs = lamps in the same order. 2^n rows, MSB = the top switch. Rows are computed once per circuit
// SHAPE (wires, parts, order), not per toggle; only a window of rows is rendered, so 13 switches (8,192 rows) stay cheap.
// The live row = the switches' current values. Clicking a row sets the switches to it.
const letter = (i) => String.fromCharCode(65 + i);

export default function Truth({ circuit, view, fig, setSwitches }) {
  const byPos = (kind) => view.filter((n) => circuit.nodes[n.id]?.kind === kind)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).map((n) => n.id);
  const ins = byPos('S'), outs = byPos('L'), gates = byPos('G');
  const shape = JSON.stringify([ins, outs, gates, circuit.wires, Object.values(circuit.nodes).map((n) => [n.id, n.kind, n.type])]);
  const rows = useMemo(() => {
    const n = ins.length, all = [], mid = [];
    for (let r = 0; r < 2 ** n; r++) {
      const bits = ins.map((_, i) => (r >> (n - 1 - i)) & 1);
      const nodes = { ...circuit.nodes };
      ins.forEach((id, i) => { nodes[id] = { ...nodes[id], value: !!bits[i] }; });
      const v = evaluate({ ...circuit, nodes });
      all.push([...bits, ...outs.map((id) => +!!v[id])]);
      mid.push(gates.map((id) => +!!v[id])); // gate columns: intermediate values, shown between inputs and outputs
    }
    return all.map((r, k) => [...r.slice(0, n), ...mid[k], ...r.slice(n)]);
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps

  const live = ins.reduce((acc, id) => acc * 2 + (circuit.nodes[id].value ? 1 : 0), 0);
  // Column groups: s = switch (input), g = gate (intermediate), l = lamp (output). Each cell carries its group class
  // so the variants can separate the three kinds of column.
  const gType = gates.map((id) => circuit.nodes[id].type);
  const heads = [...ins.map((_, i) => [letter(i), 's']),
    ...gates.map((id, i) => [gType.filter((t) => t === gType[i]).length > 1 ? `${gType[i]}${gType.slice(0, i + 1).filter((t) => t === gType[i]).length}` : gType[i], 'g']),
    ...outs.map((_, i) => [outs.length === 1 ? 'OUT' : `Q${i + 1}`, 'l'])];
  const grp = (j) => heads[j][1] + (j === 0 || heads[j - 1][1] !== heads[j][1] ? ' first' : '');
  const digits = Math.max(2, String(rows.length).length);

  // Windowing: fixed row height measured from the first rendered row.
  const box = useRef(null);
  const [rowH, setRowH] = useState(40), [top, setTop] = useState(0), [boxH, setBoxH] = useState(400);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const tr = el.querySelector('tbody tr:not(.pad)'); if (tr) setRowH(tr.getBoundingClientRect().height || 40);
    setBoxH(el.clientHeight);
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

  return (
    <aside className="cell c-side r2 truth" aria-label="Truth table">
      <h2 className="label">Truth table</h2>
      <div className="tt" ref={box} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
        <table>
          <thead><tr>
            <th scope="col" className="n">#</th>
            {heads.map(([h], j) => <th key={h} scope="col" className={grp(j)} data-cap={{ s: 'In', g: 'Gates', l: 'Out' }[heads[j][1]]}>{h}</th>)}
          </tr></thead>
          <tbody>
            {first > 0 && <tr className="pad" style={{ height: first * rowH }} aria-hidden="true" />}
            {rows.slice(first, last).map((row, k) => {
              const i = first + k;
              return (
                <tr key={i} className={i === live ? 'live' : ''} onClick={() => setSwitches(ins, row.slice(0, ins.length))}>
                  <td className="n">{String(i + 1).padStart(digits, '0')}</td>
                  {row.map((b, j) => <td key={j} className={`${grp(j)} v${b}`}>{b}</td>)}
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
