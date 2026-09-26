// scripts/e2e.mjs — Playwright end-to-end smoke test for the circuit editor.
//
// Drives the REAL UI (real DOM clicks on switches, table rows, palette items, wire delete X)
// but builds each circuit's wiring/parts via a dev-only hook (window.__gob.load) instead of
// hand-dragging nodes, so exhaustive combos stay fast. See src/App.jsx for the hook.
//
// Run: node scripts/e2e.mjs   (starts its own vite dev server on a free port, or E2E_PORT)
//      node scripts/e2e.mjs --check-build   (also runs `vite build` and asserts the __gob hook is not in dist)

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';

const { chromium } = pkg;
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORT = Number(process.env.E2E_PORT) || await freePort();
const URL = `http://localhost:${PORT}`;

const failures = [];
const log = (...a) => console.log(...a);
const ok = (label, cond, detail) => {
  if (cond) { log(`  ok - ${label}`); }
  else { log(`  FAIL - ${label}${detail ? ' :: ' + detail : ''}`); failures.push(`${label}${detail ? ' :: ' + detail : ''}`); }
};

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status === 200) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) return reject(new Error('dev server did not come up in time'));
      setTimeout(tick, 200);
    };
    tick();
  });
}

async function main() {
  log(`Starting vite dev server on :${PORT}...`);
  const server = spawn(path.join(ROOT, 'node_modules/.bin/vite'), ['--port', String(PORT), '--strictPort'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverOut = '';
  server.stdout.on('data', (d) => (serverOut += d));
  server.stderr.on('data', (d) => (serverOut += d));
  server.on('exit', (code) => { if (code && code !== 0 && code !== null) log('vite exited early with code', code, serverOut); });

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    await waitForServer(URL);
    const page = await browser.newPage();
    page.on('pageerror', (e) => { failures.push(`page error: ${e.message}`); log('  PAGE ERROR:', e.message); });
    page.on('console', (m) => { if (m.type() === 'error') log('  console.error:', m.text()); });

    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__gob, null, { timeout: 10000 });

    await testGatesAlone(page);
    await testThreeInput(page);
    await testThirteenSwitches(page);
    await testFourteenthSwitchBlocked(page);
    await testWireDeleteUpdatesTable(page);
    await testRestored(page);
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }

  if (process.argv.includes('--check-build')) checkBuild();
  log('');
  if (failures.length) {
    log(`${failures.length} FAILURE(S):`);
    failures.forEach((f) => log(' -', f));
    process.exitCode = 1;
  } else {
    log('All e2e checks passed.');
  }
}

// ---- helpers -------------------------------------------------------------

const load = (page, circuit) => page.evaluate((c) => window.__gob.load(c), circuit);
const state = (page) => page.evaluate(() => window.__gob.state());

const switchSel = (id) => `.react-flow__node[data-id="${id}"] button.switch`;
const lampSel = (id) => `.react-flow__node[data-id="${id}"] .node.lamp`;

async function setSwitchesUI(page, bits /* { id: bool } */) {
  for (const [id, want] of Object.entries(bits)) {
    const pressed = await page.getAttribute(switchSel(id), 'aria-pressed');
    if ((pressed === 'true') !== !!want) await page.click(switchSel(id));
  }
}

async function lampOn(page, id) {
  const label = await page.getAttribute(lampSel(id), 'aria-label');
  return / on$/.test(label ?? ''); // 'Lamp on' or, with Swedish names (t3), 'Lamp <name> on'
}

async function liveRowOut(page, outCount) {
  // Reads the last `outCount` cells of the highlighted (.live) table row via the screen-reader span,
  // which holds the real digit (the sibling span is a duplicate, aria-hidden glyph run).
  return page.evaluate((n) => {
    const row = document.querySelector('aside.truth tbody tr.live');
    if (!row) return null;
    const cells = [...row.querySelectorAll('td .sr')].map((s) => s.textContent);
    return cells.slice(cells.length - n).map(Number);
  }, outCount);
}

function bitsFor(n, r) {
  return Array.from({ length: n }, (_, i) => (r >> (n - 1 - i)) & 1);
}

// ---- 1. every gate alone, 2-input (and NOT, 1-input), all combos --------

const GATES = {
  AND:  { pins: 2, fn: (a, b) => a && b },
  OR:   { pins: 2, fn: (a, b) => a || b },
  XOR:  { pins: 2, fn: (a, b) => a !== b },
  NAND: { pins: 2, fn: (a, b) => !(a && b) },
  NOR:  { pins: 2, fn: (a, b) => !(a || b) },
  NOT:  { pins: 1, fn: (a) => !a },
};

async function testGatesAlone(page) {
  log('\n== Every gate alone, all input combos ==');
  for (const [type, { pins, fn }] of Object.entries(GATES)) {
    const nodes = { g1: { id: 'g1', kind: 'G', type }, l1: { id: 'l1', kind: 'L' } };
    const wires = { w1: { id: 'w1', source: 's1', target: 'g1', pin: 0 } };
    nodes.s1 = { id: 's1', kind: 'S', value: false };
    if (pins === 2) {
      nodes.s2 = { id: 's2', kind: 'S', value: false };
      wires.w2 = { id: 'w2', source: 's2', target: 'g1', pin: 1 };
    }
    wires.w3 = { id: 'w3', source: 'g1', target: 'l1', pin: 0 };
    await load(page, { nodes, wires });
    await page.waitForSelector(switchSel('s1'));

    for (let r = 0; r < 2 ** pins; r++) {
      const bits = bitsFor(pins, r);
      const want = fn(...bits.map((b) => !!b));
      const setup = { s1: bits[0] };
      if (pins === 2) setup.s2 = bits[1];
      await setSwitchesUI(page, setup);
      const lamp = await lampOn(page, 'l1');
      ok(`${type} ${bits.join('')} -> lamp ${want ? 'on' : 'off'}`, lamp === want, `got ${lamp}`);
      const rowOut = await liveRowOut(page, 1);
      ok(`${type} ${bits.join('')} -> table OUT`, rowOut?.[0] === (want ? 1 : 0), `got ${JSON.stringify(rowOut)}`);
    }
  }
}

// ---- 2. a 3-input circuit: OUT = (s1 AND s2) OR s3 -----------------------

async function testThreeInput(page) {
  log('\n== 3-input circuit: (s1 AND s2) OR s3 ==');
  const circuit = {
    nodes: {
      s1: { id: 's1', kind: 'S', value: false },
      s2: { id: 's2', kind: 'S', value: false },
      s3: { id: 's3', kind: 'S', value: false },
      g1: { id: 'g1', kind: 'G', type: 'AND' },
      g2: { id: 'g2', kind: 'G', type: 'OR' },
      l1: { id: 'l1', kind: 'L' },
    },
    wires: {
      w1: { id: 'w1', source: 's1', target: 'g1', pin: 0 },
      w2: { id: 'w2', source: 's2', target: 'g1', pin: 1 },
      w3: { id: 'w3', source: 'g1', target: 'g2', pin: 0 },
      w4: { id: 'w4', source: 's3', target: 'g2', pin: 1 },
      w5: { id: 'w5', source: 'g2', target: 'l1', pin: 0 },
    },
  };
  await load(page, circuit);
  await page.waitForSelector(switchSel('s1'));

  for (let r = 0; r < 8; r++) {
    const [a, b, c] = bitsFor(3, r);
    const want = !!((a && b) || c);
    await setSwitchesUI(page, { s1: a, s2: b, s3: c });
    const lamp = await lampOn(page, 'l1');
    ok(`3-input ${a}${b}${c} -> lamp ${want ? 'on' : 'off'} (switch clicks)`, lamp === want, `got ${lamp}`);
    const rowOut = await liveRowOut(page, 1);
    ok(`3-input ${a}${b}${c} -> table OUT`, rowOut?.[0] === (want ? 1 : 0), `got ${JSON.stringify(rowOut)}`);
  }

  // Explicit check: clicking a table row (not the switches) updates the lamps.
  // Row index 5 = bits 101 (a=1,b=0,c=1) -> want (1&&0)||1 = true.
  const rowIndex = 5, digits = 2; // 8 rows -> digits = max(2, len('8')) = 2
  const label = String(rowIndex + 1).padStart(digits, '0');
  const clicked = await page.evaluate((lbl) => {
    const row = [...document.querySelectorAll('aside.truth tbody tr:not(.pad)')]
      .find((tr) => String(+tr.dataset.row + 1) === String(+lbl)); // rows carry data-row (0-based); no row-number column
    if (!row) return false;
    row.click();
    return true;
  }, label);
  ok('3-input: found and clicked table row 6 (101)', clicked);
  const bits = bitsFor(3, rowIndex);
  const want = !!((bits[0] && bits[1]) || bits[2]);
  const lamp = await lampOn(page, 'l1');
  ok('3-input: clicking table row updates lamp', lamp === want, `got ${lamp}, want ${want}`);
  const st = await state(page);
  const gotBits = [st.circuit.nodes.s1.value, st.circuit.nodes.s2.value, st.circuit.nodes.s3.value].map(Number);
  ok('3-input: clicking table row sets switches to row bits', JSON.stringify(gotBits) === JSON.stringify(bits), `got ${JSON.stringify(gotBits)} want ${JSON.stringify(bits)}`);
}

// ---- 3. 13-switch circuit: 8192 rows, row click sets switches ------------

function buildChainCircuit(n) {
  // OUT = OR(s1, s2, ..., sn), built as a chain of 2-input OR gates.
  const nodes = {};
  for (let i = 1; i <= n; i++) nodes[`s${i}`] = { id: `s${i}`, kind: 'S', value: false };
  const wires = {};
  let wIdx = 1;
  let prev = 's1';
  for (let i = 2; i <= n; i++) {
    const g = `g${i - 1}`;
    nodes[g] = { id: g, kind: 'G', type: 'OR' };
    wires[`w${wIdx++}`] = { id: `w${wIdx - 1}`, source: prev, target: g, pin: 0 };
    wires[`w${wIdx++}`] = { id: `w${wIdx - 1}`, source: `s${i}`, target: g, pin: 1 };
    prev = g;
  }
  nodes.l1 = { id: 'l1', kind: 'L' };
  wires[`w${wIdx++}`] = { id: `w${wIdx - 1}`, source: prev, target: 'l1', pin: 0 };
  return { nodes, wires };
}

async function testThirteenSwitches(page) {
  log('\n== 13-switch circuit: 8192 rows ==');
  const circuit = buildChainCircuit(13);
  await load(page, circuit);
  await page.waitForSelector(switchSel('s1'));

  const rowH = await page.evaluate(() => document.querySelector('aside.truth tbody tr:not(.pad)').getBoundingClientRect().height);

  // Scroll to top: first row should read "0001".
  await page.evaluate(() => { const el = document.querySelector('aside.truth .tt'); el.scrollTop = 0; el.dispatchEvent(new Event('scroll')); });
  await page.waitForTimeout(50);
  const firstLabel = await page.evaluate(() => String(+document.querySelector('aside.truth tbody tr:not(.pad)')?.dataset.row + 1).padStart(4, '0'));
  ok('13-switch table: first row is 0001', firstLabel === '0001', `got ${firstLabel}`);

  // Scroll far past the end: the last real row should read "8192" and nothing further.
  await page.evaluate((h) => { const el = document.querySelector('aside.truth .tt'); el.scrollTop = 999999 * h; el.dispatchEvent(new Event('scroll')); }, rowH);
  await page.waitForTimeout(50);
  await page.waitForTimeout(50);
  const lastLabels = await page.evaluate(() => [...document.querySelectorAll('aside.truth tbody tr:not(.pad)')].map((tr) => String(+tr.dataset.row + 1)));
  ok('13-switch table: last rendered row is 8192 (2^13 rows)', lastLabels.includes('8192'), `got ${JSON.stringify(lastLabels)}`);
  ok('13-switch table: no row beyond 8192', !lastLabels.some((l) => Number(l) > 8192), `got ${JSON.stringify(lastLabels)}`);

  // Click a mid-table row and confirm switches + lamp match its bits.
  const ids = Array.from({ length: 13 }, (_, i) => `s${i + 1}`);
  for (const rowIndex of [0, 1, 4096, 8191]) {
    const label = String(rowIndex + 1).padStart(4, '0');
    await page.evaluate(({ h, r }) => { const el = document.querySelector('aside.truth .tt'); el.scrollTop = Math.max(0, r * h - h * 3); el.dispatchEvent(new Event('scroll')); }, { h: rowH, r: rowIndex });
    await page.waitForTimeout(50);
    const clicked = await page.evaluate((lbl) => {
      const row = [...document.querySelectorAll('aside.truth tbody tr:not(.pad)')].find((tr) => String(+tr.dataset.row + 1) === String(+lbl)); // rows carry data-row (0-based); no row-number column
      if (!row) return false;
      row.click();
      return true;
    }, label);
    ok(`13-switch: found+clicked row ${label}`, clicked);
    if (!clicked) continue;
    const bits = bitsFor(13, rowIndex);
    const st = await state(page);
    const gotBits = ids.map((id) => Number(st.circuit.nodes[id].value));
    ok(`13-switch: row ${label} sets switches correctly`, JSON.stringify(gotBits) === JSON.stringify(bits), `got ${JSON.stringify(gotBits)} want ${JSON.stringify(bits)}`);
    const want = bits.some((b) => b);
    const lamp = await lampOn(page, 'l1');
    ok(`13-switch: row ${label} -> lamp ${want ? 'on' : 'off'}`, lamp === want, `got ${lamp}`);
  }
}

// ---- 4. 14th switch is blocked in the palette ----------------------------

async function testFourteenthSwitchBlocked(page) {
  log('\n== 14th switch blocked in the palette ==');
  // Circuit is still the 13-switch one loaded by the previous test.
  await page.click('button[aria-label="Open parts"]');
  const item = page.locator('button.pal-item[aria-label*="switch" i], button.pal-item[aria-label*="Switch" i]').first();
  await item.waitFor({ state: 'visible' });
  const ariaLabel = await item.getAttribute('aria-label');
  const ariaDisabled = await item.getAttribute('aria-disabled');
  const draggable = await item.getAttribute('draggable');
  ok('palette: switch item is aria-disabled at 13 switches', ariaDisabled === 'true', `aria-label="${ariaLabel}" aria-disabled="${ariaDisabled}"`);
  ok('palette: switch item mentions the 13-switch cap', /13 switch/i.test(ariaLabel || ''), `aria-label="${ariaLabel}"`);
  ok('palette: switch item not draggable', draggable === 'false', `draggable="${draggable}"`);

  const before = await state(page);
  const beforeCount = Object.values(before.circuit.nodes).filter((n) => n.kind === 'S').length;
  await item.click({ force: true });
  const after = await state(page);
  const afterCount = Object.values(after.circuit.nodes).filter((n) => n.kind === 'S').length;
  ok('palette: clicking the blocked switch item adds nothing', afterCount === beforeCount, `before ${beforeCount} after ${afterCount}`);

  // Close the palette so it doesn't intercept clicks in later tests.
  await page.click('button[aria-label="Close parts"]');
}

// ---- 5. deleting a wire updates the table --------------------------------

async function testWireDeleteUpdatesTable(page) {
  log('\n== Deleting a wire updates the table ==');
  const circuit = {
    nodes: {
      s1: { id: 's1', kind: 'S', value: false },
      s2: { id: 's2', kind: 'S', value: false },
      g1: { id: 'g1', kind: 'G', type: 'AND' },
      l1: { id: 'l1', kind: 'L' },
    },
    wires: {
      w1: { id: 'w1', source: 's1', target: 'g1', pin: 0 },
      w2: { id: 'w2', source: 's2', target: 'g1', pin: 1 },
      w3: { id: 'w3', source: 'g1', target: 'l1', pin: 0 },
    },
  };
  await load(page, circuit);
  await page.waitForSelector(switchSel('s1'));
  await setSwitchesUI(page, { s1: true, s2: true });
  ok('wire-delete setup: AND(1,1) lamp on before delete', await lampOn(page, 'l1'), '');
  let rowOut = await liveRowOut(page, 1);
  ok('wire-delete setup: table OUT=1 before delete', rowOut?.[0] === 1, `got ${JSON.stringify(rowOut)}`);

  // Hover the s1->g1 wire so its delete X appears, then click it.
  const edge = page.locator('.react-flow__edge[data-id="w1"] .wire-hit');
  await edge.waitFor({ state: 'attached' });
  await edge.hover();
  const removeBtn = page.locator('button.remove[aria-label="Delete wire"]');
  await removeBtn.waitFor({ state: 'visible', timeout: 3000 });
  await removeBtn.click();

  const st = await state(page);
  ok('wire-delete: wire w1 removed from circuit state', !st.circuit.wires.w1, JSON.stringify(Object.keys(st.circuit.wires)));

  // pin0 is now unwired -> AND(false, true) = false.
  const lamp = await lampOn(page, 'l1');
  ok('wire-delete: lamp goes off after removing an AND input', lamp === false, `got ${lamp}`);
  rowOut = await liveRowOut(page, 1);
  ok('wire-delete: table OUT updates to 0 after the delete', rowOut?.[0] === 0, `got ${JSON.stringify(rowOut)}`);
}

// ---- 6. restored features (pit2/restore): X inside shape, no pin squares, draft wire ----

async function testRestored(page) {
  log('\n== Restored: X only inside the drawn shape, no pin squares, step draft wire ==');
  await load(page, { nodes: { s1: { id: 's1', kind: 'S', value: false }, g1: { id: 'g1', kind: 'G', type: 'AND' }, l1: { id: 'l1', kind: 'L' } }, wires: {} });
  await page.waitForSelector('.react-flow__node[data-id="g1"] .shape .body.hit');
  const xOf = (id) => page.evaluate((i) => getComputedStyle(document.querySelector(`.react-flow__node[data-id="${i}"] .remove`)).opacity, id);
  const box = await page.locator('.react-flow__node[data-id="g1"]').boundingBox();
  await page.mouse.move(box.x + 2, box.y + 2); await page.waitForTimeout(250);          // node box corner, outside the drawn AND
  ok('X hidden in the node box corner (outside the shape)', (await xOf('g1')) === '0', await xOf('g1'));
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height / 2); await page.waitForTimeout(50);
  ok('X shows with the pointer inside the drawn shape', (await xOf('g1')) === '1', await xOf('g1'));
  const xb = await page.locator('.react-flow__node[data-id="g1"] .remove').boundingBox();
  await page.mouse.move(xb.x + xb.width / 2, xb.y + xb.height / 2, { steps: 4 }); await page.waitForTimeout(250);
  ok('X stays up while the pointer travels onto it (grace)', (await xOf('g1')) === '1', await xOf('g1'));
  await page.mouse.move(box.x - 60, box.y - 60); await page.waitForTimeout(300);
  ok('X hides after leaving', (await xOf('g1')) === '0', await xOf('g1'));

  const port = page.locator('.react-flow__node[data-id="s1"] .react-flow__handle[data-handleid="out"]');
  const pb = await port.boundingBox();
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2); await page.waitForTimeout(50);
  const outline = await port.evaluate((e) => getComputedStyle(e).outlineStyle);
  ok('no ghost square on pin hover', outline === 'none', outline);
  await page.mouse.down();
  await page.mouse.move(pb.x + 200, pb.y + 90, { steps: 6 });
  const d = await page.evaluate(() => { const p = document.querySelector('.react-flow__connectionline .wire-draft');
    return p && { d: p.getAttribute('d'), dash: getComputedStyle(p).strokeDasharray, w: getComputedStyle(p).strokeWidth }; });
  ok('draft wire drawn by Draft.jsx', !!d, JSON.stringify(d));
  ok('draft wire is solid', d && (d.dash === 'none' || d.dash === ''), d?.dash);
  // borderRadius 0: getSmoothStepPath still emits Q corners, but degenerate ones (control point == end point).
  const arcs = d ? [...d.d.matchAll(/Q\s*([-\d.]+),([-\d.]+)\s+([-\d.]+),([-\d.]+)/g)].filter((m) => m[1] !== m[3] || m[2] !== m[4]) : [1];
  ok('draft wire is a right-angle step (square corners)', arcs.length === 0, d?.d);
  await page.mouse.up();
}

function checkBuild() {
  log('\n== Build: dev hook stripped ==');
  execFileSync(path.join(ROOT, 'node_modules/.bin/vite'), ['build', '--outDir', 'dist-e2e', '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore' });
  const dir = path.join(ROOT, 'dist-e2e/assets');
  const js = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
  ok('dist has no __gob hook', !js.includes('__gob'));
  ok('dist has no __GOB preset', !js.includes('__GOB'));
  fs.rmSync(path.join(ROOT, 'dist-e2e'), { recursive: true, force: true });
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
