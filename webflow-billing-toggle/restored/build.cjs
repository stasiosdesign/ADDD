const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const original = fs.readFileSync('C:/Users/Anast/.codex/attachments/1b3923ae-92ea-4700-a2cc-35a619478a6a/pasted-text.txt','utf8').replace(/\r\n/g,'\n');
const tabs = original.slice(0, original.indexOf('// Initialize Bouncy Content Tabs')).trimEnd();
const billingSource = read('../v3/footer.html');
const billing = billingSource.slice(billingSource.indexOf('  function initBilling() {'),billingSource.indexOf('\n\n  if (document.readyState')).trimEnd();
const tabCSS = `[data-bouncy-tabs-button][data-active] {
  color: #000000;
}

[data-bouncy-tabs-panel]:not([data-active]) {
  opacity: 0;
  visibility: hidden;
}

.wf-design-mode [data-bouncy-tabs-panel][data-active] {
  position: relative;
}`;
fs.writeFileSync(path.join(__dirname,'head.html'),read('../v3/head.html').replace('</style>',`/* Original Bouncy Tabs CSS — unchanged. */\n${tabCSS}\n</style>`));
fs.writeFileSync(path.join(__dirname,'footer.html'),`<script>
(() => {
${billing}

${tabs}

  function start() {
    const root = document.documentElement;
    if (root.hasAttribute('data-billing-tabs-ready')) return;
    root.setAttribute('data-billing-tabs-ready', '');
    initBilling();
    initBouncyContentTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
</script>
`);
// Each local fixture uses the exact same Webflow-like styling and markup.
const fixture = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original tabs preservation</title>
<style>
*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;background:#f4f1eb;color:#273a2d}main{max-width:1000px;margin:auto}.nav{position:relative;display:flex;gap:8px;width:fit-content;padding:8px;background:#dce4d8;border-radius:14px}.nav button{position:relative;z-index:2;background:transparent;border:0;padding:16px;font:inherit}.indicator,.ghost{position:absolute;left:0;top:0;border-radius:8px;pointer-events:none}.indicator{background:#fff}.ghost{background:#fff7}.card{transform:translateX(12px)}.panels{position:relative;margin-top:24px}.panel{position:absolute;top:6px;left:12px;width:calc(100% - 24px)}.content{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px;background:#fff;border-radius:14px}.visual{background:#d0ddc6;height:140px;border-radius:8px}.plans{display:flex;gap:20px;margin-top:26px}.plan{padding:20px;background:#fff;border-radius:14px;flex:1}.price{font-size:32px;margin-bottom:8px}.toggle-switch__btn{padding:12px}.toggle-switch{max-width:280px}
</style><!--PACKAGE_CSS--></head><body><main>
<h1>Original tabs, preserved.</h1>
<div data-bouncy-tabs-init>
 <div class="nav" data-bouncy-tabs-nav>
  <div class="indicator" data-bouncy-tabs-indicator></div><div class="ghost" data-bouncy-tabs-ghost></div>
  <button data-bouncy-tabs-button data-active>First</button><button data-bouncy-tabs-button>Second</button>
 </div>
 <div class="card" data-bouncy-tabs-card><div class="panels" data-bouncy-tabs-panels>
  <section class="panel" data-bouncy-tabs-panel data-active><div class="content"><div class="bouncy-tabs__item-text"><h2>First heading</h2><p>First paragraph.</p><p>Second paragraph.</p></div><div class="visual bouncy-tabs__item-visual"></div></div></section>
  <section class="panel" data-bouncy-tabs-panel><div class="content"><div class="bouncy-tabs__item-text"><h2>Second heading</h2><p>A paragraph with more detail.</p><p>Another paragraph.</p><p>Additional information makes this panel taller.</p></div><div class="visual bouncy-tabs__item-visual"></div></div></section>
 </div></div>
</div>
<div class="plans">${[80,160,320].map(price=>`<article class="plan">${read('../v3/toggle.html')}<div data-billing="prices"><div data-billing="annual"><p class="price">£${price}</p><p>per month, billed annually</p></div><div data-billing="quarterly"><p class="price">£${price*1.25}</p><p>per month, billed quarterly</p></div></div></article>`).join('')}</div>
</main><script src="../v3/gsap.test.min.js"></script><!--PACKAGE_JS--></body></html>`;
fs.writeFileSync(path.join(__dirname,'baseline.test.html'),fixture.replace('<!--PACKAGE_CSS-->',read('../v3/head.html')+`<style>${tabCSS}</style>`).replace('<!--PACKAGE_JS-->',`<script>${original}</script>`));
fs.writeFileSync(path.join(__dirname,'demo.html'),fixture.replace('<!--PACKAGE_CSS-->',read('head.html')).replace('<!--PACKAGE_JS-->',read('footer.html')));
fs.writeFileSync(path.join(__dirname,'previous.test.html'),fixture.replace('<!--PACKAGE_CSS-->',read('../combined/head.html')).replace('<!--PACKAGE_JS-->',read('../combined/footer.html')));
