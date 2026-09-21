import {filterBottles,steps} from './data.js';
import {brand} from './config.js';
document.title = `${brand.name} — ${brand.headline}`;
document.querySelector('meta[name="description"]').content = `${brand.name}: ${brand.description}`;
document.querySelectorAll('[data-brand-name]').forEach(el => { el.textContent = brand.name; });
document.querySelectorAll('[data-brand-tagline]').forEach(el => { el.textContent = brand.tagline; });
document.querySelectorAll('[data-brand-mark]').forEach(el => { el.textContent = brand.mark; });
document.querySelectorAll('[data-brand-home]').forEach(el => { el.setAttribute('aria-label', `${brand.name} home`); });
const $ = selector => document.querySelector(selector);
const filterForm=$('#filters');
function renderBottles(){
  const rows=filterBottles({search:$('#search').value,tier:$('#tier').value,budget:$('#budget').value,trend:$('#trend').value});
  const body=$('#bottles'); body.replaceChildren();
  for(const bottle of rows){
    const row=document.createElement('tr');
    const name=document.createElement('td'); name.textContent=bottle.name;
    const brand=document.createElement('small');brand.textContent=bottle.brand;name.append(brand);row.append(name);
    const values=[`Tier ${bottle.tier}`,`$${bottle.retail}`,bottle.resale,`${{up:'↗ Rising',down:'↘ Cooling',steady:'→ Steady'}[bottle.trend]}`];
    values.forEach((value,index)=>{const cell=document.createElement('td');const span=document.createElement('span');span.textContent=value;if(index===0)span.className='tier-pill';if(index===3)span.className=`trend ${bottle.trend}`;cell.append(span);row.append(cell);});body.append(row);
  }
  if(!rows.length){const row=body.insertRow();const cell=row.insertCell();cell.colSpan=5;cell.textContent='No bottles match these filters. Try a broader search or reset your filters.';}
  $('#result-count').textContent=`${rows.length} ${rows.length===1?'bottle':'bottles'} in your shortlist`;
  document.querySelectorAll('[data-tier]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tier===$('#tier').value)));
}
filterForm.addEventListener('input',renderBottles);
filterForm.addEventListener('submit',event=>event.preventDefault());
filterForm.addEventListener('reset',()=>setTimeout(renderBottles,0));
document.querySelectorAll('[data-tier]').forEach(button=>button.addEventListener('click',()=>{$('#tier').value=$('#tier').value===button.dataset.tier?'all':button.dataset.tier;renderBottles();}));
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{
  const step=steps[Number(button.dataset.step)];
  document.querySelectorAll('[data-step]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});
  $('#step-caption').textContent=step.caption;$('#step-title').textContent=step.title;$('#step-copy').textContent=step.copy;
}));
const menu=$('.menu-toggle'),nav=$('#navigation');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
const journal=$('#journal');
$('#open-journal').addEventListener('click',()=>{
  $('#note-status').textContent='';
  try{const note=JSON.parse(localStorage.getItem('proof-pursuit-note')||'null');if(note && typeof note.bottle==='string' && typeof note.text==='string'){$('#note-bottle').value=note.bottle;$('#note-text').value=note.text;}}
  catch{$('#note-status').textContent='Browser storage is unavailable. You can still write a note, but copy it before closing.';}
  journal.showModal();
});
$('#close-journal').addEventListener('click',()=>journal.close());
$('#journal-form').addEventListener('submit',event=>{event.preventDefault();try{localStorage.setItem('proof-pursuit-note',JSON.stringify({bottle:$('#note-bottle').value,text:$('#note-text').value}));$('#note-status').textContent='Saved on this device. Your note will be here when you return.';}catch{$('#note-status').textContent='Your browser could not save this note. Please copy it before closing.';}});
renderBottles();
