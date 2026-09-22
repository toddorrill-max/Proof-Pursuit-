# Phase 3: supporting pages and owner maintenance

## Pages

| Page | Purpose |
| --- | --- |
| `retailers.html` | Directory of published retailers with addresses, contact/hours fields, distances and directions |
| `retailer.html?id=…` | Retailer details and active findings ordered by verification time |
| `finding.html?id=…` | Bottle/sighting detail: proof, size, release/pick, source attribution, confidence reason, verification, distance/directions, quantity and conditions |
| `store-picks.html` | Active store-pick findings |
| `rare-releases.html` | Active rare/allocated findings |
| `methodology.html` | Freshness, confidence, source labels, quantity, conditions, map limitations and responsible use |
| `about.html` | Scope, manual maintenance, demo status, independence and location/external-service behavior |

The dashboard now links to findings and retailers. `lib/view.js` renders finding cards consistently across the map, dashboard and supporting pages, using text nodes for editable content. Shared navigation connects the seven supporting pages. The earlier editorial page remains available and its brand link returns to the dashboard.

Use the community selector on data pages to calculate approximate straight-line distances. Browser coordinates are not carried into URLs or persisted across pages. Missing optional information is shown explicitly. Fictional/demo records remain conspicuously labeled at the page and card level; their directions go to community centers, not fictional stores. No actual availability, hours, telephone number or proof was invented for the published dataset.

Expired findings are omitted from active collections but resolve through existing detail URLs with an explicit expired/reference-only warning. Deleted or invalid IDs show a not-found state with navigation back. Failed or invalid data shows Retry, without falling back to invented data. Methodology/About content remains available independently of dataset loading.

Optional phone/hours/notes fields are validated, unsafe source URL schemes are rejected, and impossible calendar dates are rejected rather than silently normalized. Source URLs remain part of the editable data model; supplied attribution links appear on detail pages.

## Owner workflow

See [the owner maintenance guide](DATA-MAINTENANCE.md) for adding, editing, expiring/removing records, keeping IDs stable, changing branding and freshness, switching demo/production, source attribution, and preparing future metro expansion. No public accounts or submissions were added. Production data remains empty.

## Validation

- 19 Node tests pass, including the new expired-detail and optional-field/calendar/link checks.
- Both datasets pass schema validation.
- `scripts/verify-phase3.mjs` checks seven pages and 19 internal links, retailer/finding navigation, required trust fields, source/phone links, location distances, release collections, missing/expired records, failed-data retry, methodology without data access, keyboard links, 320/390/768/1440px layouts and 200% text.
- Phase 2 and legacy editorial browser suites pass after shared-card/navigation changes.
- Finding-detail desktop and mobile screenshots were visually reviewed. All browser fixtures remain test-only; demo data was not modified.

Run `npm run dev`, then `node scripts/verify-phase3.mjs` with Playwright and Microsoft Edge available; an absolute Playwright module path may be passed as the first argument. Screenshots are under ignored `test-results/`.

This checkpoint is saved separately from Phase 2 and is not merged or publicly deployed. Phase 4 remains the comprehensive audit; these focused checks do not claim formal WCAG conformance or verified retailer availability.
