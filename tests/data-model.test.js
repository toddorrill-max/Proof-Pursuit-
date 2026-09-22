import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freshness, validateDataset, prepareDataset, loadDataset, listingSummary } from '../lib/data-model.js';
const demo = JSON.parse(await readFile(new URL('../data/demo.json', import.meta.url)));
const production = JSON.parse(await readFile(new URL('../data/production.json', import.meta.url)));
const now = Date.parse('2026-09-21T18:00:00Z');
test('freshness exact boundaries, natural aging, invalid and future timestamps', () => {
  for (const [hours, status] of [[0,'Fresh'],[24,'Fresh'],[24.001,'Aging'],[72,'Aging'],[72.001,'Stale']]) assert.equal(freshness(new Date(now-hours*3600000).toISOString(),now),status);
  assert.equal(freshness('invalid',now),'Unknown');
  assert.equal(freshness('2026-09-22T18:00:00Z',now),'Unknown');
  assert.equal(freshness('2026-09-20T18:00:00Z',now,{freshHours:12,agingHours:48}),'Aging');
  assert.throws(()=>freshness('2026-09-20T18:00:00Z',now,{freshHours:72,agingHours:24}));
});
test('demo and empty production validate without mixing', () => {
  assert.deepEqual(validateDataset(demo,{now}),[]);
  assert.deepEqual(validateDataset(production,{now}),[]);
  assert.ok(validateDataset(demo,{mode:'production',now}).length);
});
test('bad references, duplicate IDs, missing required fields, and invalid quantity fail closed', () => {
  for (const mutate of [d=>d.sightings[0].retailerId='missing',d=>d.bottles.push(d.bottles[0]),d=>delete d.sightings[0].verifiedAt,d=>d.sightings[0].estimatedQuantity=-1,d=>d.sightings[0].confidence='Certain',d=>d.locations[0].latitude=100,d=>d.sightings[0].purchaseConditions='none',d=>d.sightings[0].demo=false]) {
    const data=structuredClone(demo); mutate(data);
    assert.equal(prepareDataset(data,{now}).ok,false);
    assert.equal(prepareDataset(data,{now}).data,null);
  }
});
test('optional fields may be absent; unknowns are explicit',()=>{
  const data=structuredClone(demo); delete data.bottles[0].proof; delete data.retailers[0].phone;
  assert.deepEqual(validateDataset(data,{now}),[]);
  const summary=listingSummary(data.sightings[1],now);
  assert.equal(summary.quantityLabel,'Quantity unknown');
  assert.match(summary.conditionsLabel,/unknown/);
});
test('malformed collections return errors instead of throwing',()=>{
  for(const value of [null, [], {schemaVersion:1,mode:'demo'}, {...demo,sightings:[null]}]) assert.ok(validateDataset(value,{now}).length);
});
test('loader handles success, network, HTTP, JSON, and validation failures with no demo fallback',async()=>{
  assert.equal((await loadDataset({now,fetcher:async()=>({ok:true,json:async()=>demo})})).ok,true);
  for(const fetcher of [async()=>{throw Error('offline')},async()=>({ok:false,status:404}),async()=>({ok:true,json:async()=>{throw Error('bad JSON')}}),async()=>({ok:true,json:async()=>({})})]) {
    const result=await loadDataset({mode:'production',now,fetcher}); assert.equal(result.ok,false); assert.equal(result.data,null);
  }
});
test('data requests time out instead of leaving the UI loading forever',async()=>{
  const result=await loadDataset({timeoutMs:5,fetcher:()=>new Promise(()=>{})});
  assert.equal(result.ok,false);assert.match(result.errors[0],/timed out/);
});
test('reject impossible calendar dates, unsafe links and malformed optional contact fields',()=>{
  for(const mutate of [d=>d.sightings[0].verifiedAt='2026-02-30T12:00:00Z',d=>d.retailers[0].hours=42,d=>d.retailers[0].phone='call us',d=>d.retailers[0].url='javascript:alert(1)']){
    const copy=structuredClone(demo);mutate(copy);assert.ok(validateDataset(copy,{now}).length);
  }
  assert.equal(freshness('2024-02-29T12:00:00Z',now),'Stale');
});
