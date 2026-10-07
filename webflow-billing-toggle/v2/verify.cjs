const { chromium } = require('C:/Users/Anast/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'msedge', headless:true});
  try {
    const page = await browser.newPage({ viewport:{width:1200,height:850} });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname,'demo.html')).href);
    const toggles = page.locator('[data-billing="toggle"] input');
    async function checkCycle(cycle) {
      const result = await page.evaluate(() => ({
        cycle: document.documentElement.dataset.billingCycle,
        checked: [...document.querySelectorAll('[data-billing="toggle"] input')].map(x => x.checked),
        groups: [...document.querySelectorAll('[data-billing="annual"], [data-billing="quarterly"]')].map(x => ({cycle:x.dataset.billing,inert:x.inert,hidden:x.getAttribute('aria-hidden')}))
      }));
      assert.equal(result.cycle,cycle);
      assert.deepEqual(result.checked,Array(3).fill(cycle==='quarterly'));
      for(const group of result.groups) {
        assert.equal(group.inert,group.cycle!==cycle);
        assert.equal(group.hidden,String(group.cycle!==cycle));
      }
    }
    await checkCycle('annual');
    const heights = await page.locator('[data-billing="prices"]').evaluateAll(xs => xs.map(x => x.getBoundingClientRect().height));
    await toggles.nth(0).click();
    await checkCycle('quarterly');
    await page.waitForTimeout(350);
    assert.equal(await page.locator('[data-billing="annual"]').first().evaluate(x=>getComputedStyle(x).visibility),'hidden');
    assert.equal(await page.locator('[data-billing="label-quarterly"]').last().evaluate(x=>getComputedStyle(x).opacity),'1');
    assert.equal(await page.locator('[data-billing="dot"]').first().evaluate(x=>getComputedStyle(x).transform),'matrix(1, 0, 0, 1, 18, 0)');
    assert.deepEqual(await page.locator('[data-billing="prices"]').evaluateAll(xs => xs.map(x => x.getBoundingClientRect().height)),heights);
    await toggles.nth(2).focus();
    await page.keyboard.press('Space');
    await checkCycle('annual');
    for(let i=0;i<9;i++) await toggles.nth(i%3).click();
    await checkCycle('quarterly');
    await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'footer.html'),'utf8').replace(/<\/?script>/g,'')});
    assert.equal(await page.locator('[role="status"]').count(),1);
    await page.reload();
    await checkCycle('annual');
    await page.setViewportSize({width:375,height:850});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    const mobileHeights = await page.locator('.card').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height));
    await toggles.nth(1).click();
    assert.deepEqual(await page.locator('.card').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().height)),mobileHeights);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('[data-billing="dot"]').first().evaluate(x=>getComputedStyle(x).transitionDuration),'0s');
    await page.setViewportSize({width:1200,height:850});
    await toggles.nth(0).click();
    await page.screenshot({path:path.join(__dirname,'preview.png'),fullPage:true});
    // Copy visual styles inline then remove all classes: behavior must survive renaming.
    await page.evaluate(() => {
      document.querySelectorAll('[class]').forEach(el => {
        const style = getComputedStyle(el);
        const values = [...style].map(key=>[key,style.getPropertyValue(key)]);
        values.forEach(([key,value])=>el.style.setProperty(key,value));
        el.removeAttribute('class');
      });
      document.querySelectorAll('[data-billing="dot"]').forEach(el=>el.style.removeProperty('transform'));
    });
    await toggles.nth(2).click();
    await checkCycle('quarterly');
    assert.equal(await page.locator('[data-billing="dot"]').first().evaluate(x=>getComputedStyle(x).transform),'matrix(1, 0, 0, 1, 18, 0)');
    assert.deepEqual(errors,[]);
    console.log('PASS: annual default; all-card sync; original dot travel; accessible hidden states; keyboard; rapid reversals; duplicate initialization; reload default; stable desktop/mobile heights; reduced motion; no class dependencies; no JS errors.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
