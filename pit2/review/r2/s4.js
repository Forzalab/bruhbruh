const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 810 } });
 await p.goto('http://localhost:4817'); await p.waitForTimeout(1300);
 await p.focus('.pal-tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
 console.log('open?', await p.evaluate(()=>!!document.querySelector('.palette.open')));
 for (let i=0;i<4;i++){ await p.keyboard.press('Tab'); await p.waitForTimeout(100);
  console.log(await p.evaluate(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();return e.tagName+'.'+e.className+' '+(e.getAttribute('aria-label')||'')+' '+Math.round(r.x)+','+Math.round(r.y)}));}
 await p.screenshot({path: __dirname+'/kb-pal-tab4.png'});
 await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Shift+Tab');await p.keyboard.press('Shift+Tab');
 console.log('back', await p.evaluate(()=>document.activeElement.getAttribute('aria-label')));
 await p.keyboard.press('Enter'); await p.waitForTimeout(300);
 console.log('nodes', await p.evaluate(()=>document.querySelectorAll('.react-flow__node').length));
 await p.screenshot({path: __dirname+'/kb-pal-enter.png'});
 await b.close(); })();
