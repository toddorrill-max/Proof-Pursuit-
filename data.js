// Deliberately illustrative: replace with a dated, attributed feed before publishing live valuations.
export const bottles = [
  {name:'George T. Stagg',brand:'Buffalo Trace · Kentucky straight bourbon',tier:1,retail:150,resale:'$650–900',trend:'up'},
  {name:'Pappy Van Winkle 15 Year',brand:'Old Rip Van Winkle · Kentucky straight bourbon',tier:1,retail:150,resale:'$1,400–1,800',trend:'steady'},
  {name:'E.H. Taylor Barrel Proof',brand:'Buffalo Trace · Kentucky straight bourbon',tier:2,retail:90,resale:'$250–350',trend:'steady'},
  {name:'Weller CYPB',brand:'Buffalo Trace · Wheated bourbon',tier:2,retail:60,resale:'$300–400',trend:'down'},
  {name:'Weller Antique 107',brand:'Buffalo Trace · Wheated bourbon',tier:3,retail:60,resale:'$100–110',trend:'down'},
  {name:'Blanton’s Single Barrel',brand:'Buffalo Trace · Kentucky straight bourbon',tier:3,retail:75,resale:'$90–120',trend:'down'},
  {name:'Elijah Craig Barrel Proof',brand:'Heaven Hill · Kentucky straight bourbon',tier:3,retail:80,resale:'$80–100',trend:'steady'},
  {name:'Weller Special Reserve',brand:'Buffalo Trace · Wheated bourbon',tier:3,retail:30,resale:'$40–55',trend:'down'}
];
export function filterBottles({search='',tier='all',budget='all',trend='all'} = {}) {
  const query=search.trim().toLocaleLowerCase();
  return bottles.filter(b=>(b.name+' '+b.brand).toLocaleLowerCase().includes(query) && (tier==='all'||b.tier===Number(tier)) && (budget==='all'||b.retail<=Number(budget)) && (trend==='all'||b.trend===trend));
}
export const steps = [
  {caption:'STEP 01 / FIND',title:'Start at the source.',copy:'Search for the exact bottle on OHLQ. Compare the product, bottle size, listed price, and nearby locations before building your route.'},
  {caption:'STEP 02 / VERIFY',title:'Read past the pin.',copy:'Check the location’s inventory timestamp and current availability guidance. A listing can lag shelf stock and is not a reservation. Confirm before making a special trip.'},
  {caption:'STEP 03 / PLAN',title:'A good hunt has a plan.',copy:'Check each store’s posted release rules and opening hours. Set a spending limit, respect staff and fellow hunters, and keep a backup bottle on your shortlist.'}
];
