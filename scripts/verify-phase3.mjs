import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.argv[2]||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const base='http://localhost:5173',errors=[];
const routes=['retailers.html','retailer.html?id=demo-columbus','finding.html?id=sighting-0','store-picks.html','rare-releases.html','methodology.html','about.html'];
try{
 await mkdir('test-results',{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 const hrefs=new Set();
 for(const route of routes){
  await page.goto(`${base}/${route}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#page-content').getAttribute('aria-busy')==='false');
  assert.ok((await page.locator('h1').innerText()).length>0);
  assert.match(await page.locator('#page-notice').innerText(),/DEMO ONLY/);
  assert.match(await page.locator('footer').innerText(),/21\+/);
  assert.match(await page.locator('footer').innerText(),/State of Ohio, retailers or distilleries/);
  const links=await page.locator('a[href]').evaluateAll(els=>els.map(el=>el.href));for(const href of links)if(href.startsWith(base))hrefs.add(href);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route}: overflow at ${width}`);}
  await page.setViewportSize({width:1440,height:1000});
 }
 for(const href of hrefs){const response=await page.request.get(href);assert.equal(response.status(),200,`Broken internal link: ${href}`);}
 await page.goto(`${base}/retailers.html`);assert.equal(await page.locator('.retailer-card').count(),3);
 await page.getByRole('link',{name:'Demo Columbus Retailer',exact:true}).click();await page.waitForURL('**/retailer.html?id=demo-columbus');
 await page.locator('#community').selectOption('Columbus');assert.match(await page.locator('.retailer-card').innerText(),/0.0 miles/);
 assert.match(await page.locator('.retailer-card').innerText(),/Hours unknown/);
 await page.getByRole('link',{name:'Demo Columbus Barrel Selection',exact:true}).click();await page.waitForURL('**/finding.html?id=sighting-0');
 await page.waitForFunction(()=>document.querySelector('#page-content').getAttribute('aria-busy')==='false');
 for(const expected of ['Demo verification timestamp','Confidence','Estimated quantity','Purchase conditions','Proof unknown','750 mL','No source URL supplied'])assert.ok((await page.locator('#page-content').innerText()).includes(expected));
 await page.locator('#community').selectOption('Dublin');assert.match(await page.locator('.finding .facts').innerText(),/miles/);
 await page.screenshot({path:'test-results/phase3-finding-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/phase3-finding-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto(`${base}/store-picks.html`);await page.locator('.finding').waitFor();assert.equal(await page.locator('.finding').count(),1);assert.match(await page.locator('.finding').innerText(),/STORE PICK|Store pick/);
 await page.goto(`${base}/rare-releases.html`);await page.locator('.finding').waitFor();assert.equal(await page.locator('.finding').count(),1);assert.match(await page.locator('.finding').innerText(),/Demo Reserve/);
 for(const path of ['finding.html?id=missing','finding.html','retailer.html?id=missing']){await page.goto(`${base}/${path}`);await page.locator('.empty').waitFor();assert.match(await page.locator('h1').innerText(),/not found/);}
 const demo=JSON.parse(await readFile('data/demo.json'));
 const expired=structuredClone(demo);expired.sightings[0].status='expired';
 await page.route('**/data/demo.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(expired)}));
 await page.goto(`${base}/finding.html?id=sighting-0`);await page.locator('.finding').waitFor();assert.match(await page.locator('.finding').innerText(),/EXPIRED RECORD/);
 await page.goto(`${base}/store-picks.html`);await page.locator('.empty').waitFor();
 await page.unroute('**/data/demo.json');
 const attributed=structuredClone(demo);attributed.sources[0].url='https://example.org/retailer-release';attributed.retailers[0].hours='Monday–Friday 10am–6pm (demo only)';attributed.retailers[0].phone='+1 614 555 0100';attributed.bottles[0].proof=100;
 await page.route('**/data/demo.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(attributed)}));
 await page.goto(`${base}/finding.html?id=sighting-0`);await page.locator('.finding').waitFor();assert.equal(await page.getByRole('link',{name:'Read the attributed source'}).getAttribute('href'),'https://example.org/retailer-release');
 assert.equal(await page.getByRole('link',{name:'Call +1 614 555 0100'}).getAttribute('href'),'tel:+16145550100');
 await page.unroute('**/data/demo.json');
 await page.route('**/data/demo.json',route=>route.fulfill({status:503,body:'Unavailable'}));await page.goto(`${base}/retailers.html`);await page.locator('#page-error').waitFor();
 await page.unroute('**/data/demo.json');await page.locator('#retry-page').click();await page.locator('.retailer-card').first().waitFor();
 // The methodology remains available even when finding data cannot load.
 await page.route('**/data/demo.json',route=>route.abort());await page.goto(`${base}/methodology.html`);await page.getByRole('heading',{name:'What source labels mean'}).waitFor();
 await page.unroute('**/data/demo.json');
 await page.goto(base+'/dashboard.html');await page.locator('#results .finding').first().waitFor();await page.locator('#results .finding h3 a').first().focus();await page.keyboard.press('Enter');await page.waitForURL('**/finding.html?id=sighting-0');
 assert.deepEqual(errors,[]);console.log(`PASS: seven pages, ${hrefs.size} internal links, directory/detail navigation, trust fields, location distances, release collections, expired/missing records, source/phone links, error/retry, offline methodology, keyboard navigation, four widths and 200% text.`);
}finally{await browser.close();}
