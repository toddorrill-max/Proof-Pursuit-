import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.argv[2]||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base='http://localhost:5173';
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'/dashboard.html');await page.locator('#results .finding').first().waitFor();
 const client=await page.context().newCDPSession(page);
 await client.send('Emulation.setCPUThrottlingRate',{rate:4});
 const change=()=>page.evaluate(async()=>{
  const input=document.querySelector('#query');input.focus();input.value=input.value?'':'reserve';input.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(resolve=>requestAnimationFrame(resolve));
  return {focus:document.activeElement.id,count:document.querySelectorAll('#results .finding').length,animations:document.getAnimations().map(a=>({duration:a.effect.getTiming().duration,iterations:a.effect.getTiming().iterations}))};
 });
 const active=await change();assert.equal(active.focus,'query');assert.equal(active.count,1);
 assert.ok(active.animations.length>0,'changed results receive feedback');
 assert.ok(active.animations.every(a=>a.duration<=180&&a.iterations===1),'motion is brief and nonlooping');
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await change();assert.equal(reduced.focus,'query');assert.equal(reduced.count,3);assert.equal(reduced.animations.length,0);
 await page.locator('#map-view').click();assert.equal(await page.locator('#map-panel').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#list-view').click();
 await page.waitForFunction(()=>document.getAnimations().length===0);
 assert.equal(await page.locator('#list-view').evaluate(el=>el===document.activeElement),true);
 // The packaged website loads all its local modules and data without development files.
 const packaged=await browser.newPage();const failures=[];
 packaged.on('pageerror',error=>failures.push(error.message));
 packaged.on('response',response=>{if(response.url().startsWith(base+'/dist/')&&response.status()>=400)failures.push(response.url());});
 await packaged.goto(base+'/dist/dashboard.html');await packaged.locator('#home-picks .finding').waitFor();
 await packaged.locator('#results h3 a').first().click();await packaged.locator('#page-content .finding').waitFor();
 assert.deepEqual(failures,[]);
 console.log('PASS: brief nonlooping feedback, immediate filters, focus preservation, reduced-motion cancellation, mobile switching at 4x CPU slowdown, packaged dashboard and detail page.');
}finally{await browser.close();}
