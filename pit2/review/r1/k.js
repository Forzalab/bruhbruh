const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/review/r1/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 810 }, reducedMotion: 'reduce' });
  await p.goto('http://localhost:4931/'); await p.waitForTimeout(1500);
  for (let i = 1; i <= 16; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(250);
    const a = await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      return [e.tagName, (e.className.baseVal ?? e.className).slice(0, 30), e.getAttribute('aria-label'), cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join('|'); });
    console.log(i, a);
    await p.screenshot({ path: `${D}kb-${String(i).padStart(2, '0')}.png` });
  }
  // keyboard wiring: find focused port and press Enter on an output then an input
  await p.focus('[data-id="1-s1-out-source"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${D}kb-wire-picked.png` });
  await p.focus('[data-id="1-g1-in0-target"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${D}kb-wire-done.png` });
  await p.focus('[data-id="1-g1-in0-target"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${D}kb-wire-reject.png` });
  const t0 = Date.now();
  while (await p.locator('.say-logo, .say-part').count() && Date.now() - t0 < 12000) await p.waitForTimeout(250);
  console.log('balloon lifetime ms (cap 12000):', Date.now() - t0);
  const tr = await p.evaluate(() => ({ palbar: getComputedStyle(document.querySelector('.pal-bar')).transitionDuration, tab: getComputedStyle(document.querySelector('.pal-tab')).transitionDuration }));
  console.log('reduced-motion transitions', JSON.stringify(tr));
  // table row via keyboard?
  const rowFocusable = await p.evaluate(() => document.querySelector('.truth tbody tr:not(.pad)').tabIndex);
  console.log('row tabIndex', rowFocusable);
  await b.close();
})();
