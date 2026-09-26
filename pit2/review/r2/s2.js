const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const D = __dirname + '/';
const W = +process.argv[2] || 1440;
(async () => {
  const b = await chromium.launch();
  const h = Math.round(W * 810 / 1440);
  const p = await b.newPage({ viewport: { width: W, height: h } });
  const log = (...a) => console.log(...a);
  await p.goto('http://localhost:4817'); await p.waitForTimeout(1500);
  const c = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const wire = async (a, bsel) => { const [x1, y1] = await c(a); const [x2, y2] = await c(bsel);
    await p.mouse.move(x1, y1); await p.mouse.down(); await p.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 8 }); await p.mouse.move(x2, y2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200); };
  // open palette
  await p.click('.pal-tab'); await p.waitForTimeout(400);
  await p.screenshot({ path: D + `pal-open-${W}.png` });
  // hover a palette item
  await p.hover('.pal-item[aria-label="Add XOR"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: D + `pal-hover-${W}.png` });
  // drag XOR to canvas
  await p.locator('.pal-item[aria-label="Add XOR"]').dragTo(p.locator('main.canvas'), { targetPosition: { x: Math.round(W * 0.35), y: Math.round(h * 0.40) } });
  await p.waitForTimeout(500);
  log('nodes', await p.evaluate(() => [...document.querySelectorAll('.react-flow__node')].map(n => n.dataset.id).join(' ')));
  // wire s1->g1 in0, s2->g1 in1, g1->l1
  await wire('[data-handleid="out"][data-nodeid="s1"]', '[data-nodeid="g1"][data-handleid="in0"]');
  await wire('[data-handleid="out"][data-nodeid="s2"]', '[data-nodeid="g1"][data-handleid="in1"]');
  await wire('[data-handleid="out"][data-nodeid="g1"]', '[data-nodeid="l1"][data-handleid="in0"]');
  log('edges', await p.evaluate(() => document.querySelectorAll('.react-flow__edge').length));
  await p.mouse.move(5, 5);
  await p.screenshot({ path: D + `wired-${W}.png` });
  await p.mouse.click(W*0.55, h*0.40); await p.waitForTimeout(300);
  // toggle A only -> half-lit AND
  await p.click('.switch[aria-label^="Switch A"]'); await p.waitForTimeout(300); await p.mouse.move(5, 5);
  await p.screenshot({ path: D + `halflit-${W}.png` });
  await p.click('.switch[aria-label^="Switch B"]'); await p.waitForTimeout(300); await p.mouse.move(5, 5);
  await p.screenshot({ path: D + `lit-${W}.png` });
  // rejected connection: lamp input already driven; wire s1 -> l1 in0
  await wire('[data-handleid="out"][data-nodeid="s1"]', '[data-nodeid="l1"][data-handleid="in0"]');
  await p.waitForTimeout(300);
  await p.screenshot({ path: D + `reject-${W}.png` });
  log('say', await p.evaluate(() => [...document.querySelectorAll('.say')].map(e => e.className + ' ' + JSON.stringify(e.getBoundingClientRect())).join('\n')));
  // grid toggle toast
  await p.hover('.disk'); await p.waitForTimeout(150);
  await p.screenshot({ path: D + `disk-hover-${W}.png` });
  await p.click('.disk'); await p.waitForTimeout(250); await p.click('.disk'); await p.waitForTimeout(400);
  await p.mouse.move(600, 400);
  await p.screenshot({ path: D + `toast-${W}.png` });
  log('toasts', await p.evaluate(() => [...document.querySelectorAll('.toast')].map(e => e.innerText + JSON.stringify(e.getBoundingClientRect())).join('\n')));
  // hover node for delete x
  const [gx, gy] = await c('.react-flow__node[data-id="g1"]'); await p.mouse.move(gx, gy); await p.waitForTimeout(200);
  await p.screenshot({ path: D + `node-hover-${W}.png` });
  // hover a truth row
  await p.hover('.truth tbody tr:nth-child(2)'); await p.waitForTimeout(200);
  await p.screenshot({ path: D + `row-hover-${W}.png` });
  // add 3 more switches via drag to get 5 inputs (H scroll + V scroll)
  for (let i = 0; i < 3; i++) {
    if (!(await p.locator('.palette.open').count())) await p.click('.pal-tab');
    await p.waitForTimeout(300);
    await p.locator('.pal-item[aria-label="Add Switch"]').dragTo(p.locator('main.canvas'), { targetPosition: { x: Math.round(W * 0.12 + 110 * i), y: Math.round(h * 0.52) } });
    await p.waitForTimeout(300);
  }
  await p.mouse.move(600, 400);
  await p.screenshot({ path: D + `many-${W}.png` });
  log('tt', await p.evaluate(() => { const t = document.querySelector('.truth .tt'); return [t.scrollWidth, t.clientWidth, t.scrollHeight, t.clientHeight, [...document.querySelectorAll('.truth .pal-more.on')].map(e => e.className).join('|')].join(' '); }));
  await p.evaluate(() => { const t = document.querySelector('.truth .tt'); t.scrollTop = 200; t.scrollLeft = 400; }); await p.waitForTimeout(300);
  await p.screenshot({ path: D + `tt-scrolled-${W}.png` });
  // zoom canvas
  await p.mouse.move(W * 0.35, h * 0.5);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -200); await p.waitForTimeout(80); }
  await p.waitForTimeout(300);
  await p.screenshot({ path: D + `zoom-in-${W}.png` });
  log('stroke', await p.evaluate(() => getComputedStyle(document.querySelector('.react-flow__edge-path')).strokeWidth + ' ' + document.querySelector('.react-flow__viewport').style.transform));
  // delete via right click on node g1
  const [dx, dy] = await c('.react-flow__node[data-id="g1"]'); await p.mouse.click(dx, dy, { button: 'right' }); await p.waitForTimeout(300);
  await p.screenshot({ path: D + `deleted-${W}.png` });
  log('after delete nodes', await p.evaluate(() => document.querySelectorAll('.react-flow__node').length));
  await b.close();
})();
