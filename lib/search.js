import { listingSummary } from './data-model.js';

// Approximate community centers, not ZIP boundaries or store coordinates.
export const communities = [
  ['Columbus','43215',39.9612,-82.9988], ['Reynoldsburg','43068',39.9548,-82.8121],
  ['Dublin','43017',40.0992,-83.1141], ['Westerville','43081',40.1262,-82.9291],
  ['Gahanna','43230',40.0192,-82.8793], ['New Albany','43054',40.0812,-82.8088],
  ['Grove City','43123',39.8815,-83.093], ['Hilliard','43026',40.0334,-83.1582],
  ['Pickerington','43147',39.8842,-82.7535]
].map(([city,zip,latitude,longitude])=>({city,zip,latitude,longitude}));

export const releaseLabels = {'store-pick':'Store pick','rare-allocated':'Rare / allocated','new-release':'New release',standard:'Standard release'};
export const sourceLabels = {'official-retailer':'Official / retailer source',manual:'Manually verified','editor-reviewed-community':'Community intelligence reviewed by editor'};
export const availabilityLabels = {'reported-available':'Reported available',limited:'Reported limited',unavailable:'Reported unavailable',unknown:'Availability unknown'};

export function resolveLocation(value) {
  const query=String(value).trim().toLocaleLowerCase();
  return communities.find(c=>c.zip===query || c.city.toLocaleLowerCase()===query) || null;
}
export function distanceMiles(a,b) {
  if(!a||!b||![a.latitude,a.longitude,b.latitude,b.longitude].every(Number.isFinite)) return null;
  const rad=v=>v*Math.PI/180;
  const v=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;
  return 3958.7613*2*Math.asin(Math.min(1,Math.sqrt(v)));
}
export function joinSightings(data, origin=null, now=Date.now()) {
  const index=key=>new Map(data[key].map(row=>[row.id,row]));
  const retailers=index('retailers'), bottles=index('bottles'), locations=index('locations'), sources=index('sources'), picks=index('storePicks');
  return data.sightings.filter(row=>row.status==='active').map(row=>{
    const retailer=retailers.get(row.retailerId), bottle=bottles.get(row.bottleId), source=sources.get(row.sourceId), location=locations.get(retailer.locationId);
    const exact=!row.demo && Number.isFinite(retailer.latitude) && Number.isFinite(retailer.longitude);
    const point=exact?retailer:location;
    return {...listingSummary(row,now),retailer,bottle,source,location,pick:picks.get(row.storePickId),point,approximate:!exact,distance:distanceMiles(origin,point)};
  });
}
export function filterSightings(rows, filters={}, now=Date.now()) {
  const q=(filters.search||'').trim().toLocaleLowerCase();
  return rows.filter(row=>{
    const haystack=[row.bottle.name,row.bottle.producer,row.retailer.name,row.pick?.name].join(' ').toLocaleLowerCase();
    return haystack.includes(q)
      && (!filters.releaseType||row.releaseType===filters.releaseType)
      && (!filters.bottleType||row.bottle.bottleType===filters.bottleType)
      && (!filters.retailer||row.retailerId===filters.retailer)
      && (!filters.city||row.location.city===filters.city)
      && (!filters.confidence||row.confidence===filters.confidence)
      && (!filters.availability||row.availability===filters.availability)
      && (!filters.quantity||row.estimatedQuantity!==null && row.estimatedQuantity>=Number(filters.quantity))
      && (!filters.distance||row.distance!==null && row.distance<=Number(filters.distance))
      && (!filters.age||(now-Date.parse(row.verifiedAt))/3600000<=Number(filters.age))
      && (!filters.excludeStale||row.freshness!=='Stale' && row.freshness!=='Unknown');
  }).sort((a,b)=>Date.parse(b.verifiedAt)-Date.parse(a.verifiedAt)||a.id.localeCompare(b.id));
}
export function directionsLink(row) {
  // Never describe fictional demo pins as stores users can visit.
  if(row.demo) return {label:`Directions to ${row.location.city} center (demo only)`,url:`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(row.location.city+', Ohio')}`};
  return {label:'Directions to retailer',url:`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([row.retailer.address,row.location.city,row.location.state,row.location.zip].join(', '))}`};
}
