import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveLocation,distanceMiles,joinSightings,filterSightings,directionsLink} from '../lib/search.js';
const data=JSON.parse(await readFile(new URL('../data/demo.json',import.meta.url)));
const now=Date.parse('2026-09-21T18:00:00Z'),origin=resolveLocation('43215'),rows=joinSightings(data,origin,now);
test('ZIP and community lookup trims input, rejects unsupported locations',()=>{
 assert.equal(resolveLocation(' dUbLiN ').zip,'43017');assert.equal(resolveLocation('43215').city,'Columbus');assert.equal(resolveLocation('99999'),null);
});
test('distance is symmetric, zero at origin, absent without location',()=>{
 assert.equal(distanceMiles(origin,origin),0);assert.equal(distanceMiles(null,origin),null);
 const dublin=resolveLocation('Dublin');assert.ok(distanceMiles(origin,dublin)>10 && distanceMiles(origin,dublin)<15);
 assert.equal(distanceMiles(origin,dublin),distanceMiles(dublin,origin));
});
test('search covers producer, bottle, retailer and store-pick name; filters combine',()=>{
 assert.equal(filterSightings(rows,{search:' BARREL SELECTION '},now).length,1);
 assert.equal(filterSightings(rows,{search:'demo producer'},now).length,2);
 assert.equal(filterSightings(rows,{search:'dublin'},now)[0].retailerId,'demo-dublin');
 assert.equal(filterSightings(rows,{releaseType:'store-pick',confidence:'High',availability:'limited',city:'Columbus',retailer:'demo-columbus',bottleType:'bourbon',quantity:'5',distance:'5',age:'24'},now).length,1);
 assert.equal(filterSightings(rows,{releaseType:'store-pick',city:'Dublin'},now).length,0);
});
test('feed sorts latest verification first; stale remains until excluded; unknown quantity is not positive',()=>{
 assert.deepEqual(filterSightings([...rows].reverse(),{},now).map(r=>r.id),['sighting-0','sighting-1','sighting-2']);
 assert.equal(filterSightings(rows,{excludeStale:true},now).length,2);
 assert.equal(filterSightings(rows,{quantity:'1'},now).length,1);
 assert.equal(filterSightings(joinSightings(data,null,now),{distance:'25'},now).length,0);
});
test('expired findings excluded, production directions use addresses, demo never directs to fictional stores',()=>{
 const copy=structuredClone(data);copy.sightings[0].status='expired';assert.equal(joinSightings(copy,origin,now).length,2);
 assert.match(directionsLink(rows[0]).label,/center \(demo only\)/);
 assert.ok(!decodeURIComponent(directionsLink(rows[0]).url).includes('Fictional'));
 const production={...rows[0],demo:false,retailer:{...rows[0].retailer,address:'123 Main St & Side Road'}};
 assert.ok(new URL(directionsLink(production).url).searchParams.get('destination').startsWith('123 Main St & Side Road'));
});
