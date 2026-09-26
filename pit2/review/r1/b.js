const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/review/r1/';
const W = +process.argv[2] || 1440, H = Math.round(W * 9 / 16);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://localhost:4931/'); await p.waitForTimeout(1500);
  const shot = (n) => p.screenshot({ path: `${D}${W}-${n}.png` });
  const c = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const drag = async (a, z) => { const [x1, y1] = await c(a), [x2, y2] = await c(z); await p.mouse.move(x1, y1); await p.mouse.down(); await p.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 8 }); await p.mouse.move(x2, y2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200); };
  // palette
  await p.click('.pal-tab'); await p.waitForTimeout(400); await shot('01-palette-open');
  await p.hover('.pal-item[aria-label="Add XOR"]'); await p.waitForTimeout(200); await shot('02-palette-hover');
  // drag XOR onto canvas
  const cv = await p.locator('.canvas').boundingBox();
  await p.dragAndDrop('.pal-item[aria-label="Add XOR"]', '.canvas', { targetPosition: { x: cv.width * 0.45, y: cv.height * 0.8 } }).catch(e => console.log('dnd', e.message));
  await p.waitForTimeout(400); await shot('03-dropped-xor');
  await p.mouse.click(cv.x + cv.width * 0.6, cv.y + 30); // close palette? click pane
  await p.waitForTimeout(300);
  // wire
  await drag('[data-id="1-s1-out-source"]', '[data-id="1-g1-in0-target"]');
  await drag('[data-id="1-s2-out-source"]', '[data-id="1-g1-in1-target"]');
  await drag('[data-id="1-g1-out-source"]', '[data-id="1-l1-in0-target"]');
  await shot('04-wired');
  await p.click('.switch >> nth=0'); await p.waitForTimeout(300); await shot('05-A-on-halflit');
  await p.click('.switch >> nth=1'); await p.waitForTimeout(300); await shot('06-both-on');
  // reject: second wire into taken pin
  await drag('[data-id="1-s1-out-source"]', '[data-id="1-g1-in1-target"]');
  await p.waitForTimeout(150); await shot('07-reject-balloon');
  await p.waitForTimeout(3000); await shot('07b-after-reject');
  // grid toast
  await p.click('.disk'); await p.waitForTimeout(250); await shot('08-grid-toast');
  await p.click('.disk'); await p.waitForTimeout(250); await shot('08b-grid-toast2');
  await p.hover('.disk'); await p.waitForTimeout(150); await shot('08c-disk-hover');
  await p.waitForTimeout(4200);
  // add switches for scroll
  await p.click('.pal-tab').catch(() => {}); await p.waitForTimeout(300);
  for (let i = 0; i < 4; i++) { await p.click('.pal-item[aria-label="Add Switch"]', { force: true }).catch(e => console.log('add', e.message)); await p.waitForTimeout(150); }
  await p.click('.pal-item[aria-label="Add Lamp"]', { force: true }).catch(() => {});
  await p.waitForTimeout(400); await shot('09-many-switches');
  await p.locator('.truth .tt').evaluate(e => { e.scrollTop = 300; e.scrollLeft = 120; }); await p.waitForTimeout(400); await shot('10-table-scrolled');
  await p.hover('.truth tbody tr:not(.live):not(.pad) >> nth=2'); await shot('10b-row-hover');
  await p.locator('.truth .tt').evaluate(e => { e.scrollLeft = 9999; e.scrollTop = 99999; }); await p.waitForTimeout(400); await shot('10c-table-end');
  // zoom
  await p.mouse.move(cv.x + cv.width / 2, cv.y + cv.height / 2);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -200); await p.waitForTimeout(80); }
  await p.waitForTimeout(400); await shot('11-zoomed-in');
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(80); }
  await p.waitForTimeout(400); await shot('12-zoomed-out');
  // hover node -> remove
  await p.hover('.react-flow__node-G >> nth=0'); await p.waitForTimeout(200); await shot('13-node-hover');
  await p.locator('.react-flow__node-G >> nth=0 >> .remove').click({ force: true }).catch(e => console.log('rm', e.message));
  await p.waitForTimeout(300); await shot('14-deleted');
  const st = await p.evaluate(() => ({ status: document.querySelector('.status')?.innerText, help: document.querySelector('.help')?.innerHTML, trans: getComputedStyle(document.querySelector('.pal-bar')).transition }));
  console.log(JSON.stringify(st));
  await b.close();
})();
