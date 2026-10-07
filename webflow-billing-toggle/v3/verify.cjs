const {chromium} = require('C:/Users/Anast/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1200,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'demo.html')).href);
  const annual=page.locator('[data-billing="toggle"] [data-toggle-btn="annual"]');
  const quarterly=page.locator('[data-billing="toggle"] [data-toggle-btn="quarterly"]');
  const tabs=page.locator('[data-bouncy-tabs-button]');
  async function check(cycle){
   const state=await page.evaluate(()=>({cycle:document.documentElement.dataset.billingCycle,
    buttons:[...document.querySelectorAll('[data-billing="toggle"] [data-toggle-btn]')].map(x=>({value:x.dataset.toggleBtn,active:x.hasAttribute('data-toggle-active'),pressed:x.getAttribute('aria-pressed'),tab:x.tabIndex})),
    groups:[...document.querySelectorAll('[data-billing="annual"],[data-billing="quarterly"]')].map(x=>({value:x.dataset.billing,inert:x.inert,hidden:x.getAttribute('aria-hidden')}))}));
   assert.equal(state.cycle,cycle);
   for(const b of state.buttons){assert.equal(b.active,b.value===cycle);assert.equal(b.pressed,String(b.value===cycle));assert.equal(b.tab,b.value===cycle?0:-1);}
   for(const g of state.groups){assert.equal(g.inert,g.value!==cycle);assert.equal(g.hidden,String(g.value!==cycle));}
  }
  await check('annual');
  const heights=await page.locator('[data-billing="prices"]').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height));
  await quarterly.nth(0).click(); await check('quarterly');
  await page.waitForTimeout(550);
  assert.equal(await tabs.nth(0).getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('[data-billing="annual"]').first().evaluate(x=>getComputedStyle(x).visibility),'hidden');
  await page.locator('[data-toggle-bg]').evaluateAll(xs=>xs.forEach(x=>{
    const width=x.getBoundingClientRect().width;
    const translate=new DOMMatrix(getComputedStyle(x).transform).m41;
    if(Math.abs(width-translate)>1) throw new Error('Pill does not match button width');
  }));
  assert.deepEqual(await page.locator('[data-billing="prices"]').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height)),heights);
  await quarterly.nth(2).focus();await page.keyboard.press('ArrowLeft');await check('annual');
  await page.keyboard.press('End');await check('quarterly');
  await page.keyboard.press('Home');await check('annual');
  await page.keyboard.press('ArrowLeft');await check('quarterly');
  await annual.nth(1).focus();await page.keyboard.press('Space');await check('annual');
  for(let i=0;i<9;i++)await (i%2?annual:quarterly).nth(i%3).click();
  await check('quarterly');
  await tabs.nth(1).click();await page.waitForTimeout(1000);await check('quarterly');
  await tabs.nth(0).click();await page.waitForTimeout(1000);await check('quarterly');
  assert.equal(await page.locator('[data-billing="annual"]').first().evaluate(x=>getComputedStyle(x).opacity),'0');
  assert.equal(await page.locator('[data-billing="quarterly"]').first().evaluate(x=>getComputedStyle(x).opacity),'1');
  await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'footer.html'),'utf8').replace(/<\/?script>/g,'')});
  assert.equal(await page.locator('[role="status"]').count(),1);
  await page.setViewportSize({width:375,height:900});await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const mobile=await page.locator('[data-billing="prices"]').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height));
  await annual.nth(1).click();
  assert.deepEqual(await page.locator('[data-billing="prices"]').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height)),mobile);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('[data-toggle-bg]').first().evaluate(x=>getComputedStyle(x).transitionDuration),'0s');
  await page.reload();await check('annual');
  await page.setViewportSize({width:1200,height:900});await page.waitForTimeout(100);
  await page.screenshot({path:path.join(__dirname,'preview.png'),fullPage:true});
  // Removing all switch classes must preserve animation and selection.
  await page.evaluate(()=>document.querySelectorAll('[data-billing="toggle"], [data-billing="toggle"] *').forEach(x=>x.removeAttribute('class')));
  await quarterly.nth(0).click();await check('quarterly');
  assert.deepEqual(errors,[]);
  console.log('PASS: global sync, original pill alignment, keyboard/wrap/Home/End/Space, rapid changes, stable desktop/mobile height, reduced motion, duplicate initialization, default reset, class independence, unchanged Bouncy Tabs integration, no JS errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
