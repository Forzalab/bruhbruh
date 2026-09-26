const { chromium } = require('playwright');
const D = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/review/r1/';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1280, 720], [1440, 810], [1920, 1080]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:4931/'); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${D}base-${w}.png` });
    if (w == 1440) {
      const info = await p.evaluate(() => [...document.querySelectorAll('.react-flow__node,.react-flow__edge,button,[tabindex],h1,h2,.lockup,.rownum,.truth td,.truth th')].map(e => {
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return [e.tagName, (e.className.baseVal ?? e.className).slice(0, 40), e.dataset.id, e.getAttribute('aria-label'), Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), cs.fontSize, cs.fontWeight, cs.color, cs.backgroundColor].join('|');
      }));
      console.log(info.join('\n'));
    }
    await p.close();
  }
  await b.close();
})();
