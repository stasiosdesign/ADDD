const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const tiers = [['Essential', '80', '100'], ['Growth', '160', '200'], ['Scale', '320', '400']];
const cards = tiers.map(([name, annual, quarterly], index) => `<article class="card">
  <span class="tier">0${index + 1} / ${name}</span>
  <h2>${name}</h2>
  ${read('structure.html').replace('£80', `£${annual}`).replace('£100', `£${quarterly}`)}
  <p class="description">A considered plan for your next stage.</p>
</article>`).join('\n');
fs.writeFileSync(path.join(__dirname, 'demo.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page-wide billing toggle</title>
${read('head.html')}
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f1eb;color:#262d29;font-family:Arial,sans-serif;padding:72px 28px}
main{max-width:1120px;margin:auto}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#627266}
h1{font-size:clamp(36px,5vw,60px);line-height:1.05;letter-spacing:-.045em;margin:22px 0}
.intro{font-size:17px;line-height:1.6;max-width:580px;color:#606760;margin-bottom:40px}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.card{border:1px solid #d9ddd5;border-radius:18px;background:#fffcf7;padding:30px}
.tier{font-size:11px;letter-spacing:.09em;color:#69776b}h2{font-size:25px;letter-spacing:-.04em;margin:28px 0 20px}
.billing-control{display:flex;align-items:center;gap:12px;margin-bottom:28px;font-size:14px}.billing-control p{margin:0}
.btn-toggle__toggle{background:#385b45}.price{font-size:52px;letter-spacing:-.05em;margin:0 0 8px;font-variant-numeric:tabular-nums}
.billing-caption{font-size:14px;line-height:1.5;margin:0;color:#58645a}.description{border-top:1px solid #e0e3dc;margin:28px 0 0;padding-top:22px;font-size:14px;line-height:1.5;color:#687268}
.note{font-size:13px;color:#687268;margin-top:24px;line-height:1.6}
@media(max-width:800px){.cards{grid-template-columns:1fr}body{padding:40px 20px}.card{padding:26px}}
</style></head><body><main>
<p class="eyebrow">Billing switch / interactive preview</p>
<h1>One switch. Every plan.</h1>
<p class="intro">Choose a billing period in any card. All three stay in sync, with a gentle fade and a steady layout.</p>
<div class="cards">${cards}</div>
<p class="note">Illustrative prices only. Both options show a monthly equivalent. Try Tab, then Space to switch with your keyboard.</p>
</main>${read('footer.html')}</body></html>`);
