# Proof Pursuit — The Bourbon Hunter

A responsive editorial bourbon homepage built with semantic HTML, CSS, and native JavaScript modules. The GitHub repository was empty at the start; this implementation adds no production dependencies or build step.

## Preview

With Node.js 20 or newer installed, open a terminal in this directory:

```sh
npm run dev
```

Open http://localhost:5173. Alternatively run `node server.mjs`. The server binds only to your computer. Set `PORT` to change the default port. Serve through HTTP; JavaScript modules do not work by opening index.html directly from disk.

## Files

- `index.html`: homepage sections, accessible forms, navigation, guides, and journal dialog.
- `styles.css`: charcoal/amber design, typography, responsive layouts, keyboard focus and reduced-motion support.
- `data.js`: illustrative bottle dataset, filter logic, and Ohio guide content.
- `app.js`: filter controls, tier shortcuts, mobile navigation, guide steps, and local tasting-note storage.
- `assets/whiskey-hero.webp`: optimized generated photography used by hero and barrel feature.
- `assets/whiskey-hero.png`: original generated image.
- `assets/mark.svg`: vector favicon.
- `server.mjs`: dependency-free local preview server.
- `tests/filters.test.js`: filtering behavior tests.
- `scripts/verify-browser.mjs`: optional Playwright browser checks; requires Playwright and Microsoft Edge.

## Checks

```sh
npm test
# With the local server running and Playwright available:
node scripts/verify-browser.mjs
```

The browser script can also take an absolute Playwright module path. It checks filters, empty results, reset, tier shortcuts, Ohio steps, journal persistence, images, mobile navigation, overflow at 320/390/768/1024/1440 px, and browser errors. Screenshots are saved under ignored `test-results/`.

## Content boundaries

Prices and trends are clearly labeled illustrative examples, not current valuations. The market strip contains editorial guidance rather than a simulated live feed. The Ohio map is illustrative, with no inventory integration. The site links to official [Ohio Liquor](https://www.ohlq.com/) and [bottle lottery information](https://www.ohlq.com/ohio-bottle-lotteries). Unverified inventory schedules, precise scarcity thresholds, and current club-pick claims from the blueprint were not repeated as established facts. Use a dated, attributed data source before adding live pricing or inventory claims.

The journal saves one editable note locally in the browser; it has no account, cloud synchronization, or server submission. Storage failures produce a visible message. Google Fonts are optional external requests, with Georgia/Arial fallbacks. All imagery is local.

## Image provenance

The prior conversation supplied the written blueprint but exposed no retrievable mockup or image attachments. Fresh photography was generated using the built-in image-generation tool, then converted to WebP for delivery. Final files: `assets/whiskey-hero.png` and `assets/whiskey-hero.webp`.

Final prompt: “Use case: photorealistic-natural. Asset type: wide website hero photograph for Proof Pursuit, a premium bourbon editorial website. A luxurious moody craft whiskey bar and distillery vault, warm amber lighting, unbranded rare bourbon bottles, oak aging barrels in the background, elegant crystal tumbler with amber liquid on rustic dark wooden table. Cinematic commercial photography, realistic glass, deep charcoal shadows, warm copper highlights. Wide landscape composition, main bottle and glass on right half with dark negative space on left for HTML headline. No text, no logos, no watermark.”

No deployment, GitHub push, or live backend is included. Deployable static files are index.html, styles.css, app.js, data.js, and assets/; the local server is for preview only.
