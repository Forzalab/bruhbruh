const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const D = __dirname + '/';
(async () => { const b = await chromium.launch();
 for (const W of [1280, 1440]) {
 const h = Math.round(W*810/1440);
 const p = await b.newPage({ viewport: { width: W, height: h } });
 await p.goto('http://localhost:4817'); await p.waitForTimeout(1300);
 await p.click('.pal-tab'); await p.waitForTimeout(300);
 for (let i=0;i<3;i++){ await p.click('.pal-item[aria-label="Add Switch"]'); await p.waitForTimeout(200); }
 console.log(W,'nodes after 3 clicks', await p.evaluate(()=>[...document.querySelectorAll('.react-flow__node')].map(n=>{const r=n.getBoundingClientRect();return n.dataset.id+'@'+Math.round(r.x)+','+Math.round(r.y)}).join(' ')));
 await p.screenshot({path: D+`v2-clickadd-${W}.png`});
 // scroll table with wheel steps and check half row
 const box = await p.locator('.truth .tt').boundingBox();
 for (const n of [1,2,3]) {
  await p.mouse.move(box.x+box.width/2, box.y+box.height/2); await p.mouse.wheel(0, 100); await p.waitForTimeout(700);
  const r = await p.evaluate(()=>{const t=document.querySelector('.truth .tt');const th=t.querySelector('thead').getBoundingClientRect();const tb=t.getBoundingClientRect();
   const rows=[...t.querySelectorAll('tbody tr:not(.pad)')].map(r=>r.getBoundingClientRect()).filter(r=>r.bottom>th.bottom&&r.top<tb.bottom);
   return {top:Math.round(tb.top),bottom:Math.round(tb.bottom),headBottom:Math.round(th.bottom),st:t.scrollTop,first:[Math.round(rows[0].top),Math.round(rows[0].bottom)],last:[Math.round(rows.at(-1).top),Math.round(rows.at(-1).bottom)]};});
  console.log(W,'wheel',n,JSON.stringify(r));
  console.log(await p.evaluate(()=>[...document.querySelectorAll('.truth tbody tr:not(.pad)')].slice(0,7).map(r=>r.innerText.replace(/\s+/g,'')).join(' '))); await p.screenshot({path: D+`v2-tt-wheel${n}-${W}.png`});
 }
 await p.close(); }
 await b.close(); })();
