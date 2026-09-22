# Master audit and visual refinement

September 22, 2026. Builds on the completed Phase 4 quality review.

## Master-prompt audit

The existing implementation covers location permission and manual lookup, search and filters, recent activity, map/list views, required trip-planning fields, supporting routes, configurable freshness/confidence, editable data, owner guidance, demo separation and disclaimers.

The audit identified three missing homepage sections and an absent header action. Added featured store picks, rare-release highlights, a retailer-area directory and “Find near me.” Featured findings use the active filters and retain all required trust fields. They show at most two records per release type, newest verification first; stale records are not called recently verified. Empty/error states clear featured results. The directory lists only retailers present in the loaded dataset.

The working native JavaScript project is preserved, as requested for an existing implementation. No new dependency, external font, imagery, API or paid service was added. No scraping or public submission functionality was introduced.

## Visual prompts 1–4

- Shared charcoal header, restrained amber action, parchment page and warm oak accents across the dashboard and seven supporting pages.
- Compact typographic hero with a field-note treatment. Location remains the prominent action directly below the demo notice.
- Serif display headings paired with familiar sans-serif data text. Verification dates have stronger weight; status labels retain their explicit Fresh/Aging/Stale wording.
- Cream cards, quiet stale backgrounds, copper selection outlines and readable map controls. Release markers retain text equivalents (Pick / Rare / New).
- Phone layouts stack filters, wrap navigation and keep a clear map/list switch. Narrow screens with enlarged text wrap headings without horizontal scrolling.

## Design tokens

| Token | Value / purpose |
| --- | --- |
| Paper / cream | #f5f0e7 / #f8f0df |
| Charcoal / oak | #24241f / #493627 |
| Copper / amber | #87562e / #82501e |
| Ink / secondary text | #302920 / #685e51 |
| Borders / focus | #d8cdbd / #a25114 |
| Display / interface type | Georgia with serif fallbacks / Arial and Helvetica with sans-serif fallback |
| Spacing | 0.5rem, 1rem, 2rem reusable tokens |
| Radius / shadow | 4px / restrained 3px-by-14px shadow |
| Layout breakpoints | 600px phone; 1000px map/list switch; content capped at 1440px |

Tokens and component rules are in dashboard.css. Existing editorial styling remains separate. Brand name and mark remain in config.js.

## Validation and review limits

19 Node tests pass. Phase 2 and Phase 3 browser suites pass, including 20 internal links. Phase 4 regression checks pass, including 200% root text at 320/390/768/1440 CSS pixels, location failures, map fallback and focused freshness updates. The new visual suite checks homepage filters, trust fields, freshness/focus, directory, near-me navigation and data failure cleanup. Desktop and phone screenshots were inspected.

18 axe-core 4.10.3 scans across nine routes and two widths reported zero violations. This does not replace manual screen-reader and real-device review. No dashboard decorative image or external font download was added.

Run the existing checks from README, plus:

```sh
node scripts/verify-visual.mjs
```

Supply an absolute Playwright module path as the first argument if needed. The script uses installed Microsoft Edge and the local server at port 5173.

This is a visual-review checkpoint, not a public deployment. Data remains fictional; production is empty and verification is manual. Motion prompts remain a separate step after visual review, as specified in the original prompt pack. Domain/brand screening and final launch checks are still outstanding.
