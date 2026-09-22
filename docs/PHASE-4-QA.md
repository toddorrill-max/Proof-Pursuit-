# Phase 4 — quality review

Reviewed September 22, 2026 against the original Phase 4 prompt. The functional demo passes the checks below after fixes. This is not a production launch or a certification of real inventory. Visual redesign and motion work remain separate.

## Pass/fail checklist

| Requirement | Result | Evidence / scope |
| --- | --- | --- |
| Mobile and desktop responsiveness | PASS | Dashboard and supporting pages at 320, 390, 768 and 1440 CSS pixels with 200% root text; prior suites also cover 1024 pixels and the editorial page. Mobile map/list switch works. |
| Search and filters | PASS | Case/space normalization, bottle/producer/retailer/pick search, combined filters, all filter controls, reset, empty matches and newest-first sorting. |
| Geolocation states | PASS | Granted browser permission with test coordinates; simulated denied, unavailable, timeout and late response. Manual community selection wins over a pending response. No automatic location request or persisted coordinates. |
| Map/list synchronization | PASS | Keyboard marker selection, card selection, filtering, grouped markers and selected details; automatic aging preserves marker focus and the map viewport. |
| Directions | PASS | Demo links explicitly target community centers. Production address encoding tested, including special characters. External navigation itself was not exercised as a real trip. |
| Freshness | PASS | Exact 24/72-hour boundaries, invalid/future dates, stale filtering and expired detail records. Focused detail links no longer freeze age labels. |
| Confidence, source and quantity | PASS | Text labels, reasons and source type shown. Zero differs from unknown; source/telephone links work. Confidence is not described as a guarantee. |
| Empty/error states | PASS | Invalid/network/HTTP/JSON/timeout data failures, retry, missing records, empty production without demo fallback, map-library failure and tile failure. |
| Accessibility | PASS within tested scope | Keyboard flows, focus preservation, text resizing and 18 axe-core 4.10.3 scans covering nine routes at two widths: zero reported violations. Manual assistive-technology review remains open. |
| Performance | PASS for local demo | No added production dependency or decorative dashboard image. Unchanged markers are reused. One local sample: 232 ms to DOMContentLoaded; 211,422 decoded bytes across 11 same-origin resources, excluding the HTML document and external tiles. Not a production speed or Core Web Vitals claim. |
| Demo labeling and disclaimers | PASS | Fictional/demo notices, non-visitable stores, community-center directions, call-before-travel reminders, independence and adults-only statements remain visible. |
| Availability language | PASS | Reported/estimated quantities and availability, unknown values, fixed verification timestamps, stale warnings and no reservation/live-inventory claims. Editorial prices remain illustrative and separate. |
| Live production readiness | NOT READY | Production data is deliberately empty; hosting, verified records and real-device checks are outstanding. |

## Issues fixed

- Supporting-page freshness stopped updating when a link had keyboard focus. Refresh now recomputes age and restores that link without scrolling.
- Automatic dashboard refresh could recenter a manually panned map and rebuild unchanged markers. Refresh now preserves the viewport and reuses markers, including an open grouped-marker popup.
- Enlarged text overflowed narrow-screen filters and the results/map headings. Controls now stack or wrap. The skip link remains fully offscreen until focused even when its text wraps.
- Collection cards skipped a heading level, and the dashboard used an incorrectly nested complementary landmark. Heading levels and map-region semantics are corrected.
- Two editorial heading numbers failed contrast. Their text color now passes the automated contrast check.

## Verification

- 19 Node tests passed; demo and production data validation passed.
- Phase 2, Phase 3 and editorial browser suites passed. These cover 19 internal links, keyboard navigation, reduced-motion mode, data failures and five standard viewport widths.
- New Phase 4 browser suite passed: all filter controls, location races, focused freshness transitions, marker/viewport preservation, 32 enlarged-text route/width combinations, mobile map, tile failure, empty production, safe text rendering and quantity semantics.
- Accessibility scans included expanded filters, WCAG 2 A/AA, 2.1 A/AA, 2.2 AA and axe best-practice rules. The generated report also retains checks requiring manual review; zero automated violations is not a claim of full WCAG conformance.
- Desktop and enlarged mobile screenshots were inspected. External basemap tiles are best-effort; the application supplies selectable markers and list/directions fallbacks when tiles are unavailable.

Run the existing local server, then:

```sh
npm test
node scripts/validate-data.mjs
node scripts/verify-phase2.mjs
node scripts/verify-phase3.mjs
node scripts/verify-browser.mjs
node scripts/verify-phase4.mjs
node scripts/audit-accessibility.mjs
```

Browser scripts require Playwright and Microsoft Edge. An absolute Playwright module path may be passed first. The accessibility script additionally accepts an absolute path to axe.min.js second (tested with axe-core 4.10.3). These are test tools, not website runtime dependencies. Reports and screenshots go to ignored test-results/.

## Remaining manual work and limitations

- The owner must gather permitted source information, verify each real claim, enter sources/timestamps/conditions, validate JSON, and expire or remove records. Opening a page never re-verifies stock. Weekly maintenance can leave most records stale.
- The lookup recognizes nine named communities and one representative ZIP each. It is not a general ZIP geocoder. Distances are straight-line; demo pins and retailers without verified coordinates use community centers.
- Browser location needs HTTPS outside localhost. Test actual permission prompts on iOS Safari and Android Chrome and review keyboard/screen-reader behavior with NVDA or VoiceOver before launch. This audit used headless Microsoft Edge on Windows.
- OpenStreetMap tiles and external source/directions sites require network access. Production hosting, caching/compression, slow-network performance and real-world map capacity have not been measured.
- There is no live inventory feed, account system, alert service, public submission queue or database. The older editorial journal is stored only in that browser.
- Phase 4 is a draft change stacked on Phase 3. No branches have been merged and no production deployment was performed.
