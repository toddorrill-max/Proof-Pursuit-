import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.argv[2]||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base='http://localhost:5173';
const errors=[],demo=JSON.parse(await readFile('data/demo.json'));
const loaded=page=>page.waitForFunction(()=>document.querySelector('#page-content')?.getAttribute('aria-busy')==='false'||document.querySelector('#results .finding'));
try{
 await mkdir('test-results',{recursive:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['geolocation'],geolocation:{latitude:39.9612,longitude:-82.9988}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-09-21T17:59:30Z')});
 await page.goto(base);await loaded(page);await page.locator('.hunt-marker').first().waitFor();
 await page.locator('#locate').click();await page.waitForFunction(()=>document.querySelector('#location-status').textContent.includes('Using browser location'));
 await page.locator('.more-filters').evaluate(el=>el.open=true);
 const filters=[['releaseType','rare-allocated',1],['bottleType','rye',1],['retailer','demo-dublin',1],['city','Columbus',1],['confidence','High',1],['availability','unknown',1],['quantity','5',1],['age','24',1],['distance','5',1]];
 for(const [name,value,count] of filters){await page.locator('[name="'+name+'"]').selectOption(value);assert.equal(await page.locator('#results .finding').count(),count,name);await page.locator('[name="'+name+'"]').selectOption('');}
 await page.locator('[name=excludeStale]').check();assert.equal(await page.locator('#results .finding').count(),2);await page.locator('[name=excludeStale]').uncheck();
 await page.locator('#results [data-select="sighting-0"]').click();
 await page.locator('#map').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
 await page.clock.runFor(500); // Let the deliberate keyboard pan finish before measuring.
 const viewport=await page.locator('.leaflet-map-pane').getAttribute('style');
 await page.locator('.hunt-marker').first().focus();
 await page.evaluate(()=>window.markerBefore=document.activeElement);
 await page.clock.fastForward(61000);
 assert.equal(await page.locator('#results [data-sighting="sighting-0"] .status-badge').innerText(),'Aging');
 assert.equal(await page.evaluate(()=>document.activeElement===window.markerBefore),true,'marker focus survives aging');
 assert.equal(await page.locator('.leaflet-map-pane').getAttribute('style'),viewport,'aging must not pan map');
 // Focused detail links must not freeze freshness at the 72-hour boundary.
 await page.clock.setSystemTime(new Date('2026-09-23T17:59:30Z'));
 await page.goto(base+'/finding.html?id=sighting-0');await loaded(page);
 await page.locator('.finding a').first().focus();const href=await page.evaluate(()=>document.activeElement.href);
 assert.equal(await page.locator('.status-badge').innerText(),'Aging');
 await page.clock.fastForward(61000);
 assert.equal(await page.locator('.status-badge').innerText(),'Stale');
 assert.equal(await page.evaluate(()=>document.activeElement.href),href);
 // Responsive layout, enlarged text and mobile map view.
 for(const route of ['index.html','retailers.html','retailer.html?id=demo-columbus','finding.html?id=sighting-0','store-picks.html','rare-releases.html','methodology.html','about.html']){
  await page.goto(base+'/'+route);await loaded(page);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+' enlarged at '+width);
  }
 }
 await page.setViewportSize({width:320,height:900});await page.goto(base);await loaded(page);await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 assert.equal(await page.locator('.skip').evaluate(el=>el.getBoundingClientRect().bottom<0),true,'skip link stays offscreen until focused');
 await page.locator('.skip').focus();assert.equal(await page.locator('.skip').evaluate(el=>el.getBoundingClientRect().top>=0),true,'skip link remains reachable');
 await page.locator('#map-view').click();assert.equal(await page.locator('#map-panel').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'enlarged mobile map');
 await page.screenshot({path:'test-results/phase4-mobile-enlarged.png',fullPage:true});
 await page.locator('#list-view').click();
 // Location timeout/unavailable and a late callback cannot override a manual location.
 for(const code of [2,3]){
  await page.evaluate(code=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_ok,fail)=>fail({code})}}),code);
  await page.locator('#locate').click();assert.match(await page.locator('#location-status').innerText(),code===3?/timed out/:/could not be determined/);
 }
 await page.evaluate(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>window.lateLocation=ok}}));
 await page.locator('#locate').click();await page.locator('#location-input').fill('Dublin');await page.getByRole('button',{name:'Set location',exact:true}).click();
 await page.evaluate(()=>window.lateLocation({coords:{latitude:0,longitude:0,accuracy:10}}));assert.match(await page.locator('#location-status').innerText(),/Dublin center/);
 // External map failures leave usable findings and an explicit fallback.
 const failed=await context.newPage();await failed.route('**/tile.openstreetmap.org/**',r=>r.abort());await failed.goto(base);await loaded(failed);
 await failed.waitForFunction(()=>document.querySelector('#map-status').textContent.includes('could not load'));
 assert.equal(await failed.locator('#results .finding').count(),3);await failed.close();
 // Production mode stays empty rather than silently substituting demo data.
 const production=await context.newPage(),config=await readFile('config.js','utf8');
 await production.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:config.replace("mode: 'demo'","mode: 'production'")}));
 await production.goto(base);await production.locator('#empty').waitFor();assert.equal(await production.locator('.finding').count(),0);assert.match(await production.locator('#demo-notice').innerText(),/not live inventory/);await production.close();
 // Data strings stay text; zero and unknown quantities remain distinct.
 const injected=structuredClone(demo);injected.sightings[0].notes='<img src=x onerror="window.injected=true">';injected.sightings[0].estimatedQuantity=0;
 await page.route('**/data/demo.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(injected)}));
 await page.goto(base);await loaded(page);assert.equal(await page.locator('#results img').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);
 assert.match(await page.locator('#results [data-sighting="sighting-0"]').innerText(),/Estimated quantity: 0/);
 assert.match(await page.locator('#results [data-sighting="sighting-1"]').innerText(),/Quantity unknown/);
 await page.unroute('**/data/demo.json');
 // Use an unmocked clock for a local performance sample.
 const measured=await browser.newPage({viewport:{width:1440,height:1000}});
 await measured.goto(base);await loaded(measured);await measured.locator('.hunt-marker').first().waitFor();
 await measured.screenshot({path:'test-results/phase4-desktop.png',fullPage:true});
 const performance=await measured.evaluate(()=>({domContentLoadedMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),localResources:performance.getEntriesByType('resource').filter(e=>e.name.startsWith(location.origin)).map(e=>({name:new URL(e.name).pathname,decodedBytes:e.decodedBodySize})),decorativeImages:document.querySelectorAll('main img:not(.leaflet-tile)').length}));
 await writeFile('test-results/phase4-performance.json',JSON.stringify(performance,null,2));
 assert.equal(performance.decorativeImages,0);assert.deepEqual(errors,[]);
 console.log('PASS: all filter controls, granted location, timeout/unavailable/late location, focused freshness boundaries, stable marker focus/map viewport, 200% text at four widths, mobile map, tile failure, empty production, safe text and quantity semantics.');
 console.log(JSON.stringify(performance));
}finally{await browser.close();}
