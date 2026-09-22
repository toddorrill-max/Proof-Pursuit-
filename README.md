# Proof Pursuit — Columbus hunting dashboard

A mobile-first Columbus bourbon-hunting dashboard using owner-maintained JSON data. All bundled findings are fictional demos; production starts empty. The prior editorial website remains at `editorial.html`.

## Run

Use Node.js 20 or newer:

```sh
npm run dev
```

Open http://localhost:5173. No package installation or build step is required. JavaScript modules and JSON loading require HTTP; do not open index.html directly from disk. The server binds to localhost and accepts an optional PORT environment variable.

## Check

```sh
npm test
node scripts/validate-data.mjs
# While the local server runs, with Playwright and Microsoft Edge available:
node scripts/verify-phase2.mjs
node scripts/verify-phase3.mjs
node scripts/verify-browser.mjs
```

Browser scripts accept an optional absolute Playwright module path as the first argument. The editorial browser script accepts its page URL as the second argument and defaults to `/editorial.html`. Tests use simulated browser location outcomes; permission prompts depend on the user's browser. Screenshots are written to ignored `test-results/`.

## Edit and maintain

- `config.js`: centralized brand name, tagline, metadata, map provider, dataset mode, confidence labels and freshness thresholds.
- `data/demo.json` / `data/production.json`: separate demo and real datasets.
- [Data schema and owner guide](docs/DATA-MAINTENANCE.md): add, edit, expire and remove records.
- [Phase 2 guide](docs/PHASE-2.md): functionality, location approximation, map policy, validation and remaining limitations.
- [Phase 3 guide](docs/PHASE-3.md): retailer/finding pages, release collections, methodology, About, and verification results.
- `pages.js`, `pages.css`, `lib/view.js`: supporting pages, shared navigation and shared finding cards.
- `dashboard.js`, `dashboard.css`, `lib/search.js`, `lib/hunt-map.js`: dashboard and map implementation.
- `lib/data-model.js`: safe loading, validation and freshness calculations.
- `editorial.html`, `app.js`, `styles.css`, `data.js`: preserved legacy editorial experience, including illustrative prices and a browser-local journal.

Fresh is up to 24 hours old, Aging is over 24 through 72 hours, and Stale is over 72 hours. Fixed demo timestamps age naturally. Source confidence is editorial judgment, not an availability guarantee. Demo directions go only to community centers. Production directions use real retailer addresses; optional verified retailer coordinates improve pins and distance estimates.

## Map dependency

Leaflet 1.9.4 is vendored in `vendor/` with its license. It supplies accessible map controls without adding a build tool. Tiles are requested directly from OpenStreetMap with attribution and normal browser caching. See the [tile policy](https://operations.osmfoundation.org/policies/tiles/) before production hosting. All findings remain usable in list view if map code or tiles fail. No paid API key is required.

## Deployment

This branch has not been deployed. Publish only these static website files: `index.html`, `editorial.html`, `retailers.html`, `retailer.html`, `finding.html`, `store-picks.html`, `rare-releases.html`, `methodology.html`, `about.html`, `dashboard.js`, `dashboard.css`, `pages.js`, `pages.css`, `app.js`, `styles.css`, `data.js`, `config.js`, `lib/`, `data/`, `vendor/` and `assets/`. Do not publish repository uploads, tests, or development files. Use HTTPS for browser geolocation outside localhost. No server database or live inventory feed is included.

## Progress

Phase 1 provides the validated data foundation. Phase 2 connects it to nearby search, an interactive map, filters and recent activity. Phase 3 adds the retailer directory, retailer/finding details, store-pick and rare-release views, methodology and About pages, and expanded owner guidance. Comprehensive Phase 4 QA and visual/motion work remain later phases. Accounts, alerts, public submissions, database integration, additional metros and optional price intelligence remain deferred.

## Existing image provenance

The editorial page uses the previously generated, unbranded whiskey-bar photograph in `assets/whiskey-hero.webp` (original PNG retained). No new imagery was generated for Phase 2. The dashboard uses no decorative image downloads or external fonts.
