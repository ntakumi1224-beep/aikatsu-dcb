const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.goto('http://localhost:4174/app/#binder');await p.evaluate(()=>DCBReady);await p.locator('.opening').waitFor({state:'detached'});
 for(const width of [320,340,346,347,350,370,375,390,768,1440])for(const theme of ['white','dark'])for(const merge of [false,true]){
  await p.setViewportSize({width,height:844});await p.evaluate(t=>DCBDisplay.set('theme',t),theme);await p.locator('[data-merge-names]').setChecked(merge);
  const row=await p.locator('.binder-count').evaluate(el=>{
   const bounds=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,cy:r.y+r.height/2};};
   const es=[el.querySelector('#result-count'),el.querySelector('.binder-merge-toggle'),el.querySelector('[data-action=clear]'),...el.querySelectorAll('[data-card-view]')];
   const texts=[es[0],el.querySelector('.binder-merge-toggle span'),es[2]];
   return {rects:es.map(bounds),text:texts.map(e=>({font:parseFloat(getComputedStyle(e).fontSize),nowrap:getComputedStyle(e).whiteSpace,clipped:e.scrollWidth>e.clientWidth+1})),overflow:document.documentElement.scrollWidth>innerWidth};
  });assert(!row.overflow,width+' '+merge);assert(row.text.every(t=>t.font>=10&&t.nowrap==='nowrap'&&!t.clipped));assert(row.rects.every(r=>Math.abs(r.cy-row.rects[0].cy)<=1&&r.x>=-1&&r.right<=width+1));assert(row.rects.slice(1).every(r=>r.height>=44&&r.width>=44));for(let i=1;i<row.rects.length;i++)assert(row.rects[i-1].right<=row.rects[i].x+1,'overlapping targets '+width);
 }
 await p.evaluate(()=>DCBDisplay.set('theme','white'));await p.setViewportSize({width:320,height:568});await p.screenshot({path:'binder-operation-row-320.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'binder-operation-row-390.png'});
 await p.getByRole('button',{name:'リスト表示',exact:true}).click();assert.equal(await p.locator('.binder-row').count(),124);await p.getByRole('button',{name:'条件をクリア',exact:true}).click();assert(await p.getByRole('checkbox',{name:'同名カードを統合',exact:true}).isChecked());console.log('PASS: one-line operation row at 10 widths, merge ON/OFF, white/dark, unwrapped/unclipped text >=10px, 44px targets, no overlap or horizontal scrolling, existing actions.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
