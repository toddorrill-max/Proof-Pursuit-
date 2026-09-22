import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.argv[2]||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base='http://localhost:5173';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-09-21T17:59:30Z')});
 await page.goto(base+'/dashboard.html');await page.locator('#home-picks .finding').waitFor();
 assert.equal(await page.locator('#home-rare .finding').count(),1);
 assert.equal(await page.locator('#home-retailers .area-link').count(),3);
 for(const id of ['home-picks','home-rare']){
  const text=await page.locator('#'+id).innerText();
  for(const required of ['FICTIONAL DEMO','Demo verification timestamp','Distance','Confidence','Estimated quantity','Purchase conditions','call before traveling'])assert.ok(text.includes(required),id+': '+required);
 }
 await page.locator('#home-picks h3 a').focus();const href=await page.evaluate(()=>document.activeElement.href);
 await page.clock.fastForward(61000);
 assert.equal(await page.locator('#home-picks .status-badge').innerText(),'Aging');
 assert.equal(await page.evaluate(()=>document.activeElement.href),href,'featured link focus survives freshness update');
 await page.locator('#query').fill('nothing matches');assert.equal(await page.locator('.home-findings .finding').count(),0);
 await page.locator('#query').fill('reserve');assert.equal(await page.locator('#home-rare .finding').count(),1);assert.equal(await page.locator('#home-picks .finding').count(),0);
 await page.locator('#query').fill('');
 await page.locator('.near-me').click();assert.equal(new URL(page.url()).hash,'#location-heading');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/visual-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/visual-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.finding').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.route('**/data/demo.json',r=>r.abort());await page.reload();await page.locator('#data-error').waitFor();
 assert.equal(await page.locator('.home-findings .finding').count(),0);
 assert.match(await page.locator('#home-retailers').innerText(),/Data unavailable/);
 assert.deepEqual(errors,[]);
 console.log('PASS: homepage collections, required trust fields, filter synchronization, freshness/focus, directory, near-me action, reduced motion and error clearing.');
}finally{await browser.close();}
