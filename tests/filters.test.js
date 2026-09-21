import test from 'node:test';
import assert from 'node:assert/strict';
import {filterBottles,bottles} from '../data.js';
test('default shortlist includes every sample bottle',()=>assert.equal(filterBottles().length,bottles.length));
test('search normalizes whitespace and case and searches distillery',()=>{assert.equal(filterBottles({search:'  WELLER  '}).length,3);assert.equal(filterBottles({search:'heaven hill'})[0].name,'Elijah Craig Barrel Proof');});
test('tier, retail ceiling, trend and search combine',()=>assert.deepEqual(filterBottles({search:'weller',tier:'3',budget:'60',trend:'down'}).map(b=>b.name),['Weller Antique 107','Weller Special Reserve']));
test('budget ceiling is inclusive',()=>assert.ok(filterBottles({budget:'60'}).some(b=>b.retail===60)));
test('conflicting filters return no results',()=>assert.equal(filterBottles({tier:'1',budget:'60'}).length,0));
