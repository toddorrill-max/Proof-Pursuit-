import {brand,dataConfig,freshnessRules,confidenceLevels} from './config.js';
import {loadDataset} from './lib/data-model.js';
import {communities,resolveLocation,joinSightings,filterSightings,directionsLink,distanceMiles,sourceLabels} from './lib/search.js';
import {element,link,field,route,installChrome,findingCard,timestamp} from './lib/view.js';

const page=document.body.dataset.page,content=document.querySelector('#page-content'),notice=document.querySelector('#page-notice'),heading=document.querySelector('h1');
const id=new URLSearchParams(location.search).get('id');
let dataset=null,origin=null,request=0;
installChrome(page);
function title(value){heading.textContent=value;document.title=`${value} — ${brand.name}`;}
function paragraph(parent,text){parent.append(element('p',text));}
function section(parent,titleText){const node=element('section',undefined,'content-section');node.append(element('h2',titleText));parent.append(node);return node;}
function list(parent,items){const ul=element('ul');for(const item of items)ul.append(element('li',item));parent.append(ul);}
function empty(parent,text){const box=element('div',undefined,'empty');box.append(element('p',text),link('Return to the hunting dashboard','dashboard.html'));parent.append(box);}
function demoNotice(){notice.textContent=(dataset?.mode||dataConfig.mode)==='demo'?'DEMO ONLY — Fictional retailers, bottles and availability. No real availability has been verified. Do not travel based on these examples.':'Manually maintained release intelligence — not live inventory. Check timestamps and call before traveling.';}
function addFindings(parent,rows,headingLevel=3){if(!rows.length){empty(parent,'No active findings to show. Expired records are excluded; this is not a statement about store inventory.');return;}const grid=element('div',undefined,'finding-grid');rows.forEach((row,index)=>grid.append(findingCard(row,{ordinal:index+1,headingLevel})));parent.append(grid);}

function locationControls(){
  const panel=document.querySelector('#page-location');panel.hidden=false;
  const select=document.querySelector('#community');
  for(const c of communities){const opt=element('option',`${c.city} center (${c.zip})`);opt.value=c.city;select.append(opt);}
  select.addEventListener('change',()=>{origin=resolveLocation(select.value);renderData();document.querySelector('#page-location-status').textContent=origin?`Using approximate ${origin.city} center. Distances are straight-line estimates.`:'Choose a community to calculate distances. No location is saved.';});
}
function retailerPanel(retailer,{detail=false}={}){
  const location=dataset.locations.find(l=>l.id===retailer.locationId),card=element('article',undefined,'finding retailer-card');
  if(retailer.demo)card.append(element('p','FICTIONAL DEMO RETAILER · No visitable store','demo-label'));
  if(!detail){const h=element('h2');h.append(link(retailer.name,route('retailer',retailer.id)));card.append(h);}
  const dl=element('dl',undefined,'facts');field(dl,'Community',`${location.city}, ${location.state} ${location.zip}`);field(dl,'Address',retailer.address);field(dl,'Phone',retailer.phone||'Phone unknown — no contact number supplied');field(dl,'Operating hours',retailer.hours||'Hours unknown — confirm before traveling');
  const exact=!retailer.demo&&Number.isFinite(retailer.latitude)&&Number.isFinite(retailer.longitude),distance=distanceMiles(origin,exact?retailer:location);
  field(dl,'Distance',distance===null?'Choose a community to see distance':`${exact?'':'Approx. '}${distance.toFixed(1)} miles · straight-line${exact?'':' to community center'}`);
  card.append(dl);const actions=element('div',undefined,'card-actions'),directions=directionsLink({demo:retailer.demo,retailer,location});actions.append(link(directions.label,directions.url,{external:true}));
  if(retailer.phone)actions.append(link(`Call ${retailer.phone}`,`tel:${retailer.phone.replace(/[^+\d]/g,'')}`));
  if(retailer.url)actions.append(link('Retailer information source',retailer.url,{external:true}));
  card.append(actions,element('p','Availability can change quickly—call before traveling.','call-reminder'));return card;
}
function renderData(){
  if(!dataset)return;
  content.replaceChildren();content.setAttribute('aria-busy','false');
  const all=filterSightings(joinSightings(dataset,origin)),count=document.querySelector('#page-count');
  if(page==='retailers'){
    title('Retailer directory');count.textContent=`${dataset.retailers.length} ${dataset.mode==='demo'?'demo ':''}retailers · Columbus-area pilot`;
    const grid=element('div',undefined,'retailer-grid');
    for(const retailer of [...dataset.retailers].sort((a,b)=>a.name.localeCompare(b.name)))grid.append(retailerPanel(retailer));
    if(!dataset.retailers.length)empty(content,'No retailers have been published yet.');else content.append(grid);
  }else if(page==='retailer'){
    const retailer=dataset.retailers.find(r=>r.id===id);
    if(!retailer){title('Retailer not found');count.textContent='';empty(content,'This retailer link is missing or the record has been removed.');return;}
    title(retailer.name);content.append(link('← All retailers','retailers.html'),retailerPanel(retailer,{detail:true}));
    const rows=all.filter(row=>row.retailerId===id);count.textContent=`${rows.length} active ${dataset.mode==='demo'?'demo ':''}findings`;
    const recent=section(content,'Recent findings');paragraph(recent,'Newest verification first. A finding is not a reservation or inventory guarantee.');addFindings(recent,rows);
  }else if(page==='finding'){
    const row=joinSightings(dataset,origin,Date.now(),{includeExpired:true}).find(r=>r.id===id);
    if(!row){title('Finding not found');count.textContent='';empty(content,'This finding link is missing or the record has been removed. No availability can be inferred.');return;}
    title(row.bottle.name);count.textContent=row.status==='expired'?'Expired record · reference only':`${row.demo?'Demo finding':'Finding'} · ${row.freshness}`;
    content.append(link('← Hunting dashboard','dashboard.html'),findingCard(row,{detail:true}));
    const bottle=section(content,'Bottle and release details'),dl=element('dl',undefined,'facts');
    field(dl,'Bottle',row.bottle.name);field(dl,'Producer / distillery',row.bottle.producer);field(dl,'Bottle type',row.bottle.bottleType);field(dl,'Proof',row.bottle.proof==null?'Proof unknown':String(row.bottle.proof));field(dl,'Bottle size',row.bottle.sizeMl==null?'Size unknown':`${row.bottle.sizeMl} mL`);if(row.pick)field(dl,'Barrel identifier',row.pick.barrelId||'Barrel identifier unknown');bottle.append(dl);
    const source=section(content,'Source and verification');paragraph(source,`${row.demo?'Demo source: ':''}${row.source.label}`);paragraph(source,`${sourceLabels[row.source.type]}. Confidence: ${row.confidence}. ${row.confidenceReason}`);
    if(row.source.url)source.append(link('Read the attributed source',row.source.url,{external:true}));else paragraph(source,'No source URL supplied. This demo is not evidence of real availability.');
    source.append(element('p',`Recorded verification: ${timestamp.format(new Date(row.verifiedAt))} ET. Opening this page does not refresh the verification.`),link('How verification works','methodology.html'));
    const store=section(content,'Retailer');store.append(link(row.retailer.name,route('retailer',row.retailerId)));paragraph(store,`${row.retailer.address} · ${row.location.city}, ${row.location.state} ${row.location.zip}`);
  }else{
    const type=page==='store-picks'?'store-pick':'rare-allocated',rows=all.filter(row=>row.releaseType===type);title(type==='store-pick'?'Store picks':'Rare and allocated releases');count.textContent=`${rows.length} ${dataset.mode==='demo'?'demo ':''}findings · newest verification first`;
    paragraph(content,'Review the verification date, confidence and purchase conditions. Labels describe the release type, not a promise of availability.');addFindings(content,rows,2);
  }
}
function renderMethodology(){
  title('How verification works');content.classList.add('reading');
  paragraph(content,'Use these findings to decide what to check next, not as confirmation that a bottle is waiting on a shelf. The pilot is manually maintained and may only be reviewed weekly.');
  const fresh=section(content,'Timestamps and freshness');
  list(fresh,[`Fresh: verified within ${freshnessRules.freshHours} hours, including the boundary.`,`Aging: over ${freshnessRules.freshHours} hours and no more than ${freshnessRules.agingHours} hours.`,`Stale: over ${freshnessRules.agingHours} hours. Reconfirm before making plans.`]);
  paragraph(fresh,'Times display in America/New_York time (ET), including daylight saving time. Freshness changes as records age; opening the site never changes the verification timestamp. Stale findings remain visible unless you exclude them. Expired records are removed from active results, but existing detail links retain an explicit reference-only warning.');
  const sources=section(content,'What source labels mean');
  list(sources,['Official / retailer source: an owner-recorded statement from a retailer or an official release announcement. A release announcement may not establish current shelf stock.','Manually verified: the editor checked the information directly and documented the source.','Community intelligence reviewed by editor: a report the editor reviewed. It is not a public submission or an independently guaranteed inventory count.']);
  paragraph(sources,'Attributed source links appear when supplied. Demo records use fictional sources and are not evidence. A source URL indicates where information came from; it is not an endorsement or affiliation.');
  const confidence=section(content,'Confidence is separate from freshness');paragraph(confidence,`The configured confidence levels are ${confidenceLevels.join(', ')}. The editor assigns a level and explains the reason on each finding; it is not a statistical probability.`);
  list(confidence,['High: strong, directly attributable evidence for the specific claim.','Medium: useful evidence with limitations, such as incomplete details or an indirect report.','Low: tentative evidence that needs additional checking.']);paragraph(confidence,'A high-confidence record can still be stale. Even fresh, high-confidence information can change before you arrive.');
  const quantity=section(content,'Quantities and purchase conditions');paragraph(quantity,'Estimated quantities describe the report at verification time, not a reservation. “Quantity unknown” means no number was supplied; zero is a reported count of zero. Review per-person limits, loyalty requirements, lottery eligibility or other conditions when supplied. “Purchase conditions unknown” means you need to ask the retailer.');
  const location=section(content,'Distances, pins and directions');paragraph(location,'Distances are straight-line estimates, not driving distances. The ZIP/community lookup uses approximate community centers. Without verified retailer coordinates, the pin and distance refer to that community center. Demo retailers are fictional, and their directions explicitly go to the community center rather than a store.');
  const responsible=section(content,'Before traveling');list(responsible,['Confirm the bottle, release and location with the retailer.','Ask about availability, hours and purchase conditions.','Respect retailer rules and staff. This site offers information, not sales, reservations, shipping or resale.']);responsible.append(link('Findings dashboard','dashboard.html'));
}
function renderAbout(){
  title(`About ${brand.name}`);content.classList.add('reading');
  paragraph(content,`${brand.name} is a Columbus-area pilot for experienced bourbon enthusiasts who want to spend less time guessing which stores to check. It brings together manually maintained release findings, source context and verification dates.`);
  const scope=section(content,'A local, manually maintained resource');paragraph(scope,'The initial focus is Columbus and nearby communities, including Reynoldsburg, Dublin, Westerville, Gahanna, New Albany, Grove City, Hilliard and Pickerington. Coverage depends on the records the owner has actually added; a listed community is not a claim of verified availability there.');paragraph(scope,'The first-year pilot is free. There are no subscriptions, paywalls, advertising, affiliate links, accounts or public submissions. Updates may happen only weekly, so findings can become stale.');
  const demo=section(content,'What you are looking at');paragraph(demo,dataConfig.mode==='demo'?'This version runs in demo mode. Retailers, bottles, source assessments and availability records are fictional examples. No real stock has been verified.':'This version is configured for production data maintained by the owner. Check every source, verification date and limitation before relying on a finding.');paragraph(demo,'The older editorial field guide is retained separately. Its illustrative price examples are not the evidence used by this release dashboard.');demo.append(link('Read the verification methodology','methodology.html'));
  const privacy=section(content,'Location and external services');paragraph(privacy,'Browser location is requested only when you choose it on the dashboard. It stays in page memory; no account, location history or application backend stores it. Detail pages let you choose an approximate community without sharing browser coordinates. Map tiles are loaded from OpenStreetMap, which receives ordinary web requests including your IP address and map area. Directions and source links open external services with their own privacy practices.');
  const limits=section(content,'Independence and responsible use');paragraph(limits,'This is an independent informational resource, not affiliated with OHLQ, the State of Ohio, retailers or distilleries. Names identify sources or subjects, not endorsements. No protected retailer or distillery logos are used. The site does not facilitate alcohol sales, shipping, resale or secondary-market transactions.');paragraph(limits,'For adults 21 and older. Enjoy responsibly. Availability can change quickly—call before traveling.');
}
async function start(){
  const current=++request;content.replaceChildren();content.setAttribute('aria-busy','true');document.querySelector('#page-error').hidden=true;
  const result=await loadDataset();if(current!==request)return;
  if(!result.ok){dataset=null;content.setAttribute('aria-busy','false');document.querySelector('#page-count').textContent='Data unavailable';document.querySelector('#page-error').hidden=false;notice.textContent='Data unavailable. No availability claims are shown.';return;}
  dataset=result.data;demoNotice();renderData();
}
demoNotice();
if(page==='methodology'||page==='about'){
  if(page==='methodology')renderMethodology();else renderAbout();content.setAttribute('aria-busy','false');
}else{
  locationControls();document.querySelector('#retry-page').addEventListener('click',start);start();
  // Recompute age during keyboard use and restore the same link without scrolling.
  function refresh(){
    if(!dataset)return;
    const active=document.activeElement,links=[...content.querySelectorAll('a')];
    const index=links.indexOf(active),href=active?.getAttribute('href');
    renderData();
    if(index>=0){const next=[...content.querySelectorAll('a')];const target=next[index]?.getAttribute('href')===href?next[index]:next.find(a=>a.getAttribute('href')===href);target?.focus({preventScroll:true});}
  }
  setInterval(refresh,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
