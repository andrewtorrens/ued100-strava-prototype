# UED100 Assessment 2 — Strava redesign prototype

Front-end prototype of the Strava web feed and activity pages, redesigned to implement the recommendations and technical specifications from my Assessment 1 analysis.

- **Live site:** https://andrewtorrens.github.io/ued100-strava-prototype/
- **Repository:** https://github.com/andrewtorrens/ued100-strava-prototype
- **Figma interactive prototype (wireframe flow):** [open in Figma](https://www.figma.com/proto/fHIHaxP1ypCoPnNtwuPql6/UED100-A2-%E2%80%93-Strava-redesign-wireframes-%E2%80%93-Andrew-Rose?node-id=1-2&p=f&t=qNWwwtVnNzBh3Cel-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2)
- **Figma wireframes (canvas):** (https://www.figma.com/design/fHIHaxP1ypCoPnNtwuPql6/UED100-A2-%E2%80%93-Strava-redesign-wireframes-%E2%80%93-Andrew-Rose?node-id=0-1&p=f)
- **Wireframe exports:** `docs/wireframes/`

## Running it

The pages load data with `fetch()` and use ES modules, which browsers block on `file://`. Use the live site above, or serve the folder locally:

- **VS Code:** install the *Live Server* extension, right-click `index.html` → *Open with Live Server*
- **or terminal:** `python -m http.server 8000`, then open http://localhost:8000

## Design process

1. **Assessment 1 analysis** identified two user groups (free users, subscribers), two UI recommendations and the front-end technical specifications.
2. **Figma wireframes** (low fidelity, four frames: feed desktop/mobile, activity collapsed/expanded). Orange annotations link each element to an A1 finding. The Figma prototype demonstrates the key flow: Feed → Activity → Show advanced data.
3. **HTML/CSS/JS prototype** built in VS Code, committed incrementally (see commit history).
4. **Testing and iteration** recorded in the testing log below.

## Structure

```
index.html            Activity feed (scannable free-user view, in-feed promo, load more)
activity.html         Activity detail (key stats first, advanced data on demand, privacy, social)
contact.html          Contact/support form with client-side validation
css/styles.css        Single stylesheet: tokens → base → layout → nav → components → utilities
js/nav.js             Shared: hamburger menu, dark-mode toggle, out-of-scope links
js/utils.js           Shared module: data fetch, formatting, avatar/icon helpers, safe element helper
js/feed.js            Feed rendering, loading/error states, paging, in-feed promo
js/activity.js        Detail page data binding + features
js/contact.js         Form validation + success state
data/activities.json  12 sample activities (stands in for an API)
assets/img/route.webp Route map image (compressed WebP, start point blurred)
assets/icons/         Generic single-colour SVG icons, applied as CSS masks
docs/wireframes/      Figma wireframe exports (PNG)
```

## Scope

The prototype covers the two pages analysed in Assessment 1 plus a support form. There is no backend: nothing is saved or sent, and there is no login. All athletes, clubs and data are fictional.

**Visual-only (for realism, no behaviour):** Training, Maps and Challenges nav links; search, notifications and upload icons; the "Following" feed filter; profile card, streak and training log; clubs; suggested-friend Follow buttons; footer links.

## A1 → prototype traceability

| A1 finding / spec | Implementation | Evidence |
|---|---|---|
| Promotions clutter the feed (conversion vs retention) | Sponsored card in the feed with dismiss ✕ and a frequency cap; sidebar in `<aside>` | TODO |
| Dense telemetry = abrupt context shift | Progressive disclosure toggle on activity page; social kept on page | TODO |
| Privacy controls must be easy to find (Global Heatmap risk) | Visible map-privacy control, privacy zone on by default; route image has the start point blurred | TODO |
| Semantic landmarks | `header` / `nav` / `main` / `article` / `aside`, h1–h3 outline, skip link | TODO: axe/WAVE |
| Grid + Flexbox, 3 → 1 columns | Mobile-first Grid, breakpoints 48rem / 75rem | TODO: 375 / 768 / 1440 screenshots |
| Custom properties, dark mode | Tokens in `:root`, `[data-theme="dark"]` override | TODO |
| Orange contrast for outdoor use | Brand `#FC4C02` is 3.40:1 on white (fails AA text) → `#C73D00` (5.13:1) for text, dark text on orange buttons | TODO: checker screenshot |
| Infinite scroll traps keyboard users | "Load more" button | TODO |
| Loading / error states | Skeleton cards, error notice with retry; specific message if opened from `file://` | TODO: throttled-network screenshot |
| Charts need text alternatives | SVG elevation chart + text summary | TODO |
| Lazy load, compress images, reserve dimensions | `loading="lazy"`, width/height + `aspect-ratio`; map PNG 1.85 MB → WebP 207 KB (−89%) | TODO: Lighthouse CLS |
| Treat user input as text (XSS) | `textContent` only; activity 3 contains a test `<img onerror>` comment | TODO: screenshot |
| CSP as backup | CSP `<meta>` on every page, no inline/third-party scripts | |
| Minimise third-party code (Retire.js point) | Zero dependencies; nothing to scan | |

## Technical decisions

- **No framework / no Bootstrap:** A1 specified hand-built Grid and custom properties; avoids unused CSS and third-party code (security + performance link from A1).
- **ES modules** for shared helpers (`utils.js`); `nav.js`/`contact.js` are plain scripts as they have no imports.
- **Icons as CSS masks:** one set of SVG files, coloured with `currentColor`, so they follow light/dark themes without inline SVG in JavaScript.
- **Initials avatars** instead of photos: no real people's images in a public repository.
- **Light theme by default:** considered following the OS `prefers-color-scheme` setting (better for user choice) but chose light to match Strava's brand presentation; users can switch with the toggle and the choice is remembered.
- **CSP via `<meta>`:** blocks inline scripts, so a saved dark-mode preference applies just after load (brief light flash). Production would set CSP as an HTTP header.
- **Unminified source:** kept readable for assessment; production would add a build step to minify CSS/JS.

## Testing log

| Date | Test | Result | Change made |
|---|---|---|---|
| 15 Nov 2026 | Image weight | Map screenshot 1.85 MB PNG | Converted to WebP (207 KB) |
| | Lighthouse (mobile) | | |
| | axe DevTools | | |
| | Keyboard-only walkthrough | | |
| | Chrome / Firefox / Safari / Edge | | |
| | User test (n = ) | | |

## Credits


## AI use

Initial layout scaffold (HTML structure, responsive CSS, nav, data loading, sample data, icons) and reference wireframe layouts were generated with Claude, then reviewed, edited and rebuilt by me in VS Code and Figma. A1-driven features, testing and write-up are my own work. See the AI Statement of Acknowledgement in the submission.
