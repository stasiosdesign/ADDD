const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
let demo = fs.readFileSync(path.join(__dirname,'../v3/demo.html'),'utf8');
demo = demo.replace(/<style>[\s\S]*?<\/style>/, read('head.html'));
demo = demo.replace('<script src="bouncy-tabs.test.js"></script>','');
demo = demo.replace(/<script>\s*\(\(\) => \{[\s\S]*?<\/script>/,read('footer.html'));
demo = demo.replace('Same billing. New switch.','One package. Both controls.');
demo = demo.replace('The sliding pill follows your selection across every card. Bouncy Tabs below runs separately, using the supplied script unchanged.','Billing stays synchronized across every card. Tabs keep their original motion. One combined package coordinates both.');
// No conflict-avoidance markup is required in the combined package.
demo = demo.replaceAll('class="card" data-bouncy-tabs-item','class="card"');
demo = demo.replace('[data-bouncy-tabs-button][data-active]{color:#000}\n[data-bouncy-tabs-panel]:not([data-active]){opacity:0;visibility:hidden}\n.wf-design-mode [data-bouncy-tabs-panel][data-active]{position:relative}','');
fs.writeFileSync(path.join(__dirname,'demo.html'),demo);
