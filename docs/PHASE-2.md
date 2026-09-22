# Phase 2: search, map and recent activity

## What changed

The home page now reads the validated Phase 1 dataset and shows a Columbus-area hunting dashboard. The previous editorial homepage is preserved at `editorial.html`, using its existing script, styling, images, price examples and journal. No accounts, submissions, payments or inventory integration were added.

Use `npm run dev`, then open `http://localhost:5173`. No build step or package installation is required. The preview server now serves JSON with the correct content type.

Search covers bottle name, producer, retailer and store-pick name. Filters combine release type, bottle type, retailer, city, straight-line distance, verification age, confidence, estimated availability, minimum estimated quantity and stale exclusion. Results and map markers share the same filtered findings. Recent activity sorts by verification time, newest first. Expired records stay out of results; stale active records remain unless the user excludes them.

## Location and map

Browser location is requested only after the user presses **Use my location**. Coordinates stay in page memory, are not persisted or sent to an application backend, and are used to calculate straight-line distance locally. Denial, unavailable location and timeout leave the ZIP/community fallback available. Manual selection overrides pending browser requests. The pilot lookup in `lib/search.js` contains representative ZIPs for nine Columbus-area communities; it is not a comprehensive postal geocoder. Unknown ZIPs are rejected explicitly. Centers are approximate, not ZIP boundaries.

Leaflet 1.9.4 JavaScript and CSS are vendored under `vendor/` with their license. This small map-only dependency provides pan, zoom, touch and keyboard support without a build tool. Custom text markers avoid external icon dependencies. Colocated findings share a marker with accessible individual choices. Selected markers and cards stay synchronized. Mobile has List/Map controls; desktop shows both.

Map tiles load from OpenStreetMap with visible attribution and ordinary browser caching/referrer behavior. Only visible tiles are requested; there is no bulk download, prefetch, proxy or offline tile cache. Configure the tile URL and attribution in `config.js` for a different permitted provider. OSM is a best-effort service, not a guaranteed production SLA. Network requests to the tile provider reveal the browser's IP and viewed map area. Opening a directions link leaves the site for Google Maps; the link contains the destination only.

References: [Leaflet quick start](https://leafletjs.com/examples/quick-start/), [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/). If map code or tiles fail, the list and directions remain usable. If data fails validation, HTTP, JSON parsing or a 10-second timeout, the page shows an error with Retry and does not substitute demo data.

## Data and truthfulness

All bundled findings remain fictional and visibly marked DEMO on cards and selected-map details. Their fixed verification timestamps age naturally. Demo pins and distances refer to community centers, and their directions explicitly go to those centers—not fictional stores. No demo telephone numbers are invented.

For production records, directions use the retailer's address. Optional `latitude` and `longitude` on a retailer allow a more precise pin and distance; supply both or neither, and validate their ranges. Otherwise the location's community coordinates are used with an approximate-distance label. Add accurate retailer coordinates before using pins for actual trip planning. Unknown quantities, purchase conditions and phone numbers remain explicit. Source links appear only when supplied. Source confidence is separate from freshness and includes the assigned reason.

The page recalculates freshness every minute without fetching new inventory or forcing map movement, preserving selected-finding controls and directions-link focus. An open map-popup choice interaction defers this refresh until the user leaves that control.

## Verification

- `npm test`: 17 tests cover Phase 1 validation/freshness, existing editorial filtering and new location, search, combined filters, distance, stale handling, ordering, directions and request-timeout logic.
- `node scripts/validate-data.mjs`: checks both datasets.
- `node scripts/verify-phase2.mjs`: browser checks using an available Playwright installation and Microsoft Edge. Optionally pass an absolute Playwright module path. Includes map/card keyboard selection, shared-location choices, filters, reset, location success/denial, invalid ZIP, map-library failure, malformed data, retry, empty datasets, five widths (320–1440px), 200% text and reduced-motion mode. Browser location success/denial is mocked for repeatability; real permission prompts still depend on the browser and HTTPS/localhost.
- Screenshots go to ignored `test-results/`. The Phase 2 desktop/mobile screenshots were visually reviewed. Existing editorial code is preserved; its separate browser script can be pointed to `/editorial.html` using the optional URL argument.

For static hosting, publish only the website files: `index.html`, `editorial.html`, `dashboard.css`, `dashboard.js`, `app.js`, `styles.css`, `data.js`, `config.js`, `lib/`, `data/`, `vendor/` and `assets/`. Do not publish repository uploads or development files. This phase does not deploy or merge automatically.

## Still manual or deferred

Production data is empty. No retailer stock, release schedule or price has been verified by this implementation. The owner must maintain permitted, attributed records. Retailer directories/detail routes, sighting-detail routes and full methodology/About pages belong to Phase 3; a concise trust explanation is already on the dashboard. Full Phase 4 QA and visual/motion refinements remain separate work.
