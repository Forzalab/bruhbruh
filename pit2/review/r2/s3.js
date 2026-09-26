const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const D = __dirname + '/';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1280, 1000], [1440, 700], [1920, 1200]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:4817'); await p.waitForTimeout(1500);
    await p.screenshot({ path: D + `aspect-${w}x${h}.png` });
    console.log(w, h, await p.evaluate(() => { const r = document.querySelector('.app').getBoundingClientRect(); return [r.x, r.y, r.width, r.height, document.documentElement.scrollWidth, document.documentElement.scrollHeight].map(Math.round).join(' '); }));
    await p.close();
  }
  // keyboard-only pass
  const p = await b.newPage({ viewport: { width: 1440, height: 810 } });
  await p.goto('http://localhost:4817'); await p.waitForTimeout(1500);
  const seq = [];
  for (let i = 0; i < 20; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(80);
    const f = await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName}.${e.className} [${e.getAttribute('aria-label') || ''}] ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} outline=${cs.outlineStyle} ${cs.outlineWidth}`; });
    seq.push(f);
    if (i < 8) await p.screenshot({ path: D + `kb-${i}.png` });
  }
  console.log(seq.join('\n'));
  // keyboard wiring: focus s1 output, Enter, focus g1 in0, Enter
  await p.focus('[data-nodeid="s1"][data-handleid="out"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.screenshot({ path: D + `kb-picked.png` });
  await p.focus('[data-nodeid="g1"][data-handleid="in0"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  console.log('edges after kb wire', await p.evaluate(() => document.querySelectorAll('.react-flow__edge').length));
  // Enter on g1 input without pending -> balloon
  await p.focus('[data-nodeid="g1"][data-handleid="in1"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.screenshot({ path: D + `kb-noout.png` });
  // switch toggle by space
  await p.focus('.switch'); await p.keyboard.press('Space'); await p.waitForTimeout(200);
  await p.screenshot({ path: D + `kb-switch.png` });
  // palette by keyboard: open tab, Enter on item
  await p.focus('.pal-tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.keyboard.press('Tab'); await p.waitForTimeout(100);
  console.log('after tab open', await p.evaluate(() => document.activeElement.getAttribute('aria-label')));
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  console.log('nodes after Enter on pal item', await p.evaluate(() => document.querySelectorAll('.react-flow__node').length));
  await p.screenshot({ path: D + `kb-paladd.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  console.log('palette open after Esc', await p.evaluate(() => !!document.querySelector('.palette.open')));
  // reduced motion
  await p.emulateMedia({ reducedMotion: 'reduce' });
  console.log('pal-bar transition (reduced)', await p.evaluate(() => getComputedStyle(document.querySelector('.pal-bar')).transitionDuration));
  // font check
  console.log('fonts', await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).join(', ')));
  await b.close();
})();
