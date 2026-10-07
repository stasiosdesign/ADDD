const {chromium} = require('C:/Users/Anast/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const script=fs.readFileSync(path.join(__dirname,'footer.html'),'utf8').replace(/<\/?script>/g,'');
const css=fs.readFileSync(path.join(__dirname,'head.html'),'utf8');
const gsap=fs.readFileSync(path.join(__dirname,'gsap.test.min.js'),'utf8');
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1200,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'demo.html')).href);
  const annual=page.locator('[data-billing="toggle"] [data-toggle-btn="annual"]');
  const quarterly=page.locator('[data-billing="toggle"] [data-toggle-btn="quarterly"]');
  const tabs=page.locator('[data-bouncy-tabs-button]');
  async function billing(cycle){
   const s=await page.evaluate(()=>({cycle:document.documentElement.dataset.billingCycle,
    buttons:[...document.querySelectorAll('[data-billing="toggle"] [data-toggle-btn]')].map(x=>({v:x.dataset.toggleBtn,a:x.hasAttribute('data-toggle-active'),p:x.getAttribute('aria-pressed'),tab:x.tabIndex})),
    groups:[...document.querySelectorAll('[data-billing="annual"],[data-billing="quarterly"]')].map(x=>({v:x.dataset.billing,inert:x.inert,hidden:x.getAttribute('aria-hidden'),inline:x.style.opacity}))}));
   assert.equal(s.cycle,cycle);
   for(const b of s.buttons){assert.equal(b.a,b.v===cycle);assert.equal(b.p,String(b.v===cycle));assert.equal(b.tab,b.v===cycle?0:-1);}
   for(const g of s.groups){assert.equal(g.inert,g.v!==cycle);assert.equal(g.hidden,String(g.v!==cycle));assert.equal(g.inline,'');}
  }
  async function tabState(index){
   const s=await page.locator('[data-bouncy-tabs-panel]').evaluateAll(xs=>xs.map(x=>({a:x.hasAttribute('data-active'),inert:x.inert,o:getComputedStyle(x).opacity,v:getComputedStyle(x).visibility})));
   s.forEach((p,i)=>{assert.equal(p.a,i===index);assert.equal(p.inert,i!==index);assert.equal(p.o,i===index?'1':'0');assert.equal(p.v,i===index?'visible':'hidden');});
  }
  await billing('annual');await tabState(0);
  await quarterly.nth(0).click();await billing('quarterly');
  await page.waitForTimeout(550);
  await page.locator('[data-toggle-bg]').evaluateAll(xs=>xs.forEach(x=>{
   if(Math.abs(x.getBoundingClientRect().width-new DOMMatrix(getComputedStyle(x).transform).m41)>1)throw Error('Pill misaligned');
  }));
  await quarterly.nth(2).focus();await page.keyboard.press('ArrowLeft');await billing('annual');
  await page.keyboard.press('End');await billing('quarterly');
  await page.keyboard.press('Home');await billing('annual');
  await page.keyboard.press('ArrowLeft');await billing('quarterly');
  assert.equal(await tabs.nth(0).getAttribute('aria-selected'),'true');
  await annual.nth(1).focus();await page.keyboard.press('Space');await billing('annual');
  for(let i=0;i<9;i++)await (i%2?annual:quarterly).nth(i%3).click();
  await billing('quarterly');
  // Rapid panel reversals previously allowed stale timeline cleanup to run later.
  for(let i=0;i<11;i++)await tabs.nth(i%2?0:1).click();
  await page.waitForTimeout(1100);await tabState(1);await billing('quarterly');
  await tabs.nth(1).focus();await page.keyboard.press('Home');await page.waitForTimeout(1100);
  await tabState(0);await billing('quarterly');
  assert.equal(await page.locator('[data-billing="annual"]').first().evaluate(x=>getComputedStyle(x).opacity),'0');
  // Panel height follows content changes without a window resize.
  const oldHeight=await page.locator('[data-bouncy-tabs-panels]').evaluate(x=>x.offsetHeight);
  await page.locator('[data-bouncy-tabs-panel]').first().evaluate(x=>{
    const extra=document.createElement('div');extra.style.height='137px';x.append(extra);
  });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-bouncy-tabs-panels]').evaluate(x=>x.offsetHeight),oldHeight+137);
  await page.addScriptTag({content:script});assert.equal(await page.locator('[role="status"]').count(),1);
  await page.setViewportSize({width:375,height:900});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const heights=await page.locator('[data-billing="prices"]').evaluateAll(xs=>xs.map(x=>x.offsetHeight));
  await annual.nth(1).click();
  assert.deepEqual(await page.locator('[data-billing="prices"]').evaluateAll(xs=>xs.map(x=>x.offsetHeight)),heights);
  // Changing motion preference while an animation is active settles the state.
  await tabs.nth(1).click();await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  await tabState(1);
  assert.equal(await page.locator('[data-toggle-bg]').first().evaluate(x=>getComputedStyle(x).transitionDuration),'0s');
  await tabs.nth(0).click();await tabState(0);
  await page.reload();await billing('annual');
  await page.setViewportSize({width:1200,height:900});await page.waitForTimeout(100);
  await page.screenshot({path:path.join(__dirname,'preview.png'),fullPage:true});
  assert.deepEqual(errors,[]);

  // Separate minimal fixture: no classes, nested roots, explicit stagger children,
  // and accidental billing item tags must not break billing visibility.
  const minimal=`<div data-bouncy-tabs-init>
   <div data-bouncy-tabs-nav><i data-bouncy-tabs-indicator></i><button data-bouncy-tabs-button data-active>A</button><button data-bouncy-tabs-button>B</button></div>
   <div data-bouncy-tabs-panels>
    <section data-bouncy-tabs-panel data-active>
     ${fs.readFileSync(path.join(__dirname,'toggle.html'),'utf8').replace(/ class="[^"]*"/g,'')}
     <div data-billing="prices"><div data-billing="annual" data-bouncy-tabs-item>£80</div><div data-billing="quarterly" data-bouncy-tabs-item>£100</div></div>
     <div data-bouncy-tabs-item="children"><p>One</p><p>Two</p></div>
     <div data-bouncy-tabs-init>
      <div data-bouncy-tabs-nav><i data-bouncy-tabs-indicator></i><button data-bouncy-tabs-button data-active>Inner A</button><button data-bouncy-tabs-button>Inner B</button></div>
      <div data-bouncy-tabs-panels><section data-bouncy-tabs-panel data-active>Inner first</section><section data-bouncy-tabs-panel>Inner second</section></div>
     </div>
    </section>
    <section data-bouncy-tabs-panel>Second</section>
   </div>
  </div>`;
  const checkPage=await browser.newPage();
  checkPage.on('pageerror',e=>errors.push(e.message));
  await checkPage.setContent(`<!doctype html><html><head>${css}</head><body>${minimal}</body></html>`);
  await checkPage.addScriptTag({content:gsap});await checkPage.addScriptTag({content:script});
  await checkPage.locator('[data-toggle-btn="quarterly"]').click();
  const roots=checkPage.locator('[data-bouncy-tabs-init]');
  await roots.nth(1).locator('[data-bouncy-tabs-button]').nth(1).click();
  await checkPage.waitForTimeout(1000);
  assert.equal(await roots.nth(0).locator(':scope > [data-bouncy-tabs-nav] [data-bouncy-tabs-button]').nth(0).getAttribute('aria-selected'),'true');
  const outer=roots.nth(0).locator(':scope > [data-bouncy-tabs-nav] [data-bouncy-tabs-button]');
  await outer.nth(1).click();await checkPage.waitForTimeout(1000);
  await outer.nth(0).click();await checkPage.waitForTimeout(1000);
  assert.equal(await checkPage.locator('[data-billing="annual"]').evaluate(x=>x.style.opacity),'');
  assert.equal(await checkPage.locator('[data-billing="annual"]').evaluate(x=>getComputedStyle(x).opacity),'0');
  assert.equal(await checkPage.locator('[data-billing="quarterly"]').evaluate(x=>getComputedStyle(x).opacity),'1');
  const ids=await checkPage.locator('[id]').evaluateAll(xs=>xs.map(x=>x.id));assert.equal(ids.length,new Set(ids).size);
  // Without GSAP, tab and billing selection must still function.
  const fallback=await browser.newPage();fallback.on('pageerror',e=>errors.push(e.message));
  await fallback.setContent(`<!doctype html><html><head>${css}</head><body>${minimal}</body></html>`);
  await fallback.addScriptTag({content:script});
  await fallback.locator('[data-bouncy-tabs-init]').first().locator(':scope > [data-bouncy-tabs-nav] [data-bouncy-tabs-button]').nth(1).click();
  assert.equal(await fallback.locator('[data-bouncy-tabs-init]').first().locator(':scope > [data-bouncy-tabs-panels] > [data-bouncy-tabs-panel]').nth(1).getAttribute('aria-hidden'),'false');
  const nonNative=await browser.newPage();
  nonNative.on('pageerror',e=>errors.push(e.message));
  await nonNative.setContent(`<!doctype html><html><head>${css}</head><body>${minimal.replaceAll('<button data-bouncy-tabs-button','<div data-bouncy-tabs-button').replaceAll('</button></div>','</div></div>').replaceAll('>A</button>','>A</div>').replaceAll('>Inner A</button>','>Inner A</div>')}</body></html>`);
  await nonNative.addScriptTag({content:script});
  const divTabs=nonNative.locator('[data-bouncy-tabs-init]').first().locator(':scope > [data-bouncy-tabs-nav] [data-bouncy-tabs-button]');
  await divTabs.nth(1).focus();await nonNative.keyboard.press('Space');
  assert.equal(await divTabs.nth(1).getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
  console.log('PASS: global billing sync, original pill alignment, keyboard, rapid billing and tab reversals, hidden/inert state, automatic height updates, mobile stability, live reduced-motion change, duplicate init, nested roots, no class dependence, automatic opacity-conflict avoidance, GSAP fallback, no JS errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
