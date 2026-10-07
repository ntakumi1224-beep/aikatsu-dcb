const {chromium}=require(process.env.PLAYWRIGHT_PATH),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173/?preview=login#binder');await page.evaluate(()=>window.DCBReady);await page.locator('.opening').waitFor({state:'detached'});
 assert.equal(await page.locator('#results .card').count(),24);assert.equal(await page.locator('.register-entry').count(),0);
 assert.equal(await page.locator('.page-header [data-go="#register"]').count(),1);
 assert.deepEqual(await page.locator('[data-filter=status] option').allTextContents(),['すべて','所持のみ','未所持のみ']);
 await page.locator('#search').fill('DEMO-001');assert.equal(await page.locator('#results .card').count(),1);await page.getByRole('button',{name:'条件をクリア'}).click();
 await page.locator('[data-filter=status]').selectOption('owned');const owned=await page.locator('#results .card').count();
 await page.getByRole('tab',{name:'コレクション / コーデ'}).click();assert.equal(await page.locator('.coord').count(),7);
 await page.getByRole('button',{name:'クール',exact:true}).click();assert.equal(await page.locator('.coord').count(),2);await page.getByRole('button',{name:'クール',exact:true}).click();
 await page.evaluate(()=>{for(const c of DCBData.cards)DCBStore.update(c,{ownedCount:0});for(const id of DCBData.coordinates[0].cardIds)DCBStore.update(DCBData.cards.find(c=>c.id===id),{ownedCount:1});});
 await page.locator('[data-coordinate-status]').selectOption('complete');assert.equal(await page.locator('.coord').count(),1);
 await page.locator('[data-coordinate-status]').selectOption('incomplete');assert.equal(await page.locator('.coord').count(),6);
 await page.getByRole('tab',{name:'バインダーモード'}).click();assert.equal(await page.locator('.album-card').count(),4);assert.equal(await page.locator('.album-blank').count(),0);
 await page.locator('[data-binder-sort=album]').selectOption('number');assert.equal(await page.locator('.album-blank').count(),20);assert.equal(await page.locator('.album-grid').innerText(),'');
 await page.locator('[data-album-gaps]').selectOption('pack');assert.equal(await page.locator('.album-blank').count(),0);
 await page.locator('[data-binder-sort=album]').selectOption('coordinate');await page.locator('[data-album-gaps]').selectOption('keep');assert.equal(await page.locator('.album-blank').count(),20);
 // Stored photos replace only their own pocket, and remain available after sorting.
 await page.evaluate(async()=>{const blob=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect width="100" height="140" fill="pink"/></svg>'],{type:'image/svg+xml'});await DCBPhotos.write({cardId:'bloom-0',blob,capturedAt:Date.now()});});
 await page.locator('[data-binder-sort=album]').selectOption('number');await page.locator('[data-photo-card="bloom-0"] img').waitFor();assert(await page.locator('[data-photo-card="bloom-0"] img').evaluate(img=>img.src.startsWith('blob:')));
 await page.screenshot({path:'preview-binder-album.png',fullPage:true});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});for(const mode of ['cards','coordinates','album']){await page.locator('[data-mode='+mode+']').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width+' '+mode);}}
 await page.setViewportSize({width:390,height:844});await page.locator('[data-mode=cards]').click();await page.screenshot({path:'preview-binder-cards.png',fullPage:true});await page.locator('[data-mode=coordinates]').click();await page.getByRole('button',{name:'条件をクリア'}).click();await page.screenshot({path:'preview-binder-coordinates.png',fullPage:true});
 await page.locator('[data-mode=album]').click();await page.locator('.album-card').first().click();await page.locator('.detail').waitFor();await page.locator('.page-header [data-go="#register"]').count();
 await page.goto('http://localhost:4173/?preview=login#binder');await page.evaluate(()=>window.DCBReady);await page.locator('.opening').waitFor({state:'detached'});await page.evaluate(()=>DCBStore.update(DCBData.cards[0],{ownedCount:2,tradeCount:1}));await page.locator('nav [data-go="#home"]').click();await page.locator('[data-action=trade-cards]').click();await page.locator('.trade-page[data-trade-view="offers"]').waitFor();assert.equal(await page.locator('.trade-grid .trade-card').count(),1);await page.locator('nav [data-go="#binder"]').click();await page.locator('.binder-register').click();await page.locator('.registration-view').waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: three modes, ownership filters, type tabs, photos, gaps, 12 responsive views, detail and registration links; initial owned '+owned);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

