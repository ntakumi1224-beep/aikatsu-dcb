const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4174/app/#binder');await page.evaluate(()=>DCBReady);await page.locator('.opening').waitFor({state:'detached'});
 const entry=id=>page.locator('[data-go="#card/'+id+'"]');
 assert.equal(await page.locator('.binder-card .card-name').count(),139);
 assert.equal(await entry('DCB-0001').locator('.card-name').textContent(),'オーロラキスキャミソール');
 assert.equal(await entry('DCB-0001').locator('.card-number').textContent(),'E1-01　通常版');
 assert.equal(await entry('DCB-0134').locator('.card-number').textContent(),'E1-01　パラレル');
 assert.equal(await entry('DCB-0002').locator('.card-number').textContent(),'E1-02');
 assert(!await page.locator('#results').innerText().then(t=>/DCB-\d+/.test(t)));
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  const grid=await page.locator('.binder-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);assert.equal(grid,3);
  const label=await entry('DCB-0001').locator('.card-name').evaluate(el=>{const s=getComputedStyle(el);return {whiteSpace:s.whiteSpace,overflow:s.overflow,textOverflow:s.textOverflow,size:parseFloat(s.fontSize),height:el.getBoundingClientRect().height,line:parseFloat(s.lineHeight),clipped:el.scrollWidth>el.clientWidth};});
  assert.equal(label.whiteSpace,'nowrap');assert.equal(label.overflow,'hidden');assert.equal(label.textOverflow,'ellipsis');assert(label.size>=11);assert(label.height<=label.line+1);assert(label.clipped);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'binder-name-grid.png'});
 await page.getByRole('button',{name:'リスト表示',exact:true}).click();
 assert.equal(await entry('DCB-0001').locator('.card-number').textContent(),'E1-01　PR　通常版　2026.10.08');
 assert.equal(await entry('DCB-0002').locator('.card-number').textContent(),'E1-02　PR　2026.10.08');
 assert.match(await entry('DCB-0116').locator('.card-number').textContent(),/ロケテ版・MAY/);
 assert.match(await entry('DCB-0125').locator('.card-number').textContent(),/ロケテ版・AUG/);
 assert.match(await entry('DCB-0141').locator('.card-number').textContent(),/2026-10上旬/);assert(!await entry('DCB-0141').locator('.card-number').textContent().then(t=>t.includes('該当なし')));
 const rows=await page.locator('.binder-row').evaluateAll(es=>es.map(el=>({nameY:el.querySelector('.card-name').getBoundingClientRect().top,numberY:el.querySelector('.card-number').getBoundingClientRect().top,height:el.getBoundingClientRect().height})));assert(rows.every(r=>r.nameY<r.numberY&&r.height<=55));
 // Missing and unpublished dates are exercised only in memory; the Master stays intact.
 await page.evaluate(()=>{DCBData.cards[0].startDate='';DCBData.cards[1].startDate='未公表';location.hash='#home';});
 await page.waitForTimeout(60);await page.evaluate(()=>location.hash='#binder');await page.waitForTimeout(60);
 assert.equal(await entry('DCB-0001').locator('.card-number').textContent(),'E1-01　PR　通常版');assert.equal(await entry('DCB-0002').locator('.card-number').textContent(),'E1-02　PR　未公表');
 await page.reload();await page.evaluate(()=>DCBReady);await page.locator('.opening').waitFor({state:'detached'});assert.equal(await page.locator('.binder-row').count(),139);
 await page.screenshot({path:'binder-name-list.png'});
 await page.getByRole('tab',{name:'コレクション / コーデ'}).click();assert.equal(await page.locator('.coord').count(),23);
 const sizes=await page.evaluate(()=>DCBData.coordinates.map(c=>c.cardIds.length));assert(sizes.includes(2)&&sizes.includes(3)&&sizes.includes(4)&&sizes.includes(6)&&sizes.includes(9));
 assert.equal(await page.locator('.coord').filter({hasText:'オーロラキスコーデ'}).count(),1);
 await page.screenshot({path:'binder-master-coordinates.png'});assert.deepEqual(errors,[]);
 console.log('PASS: name-first grid/list, 3 columns at 320/390px, single-line ellipsis, compact list, source dates/unknown dates, normal/parallel and MAY/AUG distinction, hidden IDs, persisted view, 23 variable-size Master coordinates.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
