import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.argv[2]||'playwright');
const axePath=process.argv[3]||require.resolve('axe-core/axe.min.js');
const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{
 for(const width of [1440,390])for(const route of ['index.html','dashboard.html','retailers.html','retailer.html?id=demo-columbus','finding.html?id=sighting-0','store-picks.html','rare-releases.html','methodology.html','about.html','editorial.html']){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto('http://localhost:5173/'+route,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#page-content')?.getAttribute('aria-busy')==='false'||document.querySelector('#results .finding')||document.querySelector('#bottles tr'));
  await page.locator('.more-filters').evaluateAll(els=>els.forEach(el=>el.open=true));
  await page.addScriptTag({path:axePath});
  const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}));
  report.push({route,width,axeVersion:result.testEngine.version,violations:result.violations,incomplete:result.incomplete});
  console.log(route+' at '+width+': '+result.violations.length+' violations');await page.close();
 }
 await mkdir('test-results',{recursive:true});await writeFile('test-results/accessibility.json',JSON.stringify(report,null,2));
 assert.equal(report.reduce((n,r)=>n+r.violations.length,0),0,'Accessibility violations; inspect test-results/accessibility.json');
 console.log('PASS: 20 axe scans. Automated results do not replace assistive-technology review.');
}finally{await browser.close();}
