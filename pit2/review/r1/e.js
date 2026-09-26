const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/review/r1/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 810 } });
  await p.goto('http://localhost:4931/'); await p.waitForTimeout(1500);
  const act = () => p.evaluate(() => { const e = document.activeElement; return e.tagName + '.' + String(e.className.baseVal ?? e.className).split(' ')[0] + '|' + e.getAttribute('aria-label'); });
  // A: Tab from start to pal-tab, Enter, then Tab forward x3
  for (let i = 0; i < 14; i++) await p.keyboard.press('Tab');
  console.log('A at', await act());
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); console.log('A tab', i + 1, await act()); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  console.log('A esc with focus outside -> open?', await p.evaluate(() => document.querySelector('.palette').classList.contains('open')));
  // B: palette open by click, focus canvas node, Escape
  await p.reload(); await p.waitForTimeout(1200);
  await p.click('.pal-tab'); await p.waitForTimeout(300);
  await p.focus('.react-flow__node-G'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  console.log('B esc focus canvas -> open?', await p.evaluate(() => document.querySelector('.palette').classList.contains('open')));
  // C: click on pal-tab (focus on tab) then Escape
  await p.reload(); await p.waitForTimeout(1200);
  await p.click('.pal-tab'); await p.waitForTimeout(300); console.log('C focus', await act());
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  console.log('C esc focus tab -> open?', await p.evaluate(() => document.querySelector('.palette').classList.contains('open')));
  await p.reload(); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${D}caps-1440.png` });
  await b.close();
})();
