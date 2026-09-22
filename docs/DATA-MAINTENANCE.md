# Owner maintenance guide

The schema below powers the dashboard and Phase 3 supporting pages. See [Phase 2](PHASE-2.md) for map behavior and [Phase 3](PHASE-3.md) for page routes. The legacy editorial price shortlist is preserved separately at editorial.html. No accounts, inventory integrations, or deployment are included.

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
| retailers | name, address, locationId | phone, hours, url (attribution), latitude/longitude pair; null means unknown |
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
7. Expire an outdated finding with `status: "expired"`; do not change its timestamp. It disappears from active lists but its finding-detail URL remains readable with an expired warning. Freshness does not automatically remove active records; stale warnings and an exclusion filter remain visible.
8. To remove a retailer, bottle, source or pick, first update/remove referencing sightings and events. Run validation before committing. Invalid datasets are rejected as a whole with errors so the UI can show a safe error state.

Fresh means age <=24 hours; Aging means >24 and <=72 hours; Stale means >72 hours. Exactly 24 hours is Fresh. Invalid/future timestamps produce Unknown in the display helper and fail validation where required. Change thresholds in config.js; use increasing nonnegative hours. Demo dates are fixed and will become stale naturally. Tests use a fixed clock to check each boundary.

Unknown optional details are displayed as unknown, never inferred. All public finding cards and details carry demo labels, confidence reasons, verification time, quantity and conditions, and “Availability can change quickly—call before traveling.”

## Practical editing checklist

- Keep IDs stable so saved links such as `finding.html?id=sighting-0` and `retailer.html?id=demo-columbus` continue working. Replacing an ID breaks that record's old link; removing it produces a clear not-found page.
- For a new finding, copy the shape of a sighting in the demo file, give it a new ID, and link existing bottle, retailer and source IDs. Set the actual observed verification time, evidence-based confidence reason, quantity (or null), known conditions (or []), and status. Validate before saving a checkpoint.
- Use null or omit optional proof, size, notes, hours, phone and barrel identifiers when unknown. Hours must be plain text, such as a supplied weekly schedule, and should state any known exceptions. Phone numbers must contain 7–15 digits, optionally formatted with spaces, plus, parentheses or dashes; put extension instructions in notes rather than the dialing field.
- Store a permitted attribution URL in `sources[].url`; production requires one. `retailers[].url` optionally credits retailer/address/hours information. Only HTTP(S) links are accepted. Do not fabricate a URL or treat a source page as proof of current stock.
- Optional retailer latitude/longitude must be supplied as a valid pair. Otherwise the interface identifies community-center pins and distances as approximate. Do not put fictional coordinates into production.
- Run `node scripts/validate-data.mjs`, then `npm test`. Fix all validation errors; a bad dataset is not partially published. Open the dashboard and affected detail pages before committing.
- Only change `dataConfig.mode` to `production` after adding genuinely verified production records with `demo: false`. Never relabel fictional demo records as real. An empty production dataset is valid and displays an honest empty state.

## Change branding and freshness

Edit `brand` in `config.js` for the name, tagline, metadata and letter mark. Shared page headings and navigation use the configured brand name. If replacing a visual logo, update `assets/mark.svg` separately. Edit `freshnessRules.freshHours` and `agingHours` in the same file; use finite, increasing hours. The dashboard and methodology page read these settings. Changing confidence labels also requires matching the stored records and reviewing the plain-language level definitions in `pages.js`.

## Add another Ohio metro later

The pilot remains focused on Columbus. For a future approved expansion, add locations with a new stable `metroId` (for example `cincinnati-oh`) and verified city, state, ZIP and coordinates. Link the new retailers to those location IDs, then add bottles, sources and sightings normally. The model already supports multiple metros. Extend the owner-maintained `communities` lookup in `lib/search.js` for any new ZIP/community choices, update the site's coverage labels and map starting area, and test distance filters and directions. A location record alone does not establish actual coverage or stock. Do not bulk-import unverified findings.

## Remaining phases

Phases 1–3 are implemented in their review branches. Phase 4 remains the comprehensive end-to-end audit; visual and motion refinement follow later. Existing editorial pricing and the local journal are legacy features on editorial.html, not part of this dataset. The mode switch affects dashboard/supporting data views; the legacy editorial examples remain explicitly illustrative.
