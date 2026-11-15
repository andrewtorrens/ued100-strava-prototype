# UED100 Assessment 2 — Strava redesign prototype

Front-end prototype of the Strava web feed and activity pages, redesigned to implement the recommendations and technical specifications from my Assessment 1 analysis.

**Repository:** _add GitHub link_
**Figma wireframes:** _add link_ (screenshots in `docs/wireframes/`)

## Running it

The pages load data with `fetch()`, which browsers block on `file://`. Serve the folder locally:

- **VS Code:** install the *Live Server* extension, right-click `index.html` → *Open with Live Server*
- **or terminal:** `python3 -m http.server 8000`, then open http://localhost:8000

## Structure

```
index.html          Activity feed (free-user scannable view, promos, load more)
activity.html       Activity detail (key stats first, advanced data on demand, privacy, social)
contact.html        Contact/support form with client-side validation
css/styles.css      Single stylesheet: tokens → base → layout → nav → components → utilities
js/nav.js           Shared: hamburger menu, dark-mode toggle, out-of-scope links
js/utils.js         Shared module: data fetch, formatting, safe element helper
js/feed.js          Feed rendering, loading/error states, paging
js/activity.js      Detail page data binding + feature hooks
js/contact.js       Form validation + success state
data/activities.json  12 sample activities (stands in for an API)
assets/img/         Route map images (SVG)
```

## Scope

Prototype covers the two pages analysed in Assessment 1 plus a support form. Other Strava sections (Training, Maps, Challenges) appear in the nav for realism but are disabled. There is no backend: nothing is saved or sent, and there is no login.

## A1 → prototype traceability

| A1 finding / spec | Implementation | Evidence |
|---|---|---|
| Promotions clutter the feed (conversion vs retention) | Capped, dismissible promo cards in `<aside>` | TODO |
| Dense telemetry = abrupt context shift | Progressive disclosure toggle on activity page; social kept on page | TODO |
| Privacy controls must be easy to find (Global Heatmap risk) | Visible map-privacy control, privacy zone on by default | TODO |
| Semantic landmarks | `header` / `nav` / `main` / `article` / `aside`, h1–h3 outline, skip link | TODO: axe/WAVE |
| Grid + Flexbox, 3 → 1 columns | Mobile-first Grid, breakpoints 48rem / 75rem | TODO: 375 / 768 / 1440 screenshots |
| Custom properties, dark mode | Tokens in `:root`, `[data-theme="dark"]` override | TODO |
| Orange contrast for outdoor use | Brand `#FC4C02` is 3.40:1 on white (fails AA text) → `#C73D00` (5.13:1) for text, dark text on orange buttons | TODO: checker screenshot |
| Infinite scroll traps keyboard users | "Load more" button | TODO |
| Loading / error states | Skeleton cards, error notice with retry | TODO: throttled-network screenshot |
| Charts need text alternatives | SVG elevation chart + text summary | TODO |
| Lazy load, reserve dimensions | `loading="lazy"`, width/height + `aspect-ratio` | TODO: Lighthouse CLS |
| Treat user input as text (XSS) | `textContent` only; activity 3 contains a test `<img onerror>` comment | TODO: screenshot |
| CSP as backup | CSP `<meta>` on every page, no inline/third-party scripts | |
| Minimise third-party code (Retire.js point) | Zero dependencies; nothing to scan | |

## Technical decisions

- **No framework / no Bootstrap:** A1 specified hand-built Grid and custom properties; avoids unused CSS and third-party code (security + performance link from A1).
- **ES modules** for shared helpers (`utils.js`); `nav.js`/`contact.js` are plain scripts as they have no imports.
- **CSP via `<meta>`:** blocks inline scripts, so the saved dark-mode preference applies after load (brief light flash). Production would set CSP as an HTTP header and could avoid this.

## Testing log

| Date | Test | Result | Change made |
|---|---|---|---|
| | Lighthouse (mobile) | | |
| | axe DevTools | | |
| | Keyboard-only walkthrough | | |
| | Chrome / Firefox / Safari / Edge | | |
| | User test (n = ) | | |

## AI use

Initial layout scaffold (HTML structure, responsive CSS, nav, data loading, sample data) generated with Claude and reviewed/edited by me. A1-driven features, testing and write-up are my own work. See AI Statement of Acknowledgement in the submission.
