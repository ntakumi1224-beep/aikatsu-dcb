const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const path=require('node:path'),assert=require('node:assert/strict');
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext(); const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='file:///'+path.resolve('index.html').replaceAll('\\','/');
 for(const [width,height] of [[390,844],[320,568],[1440,1000]]){
  await page.setViewportSize({width,height});await page.goto('about:blank');await page.evaluate(()=>window.DCBReady);await page.goto(url+'#home');await page.evaluate(()=>window.DCBReady);
  const stage=page.locator('.opening-screen');await stage.waitFor();
  const box=await stage.boundingBox();assert.equal(box.width,width>700?390:width);assert.equal(box.height,width>700?844:height);
  assert.equal(await page.locator('.opening-aikatsu').textContent(),'Aikatsu!');
  await page.waitForTimeout(500);const value=Number(await page.locator('.opening-track').getAttribute('aria-valuenow'));assert(value>0&&value<100);
  if(width===390||width===1440)await page.screenshot({path:width===390?'preview-opening-mobile.png':'preview-opening-desktop.png'});
  await page.locator('.opening').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>location.hash),'#login');await page.locator('#login-form').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.locator('.opening').waitFor({state:'detached'});await page.getByRole('textbox',{name:'メールアドレスまたはコレクターID'}).fill('demo-collector');await page.locator('[name="password"]').fill('demo-only');await page.getByRole('button',{name:'ログイン',exact:true}).click();await page.locator('.home-view').waitFor();
 await page.goto(url+'#card/bloom-0');await page.evaluate(()=>window.DCBReady);await page.locator('.opening').waitFor({state:'detached'});await page.locator('#memo').waitFor();
 const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});const reducedPage=await reduced.newPage();await reducedPage.goto(url);await reducedPage.locator('#login-form').waitFor();await reducedPage.locator('.opening').waitFor({state:'detached'});assert.equal(await reducedPage.locator('.opening').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: opening composition at 3 sizes, progress, login fade, demo entry, deep-link reload, reduced motion, no page errors');await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});



