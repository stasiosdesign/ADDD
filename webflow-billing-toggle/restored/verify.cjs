const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Anast/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const original=fs.readFileSync('C:/Users/Anast/.codex/attachments/1b3923ae-92ea-4700-a2cc-35a619478a6a/pasted-text.txt','utf8').replace(/\r\n/g,'\n');
const fn=original.slice(0,original.indexOf('// Initialize Bouncy Content Tabs')).trimEnd();
const merged=fs.readFileSync(path.join(__dirname,'footer.html'),'utf8');
assert(merged.includes(fn),'Original Bouncy Tabs function must be copied verbatim');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const errors=[];
  const pages=[];
  for(const file of ['baseline.test.html','demo.html','previous.test.html']){
   const p=await browser.newPage({viewport:{width:1200,height:900}});p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
   await p.goto(pathToFileURL(path.join(__dirname,file)).href);await p.waitForTimeout(100);pages.push(p);
  }
  const [baseline,fixed,previous]=pages;
  const snapshot=p=>p.evaluate(()=>({
   panels:[...document.querySelectorAll('[data-bouncy-tabs-panel]')].map(x=>({position:getComputedStyle(x).position,left:getComputedStyle(x).left,top:getComputedStyle(x).top,width:getComputedStyle(x).width,opacity:getComputedStyle(x).opacity,visibility:getComputedStyle(x).visibility,active:x.hasAttribute('data-active')})),
   buttons:[...document.querySelectorAll('[data-bouncy-tabs-button]')].map(x=>({active:x.hasAttribute('data-active'),selected:x.getAttribute('aria-selected'),tab:x.tabIndex})),
   cardTransform:document.querySelector('[data-bouncy-tabs-card]').style.transform,
   height:document.querySelector('[data-bouncy-tabs-panels]').style.height,
   indicator:document.querySelector('[data-bouncy-tabs-indicator]').style.cssText
  }));
  assert.deepEqual(await snapshot(fixed),await snapshot(baseline));
  assert.notDeepEqual((await snapshot(previous)).panels,(await snapshot(baseline)).panels,'Regression fixture must detect previous forced positioning');
  // Capture GSAP targets before playback: original text children and visual must match.
  async function targets(p){return p.evaluate(()=>{
   document.querySelectorAll('[data-bouncy-tabs-button]')[1].click();
   gsap.globalTimeline.pause();
   return gsap.globalTimeline.getChildren(true,true,false).filter(t=>t.vars.stagger!=null).map(t=>({
    duration:t.vars.duration,stagger:t.vars.stagger,y:t.vars.y,
    targets:t.targets().map(x=>x.tagName+':'+x.textContent.trim())
   }));
  });}
  assert.deepEqual(await targets(fixed),await targets(baseline));
  for(const p of [baseline,fixed])await p.evaluate(()=>{gsap.globalTimeline.resume();});
  await fixed.waitForTimeout(1200);assert.deepEqual(await snapshot(fixed),await snapshot(baseline));
  for(const p of [baseline,fixed]){
   await p.locator('[data-bouncy-tabs-button]').nth(1).focus();await p.keyboard.press('Home');
  }
  await fixed.waitForTimeout(1200);assert.deepEqual(await snapshot(fixed),await snapshot(baseline));
  for(const p of [baseline,fixed])await p.setViewportSize({width:700,height:900});
  await fixed.waitForTimeout(150);assert.deepEqual(await snapshot(fixed),await snapshot(baseline));
  const before=await snapshot(fixed);
  await fixed.locator('[data-toggle-btn="quarterly"]').first().click();
  assert.equal(await fixed.locator('[data-toggle-btn="quarterly"][data-toggle-active]').count(),3);
  assert.deepEqual(await snapshot(fixed),before,'Billing click must not modify tab state, layout or indicator');
  await fixed.locator('[data-toggle-btn="quarterly"]').last().focus();await fixed.keyboard.press('ArrowLeft');
  assert.equal(await fixed.locator('[data-toggle-btn="annual"][data-toggle-active]').count(),3);
  await fixed.addScriptTag({content:merged.replace(/<\/?script>/g,'')});assert.equal(await fixed.locator('[role="status"]').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: original Bouncy Tabs function preserved verbatim; original CSS restored; previous layout regression reproduced; original vs restored layout/state/stagger targets match before and after tab switching, keyboard and resize; billing sync does not alter tabs; no JS errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
