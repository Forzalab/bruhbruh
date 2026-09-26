const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/review/r1/';
(async () => {
  const b = await chromium.launch();
  for (const W of [1280, 1440]) {
    const p = await b.newPage({ viewport: { width: W, height: Math.round(W * 9 / 16) } });
    await p.goto('http://localhost:4931/'); await p.waitForTimeout(1500);
    await p.click('.pal-tab');
    for (let i = 0; i < 4; i++) { await p.click('.pal-item[aria-label="Add Switch"]', { force: true }); await p.waitForTimeout(120); }
    await p.click('.pal-tab');
    const tt = p.locator('.truth .tt'); const bb = await tt.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(150); }
    await p.waitForTimeout(700);
    const g = await p.evaluate(() => { const el = document.querySelector('.truth .tt'); const th = el.querySelector('thead').getBoundingClientRect(); const box = el.getBoundingClientRect();
      const rows = [...el.querySelectorAll('tbody tr:not(.pad)')].map(r => r.getBoundingClientRect()).filter(r => r.bottom > th.bottom && r.top < box.bottom);
      return { scrollTop: el.scrollTop, headBottom: th.bottom, boxTop: box.top, boxBottom: box.bottom, first: [rows[0].top, rows[0].bottom], last: [rows.at(-1).top, rows.at(-1).bottom] }; });
    console.log(W, 'after wheel', JSON.stringify(g));
    await p.screenshot({ path: `${D}deb-${W}-wheel.png` });
    // R2-1 keyboard palette
    await p.reload(); await p.waitForTimeout(1200);
    const before = await p.locator('.react-flow__node').count();
    await p.focus('.pal-tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const af = await p.evaluate(() => document.activeElement.className + '|' + document.activeElement.getAttribute('aria-label'));
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(100);
    const f1 = await p.evaluate(() => document.activeElement.getAttribute('aria-label'));
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const after = await p.locator('.react-flow__node').count();
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const open = await p.evaluate(() => document.querySelector('.palette').classList.contains('open'));
    console.log(W, 'focus after open:', af, '| shift-tab:', f1, '| nodes', before, '->', after, '| open after Esc:', open);
    // R2-9 pressed state
    await p.click('.disk'); await p.waitForTimeout(300);
    const rot = await p.evaluate(() => getComputedStyle(document.querySelector('.disk svg')).transform);
    console.log('disk pressed svg transform', rot);
    await p.screenshot({ path: `${D}deb-${W}-disk-pressed.png` });
    // R2-27 node names
    const names = await p.evaluate(() => [...document.querySelectorAll('.react-flow__node')].map(n => n.getAttribute('aria-label') + ' / inner:' + (n.querySelector('[role=img]')?.getAttribute('aria-label') ?? '-')));
    console.log(names.join(' ; '));
    const main = await p.evaluate(() => document.querySelector('main').getAttribute('aria-label'));
    console.log('main label', main);
    await p.close();
  }
  await b.close();
})();
