import { mapConfig } from '../config.js';

export async function createHuntMap({ onSelect, onStatus }) {
  let timer;
  try {
    await Promise.race([import('../vendor/leaflet.js'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Map library timed out')),8000);})]);
  } finally { clearTimeout(timer); }
  const L=globalThis.L;
  if(!L) throw Error('Map library unavailable');
  const map=L.map('map',{scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([39.99,-82.99],10);
  const tiles=L.tileLayer(mapConfig.tileUrl,{maxZoom:19,attribution:mapConfig.attribution}).addTo(map);
  const markers=new Map(),markerIds=new Map(); let currentRows=[],hadError=false,selectedId=null,started=false;
  let tileTimer=setTimeout(()=>{ if(!started) onStatus('Map tiles are taking too long. Use the list; markers may still work.',true); },10000);
  tiles.on('tileerror',()=>{hadError=true;onStatus('Map tiles could not load. Use the list; markers remain selectable.',true);});
  tiles.on('tileload',()=>{started=true;clearTimeout(tileTimer);if(!hadError)onStatus('Map ready. Select a marker to inspect a finding.',false);});
  const observer=new ResizeObserver(()=>map.invalidateSize({animate:false}));observer.observe(document.getElementById('map'));
  function highlight(id) {
    selectedId=id;
    for(const [marker,ids] of markerIds){const el=marker.getElement(),active=ids.includes(id);el?.classList.toggle('is-selected',active);el?.setAttribute('aria-pressed',String(active));}
  }
  function fit(){if(currentRows.length)map.fitBounds(currentRows.map(r=>[r.point.latitude,r.point.longitude]),{padding:[40,40],maxZoom:12,animate:false});}
  return {
    setRows(rows,{refit=true}={}){
      currentRows=rows;
      for(const marker of new Set(markers.values()))map.removeLayer(marker);markers.clear();markerIds.clear();
      const groups=new Map();
      rows.forEach((row,index)=>{const key=`${row.point.latitude},${row.point.longitude}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({row,index});});
      for(const group of groups.values()){
        const {row,index}=group[0];
        const tag={'store-pick':'Pick','rare-allocated':'Rare','new-release':'New',standard:'Std'}[row.releaseType];
        const icon=L.divIcon({className:'hunt-marker',html:`<span>${group.length>1?`${group.length} findings`:`${index+1} · ${tag}`}</span>`,iconSize:[80,40],iconAnchor:[40,20]});
        const label=group.length>1?`${group.length} findings near ${row.location.city}`:`${row.demo?'Demo: ':''}${row.bottle.name}, ${row.location.city}`;
        const marker=L.marker([row.point.latitude,row.point.longitude],{icon,keyboard:true,title:label,alt:label}).addTo(map);
        marker.getElement()?.setAttribute('data-sighting',row.id);
        marker.getElement()?.setAttribute('aria-label',label);
        marker.getElement()?.addEventListener('keydown',event=>{
          if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onSelect(row.id);if(group.length>1)marker.openPopup();}
        });
        if(group.length>1){
          const choices=document.createElement('div');choices.className='marker-choices';
          for(const item of group){const button=document.createElement('button');button.type='button';button.textContent=`${item.row.demo?'Demo: ':''}${item.row.bottle.name}`;button.addEventListener('click',()=>onSelect(item.row.id));choices.append(button);}
          marker.bindPopup(choices);
        }
        marker.on('click',()=>onSelect(row.id));
        group.forEach(item=>markers.set(item.row.id,marker));markerIds.set(marker,group.map(item=>item.row.id));
      } highlight(selectedId);if(refit)fit();
    },
    select(id){highlight(id);const marker=markers.get(id);if(marker&&!map.getBounds().contains(marker.getLatLng()))map.panTo(marker.getLatLng(),{animate:false});},
    fit,
    resize(){map.invalidateSize({animate:false});},
    destroy(){observer.disconnect();clearTimeout(tileTimer);map.remove();}
  };
}
