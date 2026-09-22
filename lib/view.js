import {brand} from '../config.js';
import {installMotion} from './motion.js';
import {directionsLink, releaseLabels, sourceLabels, availabilityLabels} from './search.js';

export const timestamp = new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/New_York'});
export function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
export function link(label,href,{external=false}={}){const el=element('a',label);el.href=href;if(external){el.target='_blank';el.rel='noopener';}return el;}
export function field(list,title,value){const group=element('div');group.append(element('dt',title),element('dd',value));list.append(group);}
export function route(page,id){return `${page}.html${id==null?'':`?id=${encodeURIComponent(id)}`}`;}
export function formatDistance(row){return row.distance===null?'Choose a location to see distance':`${row.approximate?'Approx. ':''}${row.distance.toFixed(1)} miles · straight-line${row.approximate?' to community center':''}`;}
export function installChrome(active){
  installMotion();
  document.querySelectorAll('[data-brand-name]').forEach(el=>el.textContent=brand.name);
  document.querySelectorAll('[data-brand-mark]').forEach(el=>el.textContent=brand.mark);
  const nav=document.querySelector('.site-header nav');
  if(nav){nav.replaceChildren();for(const [page,title] of [['dashboard','Find bottles'],['store-picks','Store picks'],['rare-releases','Rare releases'],['retailers','Retailers'],['methodology','Verification'],['about','About']]){const a=link(title,route(page));if(page===active||active==='retailer'&&page==='retailers')a.setAttribute('aria-current','page');nav.append(a);}}
  const header=document.querySelector('.site-header');
  if(header&&!header.querySelector('.near-me')){const action=link('Find near me ↗',active==='dashboard'?'#location-heading':'dashboard.html#location-heading');action.className='near-me';header.append(action);}
  const footer=document.querySelector('footer');
  if(footer){const links=element('nav',undefined,'footer-links');links.setAttribute('aria-label','More information');links.append(link('How verification works','methodology.html'),link('About this pilot','about.html'),link('Editorial field guide','editorial.html'));footer.append(links);}
}
export function findingCard(row,{selected=false,ordinal=0,selectedId=null,onSelect=null,detail=false,headingLevel=3}={}){
  const article=element('article',undefined,`finding${row.freshness==='Stale'?' stale':''}`);article.dataset.sighting=row.id;article.dataset.freshness=row.freshness;
  if(!selected)article.tabIndex=-1;
  const top=element('div',undefined,'card-top');top.append(element('span',`${ordinal?`${ordinal} / `:''}${releaseLabels[row.releaseType]}`,'release-type'),element('span',row.freshness,'status-badge'));article.append(top);
  if(row.demo)article.append(element('p','FICTIONAL DEMO · Not verified availability','demo-label'));
  if(row.status==='expired')article.append(element('p','EXPIRED RECORD — retained for reference, not current availability.','age-warning'));
  const heading=element(detail?'h2':`h${headingLevel}`);heading.append(detail?document.createTextNode(row.pick?.name||row.bottle.name):link(row.pick?.name||row.bottle.name,route('finding',row.id)));article.append(heading);
  article.append(element('p',`${row.bottle.name} · ${row.bottle.producer}`,'producer'));
  const retailer=element('p',undefined,'retailer');retailer.append(link(row.retailer.name,route('retailer',row.retailerId)),document.createTextNode(` · ${row.location.city}`));article.append(retailer);
  const dl=element('dl',undefined,'facts');field(dl,row.demo?'Demo verification timestamp':'Last verified',`${timestamp.format(new Date(row.verifiedAt))} ET`);
  field(dl,'Distance',formatDistance(row));field(dl,'Source',`${row.demo?'Demo · ':''}${sourceLabels[row.source.type]}`);
  field(dl,'Confidence',`${row.confidence} — ${row.confidenceReason}`);field(dl,'Estimated quantity',row.quantityLabel);
  field(dl,'Availability',`${row.demo?'Demo · ':''}${availabilityLabels[row.availability]}`);field(dl,'Purchase conditions',row.conditionsLabel);article.append(dl);
  if(row.freshness==='Stale'||row.freshness==='Aging')article.append(element('p',`${row.freshness} information — reconfirm before making plans.`,'age-warning'));
  if(row.notes)article.append(element('p',row.notes,'notes'));
  const actions=element('div',undefined,'card-actions'),directions=directionsLink(row);actions.append(link(directions.label,directions.url,{external:true}));
  if(row.source.url)actions.append(link('View source',row.source.url,{external:true}));
  if(row.retailer.phone)actions.append(link(`Call ${row.retailer.phone}`,`tel:${row.retailer.phone.replace(/[^+\d]/g,'')}`));
  else actions.append(element('span',row.demo?'No real retailer phone (demo)':'Phone not supplied — confirm contact details','notes'));
  if(!selected&&onSelect){const button=element('button','Select finding','secondary select-finding');button.type='button';button.dataset.select=row.id;button.setAttribute('aria-pressed',String(selectedId===row.id));button.addEventListener('click',()=>onSelect(row.id));actions.append(button);}
  article.append(actions,element('p','Availability can change quickly—call before traveling.','call-reminder'));return article;
}
