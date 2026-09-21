// Run with an installed Playwright module path as the first argument.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.argv[2] || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:5173', {waitUntil:'domcontentloaded'});
  await page.locator('#bottles tr').first().waitFor();
  assert.equal(await page.locator('#bottles tr').count(),8);
  await page.locator('#search').fill('weller');
  assert.equal(await page.locator('#bottles tr').count(),3);
  await page.locator('#budget').selectOption('60');
  await page.locator('#tier').selectOption('3');
  assert.equal(await page.locator('#bottles tr').count(),2);
  await page.locator('#search').fill('no-such-bottle');
  assert.match(await page.locator('#result-count').textContent(),/^0 bottles/);
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#bottles tr').length===8);
  await page.locator('[data-tier="1"]').click();
  assert.equal(await page.locator('#bottles tr').count(),2);
  await page.locator('[data-tier="1"]').click();
  assert.equal(await page.locator('#bottles tr').count(),8);
  await page.locator('[data-step="1"]').click();
  assert.equal(await page.locator('#step-title').textContent(),'Read past the pin.');
  await page.locator('#open-journal').click();
  await page.locator('#note-bottle').fill('Test pour');
  await page.locator('#note-text').fill('Oak, vanilla, long finish.');
  await page.getByRole('button',{name:'Save note',exact:true}).click();
  assert.match(await page.locator('#note-status').textContent(),/Saved/);
  await page.keyboard.press('Escape');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#open-journal').click();
  assert.equal(await page.locator('#note-bottle').inputValue(),'Test pour');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)),true);
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  for(const width of [320,390,768,1024,1440]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow at ${width}px`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#navigation a[href="#ohio"]').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: filters, reset, tiers, Ohio steps, journal persistence, images, mobile navigation, five responsive widths, and no browser errors.');
} finally {await browser.close();}
