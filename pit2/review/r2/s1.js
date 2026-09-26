const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const D = __dirname + '/';
(async () => {
  const b = await chromium.launch();
  for (const w of [1280, 1440, 1920]) {
    const h = Math.round(w * 810 / 1440);
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:4817'); await p.waitForTimeout(1800);
    await p.screenshot({ path: D + `base-${w}.png` });
    if (w === 1440) {
      const inv = await p.evaluate(() => [...document.querySelectorAll('button,[tabindex],a,input,[role=button],tr,.react-flow__node,.react-flow__edge')].map(e => { const r = e.getBoundingClientRect(); return `${e.tagName}.${e.className.baseVal ?? e.className} [${e.getAttribute('aria-label') || ''}] ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} tab=${e.tabIndex} data=${e.dataset.id||''}`; }));
      console.log(inv.join('\n'));
      console.log(await p.evaluate(() => document.body.innerText));
    }
    await p.close();
  }
  await b.close();
})();
