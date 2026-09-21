# Phase 1 owner guide

The existing dependency-free HTML/JavaScript homepage is preserved. The new hunting dataset is a foundation for Phase 2; it does not yet power the existing price shortlist or create a map. No new dependencies, accounts, integrations, or deployment are included.

## Files and settings

- `config.js`: brand name, tagline, headline, description and letter mark; default dataset mode; Fresh/Aging thresholds; allowed confidence labels.
- `data/demo.json`: fictional Columbus, Dublin and Westerville examples. Every row has `demo: true` and a conspicuous `demoLabel`. Coordinates identify communities, not actual retailers. Never generate directions to these fictional stores.
- `data/production.json`: intentionally empty. Add verified records here with `demo: false`, then change `dataConfig.mode` to `production`. The loader never falls back to demo when production fails.
- `lib/data-model.js`: validation, safe loading, freshness calculation and explicit unknown-value labels.
- `scripts/validate-data.mjs`: run `node scripts/validate-data.mjs` after editing. Run `npm test` for all checks.

Both files use `schemaVersion: 1`, a matching `mode`, and arrays named `locations`, `retailers`, `bottles`, `sources`, `sightings`, `storePicks`, and `releaseEvents`. IDs must be stable, nonempty, unique within their collection, and match linked records. Required fields are enforced by the validator.

| Collection | Required content beyond id/demo flags | Optional content |
| --- | --- | --- |
| locations | metroId, city, state, five-digit zip, latitude, longitude | Additional geographic metadata |
| retailers | name, address, locationId | phone, hours; null means unknown |
| bottles | name, producer, bottleType | proof, sizeMl, msrp (nonnegative numbers or null) |
| sources | label, type; production requires http(s) url | Demo url may be null |
| sightings | bottleId, retailerId, sourceId, verifiedAt, confidence, confidenceReason, releaseType, availability, estimatedQuantity, purchaseConditions, status | notes, storePickId (required for store-pick) |
| storePicks | name, bottleId, retailerId | barrelId |
| releaseEvents | name, bottleId, retailerId, sourceId, startsAt | endsAt, notes |

## Editing workflow

1. Add the location, retailer, bottle, and attributed source before a sighting referencing them. For a pick, add its `storePicks` record first. Use a new sighting ID for a distinct finding.
2. Record verification in ISO format with timezone, e.g. `2026-09-21T14:00:00-04:00`. Set it only when actually verifying, never just to refresh a page. Future verification times are rejected. Event start dates may be future dates.
3. Choose source type `official-retailer`, `manual`, or `editor-reviewed-community`. Use permitted, owner-supplied information; do not scrape. A source URL is attribution, not proof of available inventory.
4. Set confidence to High, Medium or Low with a specific `confidenceReason`. Confidence is an editorial judgment, independent of record age. If labels change in configuration, update records and future interface text together.
5. Choose releaseType `store-pick`, `rare-allocated`, `new-release`, or `standard`. Store-pick links must match the same bottle and retailer.
6. Set availability to `reported-available`, `limited`, `unavailable`, or `unknown`. Use a nonnegative integer for estimatedQuantity or explicit null for unknown. Zero means zero, not unknown. Enter known limits, loyalty requirements or lottery conditions in purchaseConditions; use [] when unknown.
7. Expire an outdated finding with `status: "expired"`; do not change its timestamp. Freshness does not automatically remove records. Phase 2 must visibly warn about stale records and allow excluding them.
8. To remove a retailer, bottle, source or pick, first update/remove referencing sightings and events. Run validation before committing. Invalid datasets are rejected as a whole with errors so the UI can show a safe error state.

Fresh means age <=24 hours; Aging means >24 and <=72 hours; Stale means >72 hours. Exactly 24 hours is Fresh. Invalid/future timestamps produce Unknown in the display helper and fail validation where required. Change thresholds in config.js; use increasing nonnegative hours. Demo dates are fixed and will become stale naturally. Tests use a fixed clock to check each boundary.

Additional metros can use a new metroId and location records without changing the model. Unknown optional details must be displayed as unknown, never inferred. Public listing UI must carry demo labels, confidence reasons, verification time, quantity and conditions, and “Availability can change quickly—call before traveling.” That UI is Phase 2 work.

## Remaining phases

Phase 2 connects this model to nearby search, a Columbus map, filters, and activity. Phase 3 adds details, methodology and full owner-facing pages. Phase 4 performs end-to-end QA. Existing editorial pricing and the local journal are legacy features, not part of this dataset. The mode switch affects the new loader only until Phase 2 replaces the legacy shortlist.
