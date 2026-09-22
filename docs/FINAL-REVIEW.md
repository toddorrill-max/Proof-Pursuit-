# Final build review and launch handoff

September 22, 2026. Version one is implemented as a working demo. It has not been publicly deployed and is not a live inventory service.

## Completed

Dashboard, permission-based location and community lookup, filters, map/list views, recent activity, store-pick and rare-release collections, retailer directory/details, finding details, methodology, About and the retained editorial guide. Required trust fields, freshness labels, demo safeguards and owner-editable data remain intact.

The visual stage adds the homepage highlights, directory links and shared responsive styling. The final stage adds restrained motion and a repeatable static deployment build without a new runtime dependency.

## Motion inventory

| Component | Feedback |
| --- | --- |
| Buttons, search/location fields, cards | 120 ms background, border and shadow transitions |
| Changed count or permission/map status | One 180 ms inset border highlight |
| Changed result sets and mobile view switch | One 180 ms highlight; content appears immediately |
| Freshness crossing a threshold | One 180 ms highlight only when the label changes |
| Newly selected marker | One 180 ms outer shadow; no movement or scale |

Tokens: --motion-fast:120ms, --motion-feedback:180ms and --motion-ease:ease-out in dashboard.css. Feedback lives in lib/motion.js. Unchanged refreshes do not replay it. There are no loops, spinners, countdowns, parallax or autoplay media. Reduced-motion preferences suppress feedback and cancel active animations, even when changed while the page is open.

Text remains fully opaque. An initial fade temporarily failed contrast and was replaced with border feedback.

## Final verification

- 19 Node tests passed; both datasets validate.
- Phase 2, Phase 3, Phase 4, visual and editorial browser suites passed.
- Motion suite passed at 4x CPU slowdown: immediate filtering, preserved focus, brief nonlooping animations, reduced-motion cancellation and mobile switching.
- The packaged dashboard and detail navigation passed without missing local modules or data.
- 18 axe-core 4.10.3 scans across nine routes at desktop/phone widths passed after the contrast fix.
- Layout regression covers 320, 390, 768, 1024 and 1440 CSS-pixel widths, plus 200% root text at four widths. Desktop and phone screenshots were inspected during the visual stage; motion changes no geometry.

These local Windows/Edge checks do not constitute full WCAG certification or real-device performance measurements. iOS/Android permission prompts and NVDA/VoiceOver still need manual review. External map tiles and source/directions sites depend on network access.

## Build and publish

1. Run npm test and node scripts/validate-data.mjs.
2. Run npm run build. This creates dist/ with 29 static files, approximately 460 KB uncompressed at this checkpoint.
3. Preview with a static HTTP server. Opening index.html directly from disk does not support the modules/JSON workflow.
4. Upload the contents of dist/ to the chosen static host with HTTPS, preserving folders. The supplied ZIP has index.html at its root.
5. Test the public URL: location denial and manual entry, search/reset, mobile map/list, finding details, directions and map fallback.

The build validates data, copies only declared site files and runtime folders, and refuses unexpected files in an existing dist folder. It excludes documentation, tests, development scripts and the original large PNG. The selected data mode is preserved.

## Owner decisions before real-data launch

- Choose a hosting account and domain. No hosting, DNS or public deployment was changed.
- Review the public brand name and domain. Domain availability and trademark screening have not been performed.
- Supply permitted, verified retailer/source information. Populate data/production.json, validate it, change dataConfig.mode in config.js to production and rebuild. Production is deliberately empty now.
- Maintain timestamps and purchase conditions manually; expire/remove records as needed. Weekly updates naturally leave reports stale.
- Test actual mobile browsers and assistive technology. Confirm external map-service usage requirements for the intended traffic.

The package is ready to review as a clearly labeled fictional demo. Its records must not be relabeled as verified stock. Accounts, alerts, public submissions, automated feeds, databases and additional metros remain outside version one.
