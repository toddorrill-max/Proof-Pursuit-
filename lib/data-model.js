import { freshnessRules, confidenceLevels, dataConfig } from '../config.js';

export const collections = ['locations', 'retailers', 'bottles', 'sources', 'sightings', 'storePicks', 'releaseEvents'];
const text = v => typeof v === 'string' && v.trim().length > 0;
const iso = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
const url = v => { try { return ['https:', 'http:'].includes(new URL(v).protocol); } catch { return false; } };

export function freshness(verifiedAt, now = Date.now(), rules = freshnessRules) {
  if (!Number.isFinite(rules.freshHours) || !Number.isFinite(rules.agingHours) || rules.freshHours < 0 || rules.agingHours <= rules.freshHours) throw new Error('Freshness thresholds must be finite and increasing.');
  const time = now instanceof Date ? now.getTime() : now;
  if (!iso(verifiedAt) || !Number.isFinite(time) || Date.parse(verifiedAt) > time) return 'Unknown';
  const hours = (time - Date.parse(verifiedAt)) / 3600000;
  return hours <= rules.freshHours ? 'Fresh' : hours <= rules.agingHours ? 'Aging' : 'Stale';
}

// Collect all problems so an owner can fix a file in one pass. Never drop bad rows silently.
export function validateDataset(data, { mode = data?.mode, now = Date.now() } = {}) {
  const errors = [];
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['Dataset must be an object.'];
  if (data.schemaVersion !== 1) fail('schemaVersion', 'must be 1');
  if (!['demo', 'production'].includes(mode) || data.mode !== mode) fail('mode', 'must match demo or production selection');
  const ids = {};
  for (const key of collections) {
    ids[key] = new Set();
    if (!Array.isArray(data[key])) { fail(key, 'must be an array'); continue; }
    data[key].forEach((row, i) => {
      const p = `${key}[${i}]`;
      if (!row || typeof row !== 'object' || Array.isArray(row)) { fail(p, 'must be an object'); return; }
      if (!text(row.id) || ids[key].has(row.id)) fail(p, 'id must be nonempty and unique');
      ids[key].add(row.id);
      if (row.demo !== (mode === 'demo')) fail(p, 'demo flag must match dataset mode');
      if (mode === 'demo' && !text(row.demoLabel)) fail(p, 'demoLabel required');
    });
  }
  const required = {
    locations: ['metroId', 'city', 'state', 'zip'], retailers: ['name', 'address', 'locationId'],
    bottles: ['name', 'producer', 'bottleType'], sources: ['label', 'type'],
    sightings: ['bottleId', 'retailerId', 'sourceId', 'verifiedAt', 'confidence', 'confidenceReason', 'releaseType', 'availability', 'status'],
    storePicks: ['name', 'bottleId', 'retailerId'], releaseEvents: ['name', 'bottleId', 'retailerId', 'sourceId', 'startsAt']
  };
  const references = { locationId: 'locations', bottleId: 'bottles', retailerId: 'retailers', sourceId: 'sources', storePickId: 'storePicks' };
  for (const key of collections) (Array.isArray(data[key]) ? data[key] : []).forEach((row, i) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return;
    const p = `${key}[${i}]`;
    for (const field of required[key]) if (!text(row[field])) fail(`${p}.${field}`, 'required text');
    for (const [field, target] of Object.entries(references)) if (row[field] != null && !ids[target].has(row[field])) fail(`${p}.${field}`, `unknown ${target} id`);
    for (const field of ['verifiedAt', 'startsAt', 'endsAt']) if (row[field] != null && !iso(row[field])) fail(`${p}.${field}`, 'must be an ISO timestamp with timezone');
    if (row.verifiedAt && Date.parse(row.verifiedAt) > now) fail(p, 'verification cannot be in the future');
    if (row.endsAt && Date.parse(row.endsAt) < Date.parse(row.startsAt)) fail(p, 'event ends before it starts');
    if (key === 'locations') {
      if (!Number.isFinite(row.latitude) || Math.abs(row.latitude) > 90 || !Number.isFinite(row.longitude) || Math.abs(row.longitude) > 180) fail(p, 'valid coordinates required');
      if (!/^\d{5}$/.test(row.zip)) fail(p, 'ZIP must have five digits');
    }
    if (key === 'sources') {
      if (!['official-retailer', 'manual', 'editor-reviewed-community'].includes(row.type)) fail(p, 'unsupported source type');
      if (mode === 'production' && !url(row.url)) fail(p, 'production source requires attribution URL');
    }
    if (key === 'retailers' && (row.latitude != null || row.longitude != null)) {
      if (!Number.isFinite(row.latitude) || Math.abs(row.latitude) > 90 || !Number.isFinite(row.longitude) || Math.abs(row.longitude) > 180) fail(p, 'retailer coordinates must be a valid latitude/longitude pair');
    }
    if (row.url != null && !url(row.url)) fail(p, 'source URL must be http(s)');
    for (const field of ['proof', 'sizeMl', 'msrp']) if (row[field] != null && (!Number.isFinite(row[field]) || row[field] < 0)) fail(`${p}.${field}`, 'must be nonnegative or null');
    if (key === 'sightings') {
      if (!confidenceLevels.includes(row.confidence)) fail(p, 'unsupported confidence');
      if (!['store-pick', 'rare-allocated', 'new-release', 'standard'].includes(row.releaseType)) fail(p, 'unsupported release type');
      if (!['reported-available', 'limited', 'unavailable', 'unknown'].includes(row.availability)) fail(p, 'unsupported availability');
      if (!['active', 'expired'].includes(row.status)) fail(p, 'status must be active or expired');
      if (row.estimatedQuantity !== null && (!Number.isInteger(row.estimatedQuantity) || row.estimatedQuantity < 0)) fail(p, 'estimatedQuantity must be a nonnegative integer or explicit null');
      if (!Array.isArray(row.purchaseConditions) || row.purchaseConditions.some(v => !text(v))) fail(p, 'purchaseConditions must be an array of text; use [] if unknown');
      if (row.releaseType === 'store-pick' && !text(row.storePickId)) fail(p, 'store picks require storePickId');
      const pick = data.storePicks?.find?.(v => v?.id === row.storePickId);
      if (pick && (pick.bottleId !== row.bottleId || pick.retailerId !== row.retailerId)) fail(p, 'store pick must match bottle and retailer');
    }
  });
  return errors;
}

export function prepareDataset(data, options = {}) {
  const errors = validateDataset(data, options);
  return errors.length ? { ok: false, data: null, errors } : { ok: true, data, errors: [] };
}

export async function loadDataset({ mode = dataConfig.mode, fetcher = globalThis.fetch, now = Date.now(), timeoutMs = 10000 } = {}) {
  if (!['demo', 'production'].includes(mode)) return { ok: false, data: null, errors: ['Unsupported data mode.'] };
  const controller = new AbortController();let timer;
  try {
    return await Promise.race([
      (async()=>{
        const response = await fetcher(new URL(`../data/${mode}.json`, import.meta.url), { signal: controller.signal });
        if (!response.ok) throw new Error(`Data request failed (${response.status}).`);
        return prepareDataset(await response.json(), { mode, now });
      })(),
      new Promise((_, reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Data request timed out.'));},timeoutMs);})
    ]);
  } catch (error) { return { ok: false, data: null, errors: [error.message] }; }
  finally { clearTimeout(timer); }
}

export function listingSummary(row, now = Date.now()) {
  return { ...row, freshness: freshness(row.verifiedAt, now), quantityLabel: row.estimatedQuantity == null ? 'Quantity unknown' : `Estimated quantity: ${row.estimatedQuantity}`, conditionsLabel: row.purchaseConditions?.length ? row.purchaseConditions.join('; ') : 'Purchase conditions unknown — call retailer' };
}
