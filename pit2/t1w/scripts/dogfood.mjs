// Real-user dogfood: drives the app via real palette-item HTML5 drags onto specific canvas points,
// keyboard wiring (Enter/Space on a focused port, same as WCAG 2.1.1 keyboard wiring), switch clicks
// and wheel-zoom. One scripted scene: half-lit AND, lit OR/XOR, NAND+NOR bubble contrast (one lit
// body/unlit bubble, one unlit body/lit bubble), a NOT hop feeding a NAND, wire crossings, 5 lamps.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const [, , prefix, outdir, portArg] = process.argv;
const PORT = portArg || '4180';

const server = spawn('npx', ['vite', 'preview', '--port', PORT, '--strictPort'], { stdio: 'pipe' });
let ready = false;
server.stdout.on('data', (d) => { if (d.toString().includes('Local')) ready = true; });
server.stderr.on('data', (d) => process.stderr.write(d.toString()));
for (let i = 0; i < 100 && !ready; i++) await wait(200);
await wait(500);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

const H = (id, h) => `[data-id="${id}"] .react-flow__handle[data-handleid="${h}"]`;
const WIRES = [
  ['s1', 'out', 'g1', 'in0'], ['s2', 'out', 'g1', 'in1'], ['g1', 'out', 'l1', 'in0'],
  ['s1', 'out', 'gor_1', 'in0'], ['s2', 'out', 'gor_1', 'in1'], ['gor_1', 'out', 'l_7', 'in0'],
  ['s1', 'out', 'gxor_2', 'in0'], ['s2', 'out', 'gxor_2', 'in1'], ['gxor_2', 'out', 'l_8', 'in0'],
  ['s1', 'out', 'gnot_3', 'in0'], ['gnot_3', 'out', 'l_9', 'in0'],
  ['gnot_3', 'out', 'gnand_4', 'in0'], ['s2', 'out', 'gnand_4', 'in1'], ['gnand_4', 'out', 'l_10', 'in0'],
  ['s_6', 'out', 'gnor_5', 'in0'], ['s1', 'out', 'gnor_5', 'in1'], ['gnor_5', 'out', 'l_11', 'in0'],
];

// Drop-target fractions of the canvas box (0-1), scaled to whatever width the canvas renders at, so
// the same scene lays out sensibly at 1280/1440/1920 without per-width tuning.
const DROPS = [
  ['Add OR', 0.20, 0.05], ['Add XOR', 0.20, 0.85], ['Add NOT', 0.55, 0.05],
  ['Add NAND', 0.55, 0.85], ['Add NOR', 0.85, 0.85], ['Add Switch', 0.15, 0.45],
  ['Add Lamp', 0.35, 0.20], ['Add Lamp', 0.35, 0.65], ['Add Lamp', 0.70, 0.05],
  ['Add Lamp', 0.70, 0.65], ['Add Lamp', 0.95, 0.05],
];

// Real HTML5 drag-and-drop, same event sequence a browser fires for an actual mouse drag from the
// palette (App.jsx's onDragOverCapture/onDropCapture handle it): dragstart on the palette button,
// dragenter/dragover/drop on the canvas at the target point, one shared DataTransfer throughout.
async function dropPart(page, label, cx, cy) {
  await page.evaluate(({ label, cx, cy }) => {
    const src = document.querySelector(`.pal-item[aria-label="${label}"]`);
    const canvas = document.querySelector('.canvas');
    const dt = new DataTransfer();
    const fire = (el, type, x, y) => el.dispatchEvent(new DragEvent(type, {
      bubbles: true, cancelable: true, clientX: x, clientY: y, dataTransfer: dt,
    }));
    const sb = src.getBoundingClientRect();
    fire(src, 'dragstart', sb.x + sb.width / 2, sb.y + sb.height / 2);
    fire(canvas, 'dragenter', cx, cy);
    fire(canvas, 'dragover', cx, cy);
    fire(canvas, 'drop', cx, cy);
  }, { label, cx, cy });
  await wait(80);
}

async function buildScene(page) {
  await page.click('.pal-tab');
  await wait(150);
  const cbox = await page.locator('.canvas').boundingBox();
  for (const [label, fx, fy] of DROPS) {
    await dropPart(page, label, cbox.x + fx * cbox.width, cbox.y + fy * cbox.height);
  }
  await page.click('.pal-tab'); // tuck the tray away so it doesn't cover the ports
  await wait(150);
  for (const [a, ah, b, bh] of WIRES) {
    await page.locator(H(a, ah)).focus();
    await page.keyboard.press('Enter');
    await page.locator(H(b, bh)).focus();
    await page.keyboard.press('Enter');
    await wait(40);
  }
}

async function setSwitches(page, ids) {
  for (const id of ids) { await page.click(`[data-id="${id}"] .switch`); await wait(80); }
}

async function setZoom(page, target) {
  if (target === 1) return;
  const box = await page.locator('.canvas').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const steps = target > 1 ? -1 : 1;
  const ticks = Math.round(Math.abs(Math.log(target) / Math.log(1.1)) * 3);
  for (let i = 0; i < ticks; i++) await page.mouse.wheel(0, steps * 100);
  await wait(250);
}

// One fresh page per shot: builds the scene, sets switches, sets zoom, screenshots, closes. Slower
// but each shot is independent (no zoom/state drift carried from a previous shot).
async function sceneShot(width, zoom, switchIds, name) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await wait(400);
  await buildScene(page);
  await setSwitches(page, switchIds);
  await setZoom(page, zoom);
  await page.screenshot({ path: `${outdir}/${prefix}-${name}.png` });
  await page.close();
}

for (const width of [1280, 1440, 1920]) {
  for (const zoom of [0.75, 1, 1.5]) {
    const zt = String(zoom).replace('.', '');
    await sceneShot(width, zoom, [], `${width}-z${zt}-unlit`);
    await sceneShot(width, zoom, ['s1'], `${width}-z${zt}-halflit`);
    await sceneShot(width, zoom, ['s1', 's2', 's_6'], `${width}-z${zt}-lit`);
  }
}

await browser.close();
server.kill();
process.exit(0);
