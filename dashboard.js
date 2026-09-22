import { brand, freshnessRules, confidenceLevels } from './config.js';
import { loadDataset } from './lib/data-model.js';
import { communities, resolveLocation, joinSightings, filterSightings, directionsLink, releaseLabels, sourceLabels, availabilityLabels } from './lib/search.js';
import { createHuntMap } from './lib/hunt-map.js';

const $=selector=>document.querySelector(selector);
const form=$('#hunt-filters');
let data=null,origin=null,rows=[],selectedId=null,map=null,locationRequest=0,dataRequest=0;
const timestamp=new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/New_York'});
document.title=`${brand.name} — Columbus release intelligence`;
document.querySelectorAll('[data-brand-name]').forEach(el=>el.textContent=brand.name);
document.querySelectorAll('[data-brand-mark]').forEach(el=>el.textContent=brand.mark);
$('#freshness-help').textContent=`Fresh: up to ${freshnessRules.freshHours} hours. Aging: over ${freshnessRules.freshHours} to ${freshnessRules.agingHours} hours. Stale: over ${freshnessRules.agingHours} hours.`;
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function option(select,value,label){const opt=element('option',label);opt.value=value;select.append(opt);}
communities.forEach(c=>{option($('#communities'),c.city,`${c.city} · ${c.zip}`);option($('#communities'),c.zip,`${c.city} center`);});
confidenceLevels.forEach(c=>option($('#confidence-filter'),c,c));
function field(list,title,value){const group=element('div');group.append(element('dt',title),element('dd',value));list.append(group);}
function card(row,{selected=false,ordinal=0}={}){
  const article=element('article',undefined,`finding${row.freshness==='Stale'?' stale':''}`);article.dataset.sighting=row.id;
  if(!selected)article.tabIndex=-1;
  const top=element('div',undefined,'card-top');
  top.append(element('span',`${ordinal?`${ordinal} / `:''}${releaseLabels[row.releaseType]}`,'release-type'),element('span',row.freshness,'status-badge'));article.append(top);
  if(row.demo)article.append(element('p','FICTIONAL DEMO · Not verified availability','demo-label'));
  article.append(element('h3',row.pick?.name||row.bottle.name),element('p',`${row.bottle.name} · ${row.bottle.producer}`,'producer'),element('p',`${row.retailer.name} · ${row.location.city}`,'retailer'));
  const dl=element('dl',undefined,'facts');
  const timeLabel=`${timestamp.format(new Date(row.verifiedAt))} ET`;
  field(dl,row.demo?'Demo verification timestamp':'Last verified',timeLabel);
  field(dl,'Distance',row.distance===null?'Choose a location to see distance':`${row.approximate?'Approx. ':''}${row.distance.toFixed(1)} miles · straight-line${row.approximate?' to community center':''}`);
  field(dl,'Source',`${row.demo?'Demo · ':''}${sourceLabels[row.source.type]}`);
  field(dl,'Confidence',`${row.confidence} — ${row.confidenceReason}`);
  field(dl,'Estimated quantity',row.quantityLabel);
  field(dl,'Availability',`${row.demo?'Demo · ':''}${availabilityLabels[row.availability]}`);
  field(dl,'Purchase conditions',row.conditionsLabel);
  article.append(dl);
  if(row.freshness==='Stale'||row.freshness==='Aging')article.append(element('p',`${row.freshness} information — reconfirm before making plans.`,'age-warning'));
  if(row.notes)article.append(element('p',row.notes,'notes'));
  const actions=element('div',undefined,'card-actions');
  const directions=directionsLink(row),link=element('a',directions.label);link.href=directions.url;link.target='_blank';link.rel='noopener';actions.append(link);
  if(row.source.url){const source=element('a','View source');source.href=row.source.url;source.target='_blank';source.rel='noopener';actions.append(source);}
  if(row.retailer.phone){const phone=element('a',`Call ${row.retailer.phone}`);phone.href=`tel:${row.retailer.phone.replace(/[^+\d]/g,'')}`;actions.append(phone);}
  else actions.append(element('span',row.demo?'No real retailer phone (demo)':'Phone not supplied — confirm contact details','notes'));
  if(!selected){const button=element('button','Select finding','secondary select-finding');button.type='button';button.dataset.select=row.id;button.setAttribute('aria-pressed',String(selectedId===row.id));button.addEventListener('click',()=>select(row.id));actions.append(button);}
  article.append(actions,element('p','Availability can change quickly—call before traveling.','call-reminder'));return article;
}
function select(id){
  selectedId=id;const row=rows.find(r=>r.id===id);
  $('#selected-finding').replaceChildren(row?card(row,{selected:true}):element('p','Select a map marker or a finding to inspect it here.','selection-hint'));
  document.querySelectorAll('#results .finding').forEach(el=>el.classList.toggle('selected',el.dataset.sighting===id));
  document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===id)));
  map?.select(id);
}
function filters(){return {...Object.fromEntries(new FormData(form)),excludeStale:form.elements.excludeStale.checked};}
function render({refit=true}={}){
  if(!data)return;
  const current=filters(),now=Date.now();rows=filterSightings(joinSightings(data,origin,now),current,now);
  if(!rows.some(row=>row.id===selectedId))selectedId=null;
  $('#results').replaceChildren(...rows.map((row,i)=>card(row,{ordinal:i+1})));
  $('#results').setAttribute('aria-busy','false');$('#empty').hidden=rows.length>0;
  $('#empty-message').textContent=data.sightings.length?'Try a broader search or reset your filters. Stale records are included unless you exclude them.':'No findings have been published in this dataset yet. Check back after the owner adds verified records.';
  const active=Object.values(current).filter(Boolean).length;
  $('#active-filters').textContent=active?`· ${active} active`:'';
  $('#result-count').textContent=`${rows.length} ${data.mode==='demo'?'demo ':''}${rows.length===1?'finding':'findings'} · newest verification first${origin?` · distances from ${origin.label}`:' · set a location for distances'}`;
  map?.setRows(rows,{refit});select(selectedId);
}
function setView(view){$('#results-layout').dataset.view=view;$('#list-view').setAttribute('aria-pressed',String(view==='list'));$('#map-view').setAttribute('aria-pressed',String(view==='map'));if(view==='map')setTimeout(()=>map?.resize(),0);}
$('#list-view').addEventListener('click',()=>setView('list'));
$('#map-view').addEventListener('click',()=>setView('map'));
$('#map-fallback').addEventListener('click',()=>{setView('list');$('#list-view').focus();});
$('#fit-map').addEventListener('click',()=>map?.fit());
form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',render);
form.addEventListener('reset',()=>setTimeout(render,0));$('#empty-reset').addEventListener('click',()=>form.reset());
function finishLocation(){locationRequest++;$('#locate').disabled=false;$('#locate').textContent='Use my location';}
function applyLocation(point,label){origin=point?{...point,label}:null;$('#distance-filter').disabled=!origin;if(!origin)$('#distance-filter').value='';$('#clear-location').hidden=!origin;render();}
$('#location-form').addEventListener('submit',event=>{
  event.preventDefault();const point=resolveLocation($('#location-input').value);
  if(!point){$('#location-status').textContent='That ZIP or community is not in the pilot lookup. Choose a listed community, such as Columbus, Dublin or Westerville. Your previous location is unchanged.';return;}
  finishLocation();applyLocation(point,`${point.city} center`);$('#location-status').textContent=`Using approximate ${point.city} center (${point.zip}), not a precise ZIP boundary.`;
});
$('#clear-location').addEventListener('click',()=>{finishLocation();applyLocation(null);$('#location-input').value='';$('#location-status').textContent='Location cleared. Set a location to see distances.';});
$('#locate').addEventListener('click',()=>{
  if(!navigator.geolocation){$('#location-status').textContent='Browser location is unavailable. Enter a listed ZIP or community instead.';return;}
  const request=++locationRequest;$('#locate').disabled=true;$('#locate').textContent='Requesting location…';$('#location-status').textContent='Waiting for browser permission. You can still use a ZIP or community.';
  navigator.geolocation.getCurrentPosition(position=>{
    if(request!==locationRequest)return;finishLocation();
    const point={latitude:position.coords.latitude,longitude:position.coords.longitude};
    if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)){ $('#location-status').textContent='Browser location was invalid. Enter a ZIP or community.';return; }
    applyLocation(point,'your browser location');$('#location-input').value='';$('#location-status').textContent=`Using browser location (accuracy approximately ${Math.round(position.coords.accuracy)} meters). Distances are straight-line estimates.`;
  },error=>{
    if(request!==locationRequest)return;finishLocation();
    $('#location-status').textContent=`${error.code===1?'Location permission denied.':error.code===3?'Location request timed out.':'Location could not be determined.'} Enter a listed ZIP or community instead. Your previous location is unchanged.`;
  },{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
});
async function startData(){
  const request=++dataRequest;data=null;rows=[];select(null);map?.setRows([]);$('#results').replaceChildren();$('#empty').hidden=true;
  $('#data-error').hidden=true;$('#results').setAttribute('aria-busy','true');$('#result-count').textContent='Loading release intelligence…';
  const result=await loadDataset();if(request!==dataRequest)return;
  if(!result.ok){$('#results').setAttribute('aria-busy','false');$('#data-error-message').textContent='Release data could not be loaded or did not pass validation. No availability is shown. Retry or contact the owner.';$('#data-error').hidden=false;$('#result-count').textContent='Release data unavailable';$('#demo-notice').textContent='Data unavailable. No availability claims are being shown.';return;}
  data=result.data;$('#demo-notice').textContent=data.mode==='demo'?'DEMO ONLY — Fictional retailers and availability. Pins mark community centers. Do not travel based on these examples.':'Manually maintained release intelligence — not live inventory. Check each timestamp and call before traveling.';
  for(const [selector,key,label] of [['#retailer-filter','retailers','All retailers'],['#city-filter','locations','All communities'],['#bottle-type','bottles','All types']]){
    const el=$(selector),value=el.value;el.replaceChildren();option(el,'',label);
    const entries=key==='retailers'?data.retailers.map(r=>[r.id,r.name]):key==='locations'?[...new Set(data.locations.map(r=>r.city))].map(v=>[v,v]):[...new Set(data.bottles.map(r=>r.bottleType))].map(v=>[v,v]);
    entries.forEach(([id,name])=>option(el,id,name));if(entries.some(([id])=>id===value))el.value=value;
  }
  render();
}
$('#retry-data').addEventListener('click',startData);
startData();
createHuntMap({onSelect:select,onStatus:(message,failed)=>{$('#map-status').textContent=message;$('#map-fallback').hidden=!failed;}}).then(instance=>{map=instance;map.setRows(rows);map.select(selectedId);}).catch(()=>{
  $('#map-status').textContent='Map unavailable. All findings and directions are available in the list.';$('#map').hidden=true;$('#fit-map').disabled=true;$('#map-fallback').hidden=false;setView('list');
});
// Recompute age while open, preserving keyboard focus and the map viewport.
setInterval(()=>{
  if(!data)return;
  const active=document.activeElement,selectId=active?.dataset.select,markerId=active?.classList.contains('hunt-marker')?active.dataset.sighting:null;
  const findingId=active?.closest('.finding')?.dataset.sighting,href=active?.getAttribute('href'),scope=active?.closest('#selected-finding')?'#selected-finding':'#results';
  // Popup choice controls are not replaced until the user leaves that short interaction.
  if(active?.closest('.marker-choices'))return;
  render({refit:false});
  if(selectId||markerId||findingId){
    const target=href?[...document.querySelectorAll(`${scope} .finding a`)].find(el=>el.closest('.finding').dataset.sighting===findingId&&el.getAttribute('href')===href):[...document.querySelectorAll(selectId?'[data-select]':'.hunt-marker')].find(el=>(selectId?el.dataset.select:el.dataset.sighting)===(selectId||markerId));
    if(target)target.focus({preventScroll:true});else{$('#result-count').tabIndex=-1;$('#result-count').focus({preventScroll:true});}
  }
},60000);
