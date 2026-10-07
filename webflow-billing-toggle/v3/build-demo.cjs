const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const cards = [['Essential',80,100],['Growth',160,200],['Scale',320,400]].map(([name,a,q])=>`
<article class="card" data-bouncy-tabs-item>
<h2>${name}</h2>${read('toggle.html')}
<div data-billing="prices">
  <div data-billing="annual"><p class="price">£${a}</p><p>per month, billed annually</p></div>
  <div data-billing="quarterly"><p class="price">£${q}</p><p>per month, billed quarterly</p></div>
</div></article>`);
fs.writeFileSync(path.join(__dirname,'demo.html'),`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Billing Switch + Bouncy Tabs</title>
${read('head.html')}
<style>
*{box-sizing:border-box}body{margin:0;padding:48px 24px;font-family:Arial,sans-serif;background:#f4f1eb;color:#283b30}main{max-width:1120px;margin:auto}h1{font-size:44px;letter-spacing:-.04em}h2{font-size:24px}.intro{line-height:1.6;color:#647269;max-width:640px;margin-bottom:32px}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{background:#fffdf8;border:1px solid #d7ded8;border-radius:18px;padding:28px}.price{font-size:48px;letter-spacing:-.045em;margin:28px 0 8px}.card p:not(.price){font-size:14px;line-height:1.5;margin-top:0}.toggle-switch{background:#e3e9e2}.toggle-switch__bg{background:white}.toggle-switch__btn{padding:14px 12px}.tabs-nav{position:relative;display:flex;gap:4px;width:fit-content;padding:4px;background:#e2e6de;border-radius:12px;margin:36px 0 16px}.tabs-nav button{position:relative;z-index:2;border:0;background:transparent;padding:14px;font:inherit;cursor:pointer}.indicator,.ghost{position:absolute;top:0;left:0;border-radius:8px;pointer-events:none}.indicator{background:#fff}.ghost{background:#fff8}.panels{position:relative}.panel{position:absolute;top:0;left:0;width:100%}.notice{background:#e4eadf;padding:30px;border-radius:16px;line-height:1.5}
[data-bouncy-tabs-button][data-active]{color:#000}
[data-bouncy-tabs-panel]:not([data-active]){opacity:0;visibility:hidden}
.wf-design-mode [data-bouncy-tabs-panel][data-active]{position:relative}
@media(max-width:800px){.cards{grid-template-columns:1fr}body{padding:28px 16px}h1{font-size:36px}}
</style>
<script src="gsap.test.min.js"></script>
<script src="bouncy-tabs.test.js"></script>
</head><body><main>
<h1>Same billing. New switch.</h1>
<p class="intro">The sliding pill follows your selection across every card. Bouncy Tabs below runs separately, using the supplied script unchanged.</p>
<div data-bouncy-tabs-init>
<div class="tabs-nav" data-bouncy-tabs-nav role="tablist" aria-label="Preview sections">
<div class="indicator" data-bouncy-tabs-indicator></div><div class="ghost" data-bouncy-tabs-ghost></div>
<button type="button" data-bouncy-tabs-button data-active role="tab">Pricing</button>
<button type="button" data-bouncy-tabs-button role="tab">Details</button>
</div>
<div data-bouncy-tabs-card><div class="panels" data-bouncy-tabs-panels>
<div class="panel" data-bouncy-tabs-panel data-active role="tabpanel"><div class="cards">${cards.join('')}</div></div>
<div class="panel" data-bouncy-tabs-panel role="tabpanel"><div class="notice" data-bouncy-tabs-item>Switch back to Pricing: your billing choice is retained across all three cards.</div></div>
</div></div></div>
</main>${read('footer.html')}</body></html>`);
