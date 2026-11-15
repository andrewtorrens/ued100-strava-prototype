# UED100 Assessment 2 — Strava redesign prototype

Front-end prototype of the Strava web feed and activity pages, redesigned to implement the recommendations and technical specifications from my Assessment 1 analysis.

- **Live site:** https://andrewtorrens.github.io/ued100-strava-prototype/
- **Repository:** https://github.com/andrewtorrens/ued100-strava-prototype
- **Figma interactive prototype (wireframe flow):** [open in Figma](https://www.figma.com/proto/fHIHaxP1ypCoPnNtwuPql6/UED100-A2-%E2%80%93-Strava-redesign-wireframes-%E2%80%93-Andrew-Rose?node-id=1-2&p=f&t=qNWwwtVnNzBh3Cel-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2)
- **Figma wireframes (canvas):** (https://www.figma.com/design/fHIHaxP1ypCoPnNtwuPql6/UED100-A2-%E2%80%93-Strava-redesign-wireframes-%E2%80%93-Andrew-Rose?node-id=0-1&t=wRCwnLIWPJrIacLJ-0)
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
assets/icons/         Generic single-colour SVG icons (CSS masks) + favicon
docs/wireframes/      Figma wireframe exports (PNG)
docs/testing/         Testing screenshots (Lighthouse, axe, contrast, responsive, browsers)
```

## Scope

The prototype covers the two pages analysed in Assessment 1 plus a support form. There is no backend: nothing is saved or sent, and there is no login. All athletes, clubs and data are fictional.

**Visual-only (for realism, no behaviour):** Training, Maps and Challenges nav links; search, notifications and upload icons; the "Following" feed filter; profile card, streak and training log; clubs; suggested-friend Follow buttons; footer links.

## A1 → prototype traceability

| A1 finding / spec | Implementation | Evidence |
|---|---|---|
| Promotions clutter the feed (conversion vs retention) | Sponsored cards in the feed: first after 2 activities, then every 5, max 2; dismiss ✕ removes it, stops further promos that visit and is remembered (`feed.js` constants) | Demo: dismiss a promo, reload |
| Dense telemetry = abrupt context shift | Key stats first; "Show advanced data" toggle (`aria-expanded`, remembered); kudos and comments stay on the activity page | Demo: activity page |
| Privacy controls must be easy to find (Global Heatmap risk) | Visibility select + privacy-zone switch directly under the map on your own activities (zone on by default, warning when off, saved per activity); map badge + alt text on others' activities; route image start point blurred | Demo: own activity via "Latest activity" |
| Semantic landmarks | `header` / `nav` / `main` / `article` / `aside`, h1–h3 outline, skip link | axe: 0 violations; Lighthouse Accessibility 100 |
| Grid + Flexbox, 3 → 1 columns | Mobile-first Grid, breakpoints 48rem / 75rem | `docs/testing/responsive-feed-375/768/1440.png` |
| Custom properties, dark mode | Tokens in `:root`, `[data-theme="dark"]` override | axe: 0 violations in dark mode |
| Orange contrast for outdoor use | Brand `#FC4C02` is 3.40:1 on white (fails AA text) → `#C73D00` (5.13:1) for text, dark text on orange buttons | WebAIM: `contrast-brand-orange.png` (fail) / `contrast-text-orange.png` (pass) |
| Infinite scroll traps keyboard users | "Load more" button; focus moves to the first new activity | Keyboard walkthrough (testing log) |
| Loading / error states | Skeleton cards, error notice with retry; specific message if opened from `file://`; activity revealed once loaded | `loading-skeleton.png` (3G throttling), `error-state.png` (data request blocked) |
| Charts need text alternatives | Inline SVG elevation chart (no library) labelled by a text summary: range, highest point, total climbing | axe: 0 violations |
| Lazy load, compress images, reserve dimensions | `loading="lazy"`, width/height + `aspect-ratio`; map PNG 1.85 MB → WebP 207 KB (−89%) | Lighthouse: Performance 100, CLS 0 |
| Treat user input as text (XSS) | `textContent` only; activity 3 has a test `<img onerror>` comment; typed `<script>` posts as text | Demo: activity 3, no script runs |
| Input validation | Contact form: required fields, email format, 20-character minimum, whitespace-only rejected; errors linked by `aria-describedby`, focus to first error | Demo: submit empty form |
| CSP as backup | CSP `<meta>` on every page, no inline/third-party scripts | CSP blocked an injected inline test script |
| Minimise third-party code (Retire.js point) | Zero runtime dependencies; nothing to scan | — |

## Technical decisions

- **No framework / no Bootstrap:** A1 specified hand-built Grid and custom properties; avoids unused CSS and third-party code (security + performance link from A1).
- **ES modules** for shared helpers (`utils.js`); `nav.js`/`contact.js` are plain scripts as they have no imports.
- **Icons as CSS masks:** one set of SVG files, coloured with `currentColor`, so they follow light/dark themes without inline SVG in JavaScript.
- **Initials avatars** instead of photos: no real people's images in a public repository.
- **Light theme by default:** considered following the OS `prefers-color-scheme` setting (better for user choice) but chose light to match Strava's brand presentation; users can switch with the toggle and the choice is remembered.
- **CSP via `<meta>`:** blocks inline scripts, so a saved dark-mode preference applies just after load (brief light flash). Production would set CSP as an HTTP header.
- **Privacy panel only on your own activities:** first version showed a read-only privacy card on everyone's activities; it repeated what the map badge already said, so it was replaced with the badge plus alt text.
- **Reveal-on-load for the activity page:** content stays laid out but invisible until data is filled in, then appears in one step, so nothing jumps (Lighthouse CLS 0.28 → 0).
- **Unminified source:** kept readable for assessment; production would add a build step to minify CSS/JS.

## Testing log

| Date | Test | Result | Change made |
|---|---|---|---|
| 15 Nov 2026 | Image weight | Map screenshot 1.85 MB PNG | Converted to WebP (207 KB, −89%) |
| 15 Nov 2026 | Design review | Privacy card on other athletes' activities repeated the map badge | Card shown only on own activities; badge + alt text elsewhere |
| 15 Nov 2026 | Lighthouse (mobile) | Activity page CLS 0.23–0.28 (Performance 86–88) | Activity hidden until data loaded, then revealed → CLS 0, Performance 100 |
| 15 Nov 2026 | Lighthouse | Console 404 (no favicon); no meta description on activity/contact | Added favicon and descriptions → Best Practices and SEO 100 |
| 15 Nov 2026 | Lighthouse (after fixes) | 100 / 100 / 100 / 100 on all pages | — |
| 15 Nov 2026 | axe-core (WCAG 2.2 AA + best practice) | 0 violations: all pages, light/dark, 375/1440, menu/panels/errors open | — |
| 15 Nov 2026 | Contrast checker (WebAIM) | Brand orange `#FC4C02` 3.4:1 on white fails AA for text | Text uses `#C73D00` (5.13:1, passes); orange kept for buttons/large elements |
| 15 Nov 2026 | Loading / error states | 3G throttling shows skeleton cards; blocking `activities.json` shows error + Try again | — |
| 15 Nov 2026 | CSP | Live Server's injected live-reload script was blocked by the CSP (console error, local only) | None: confirms CSP blocks unknown inline scripts; not present on the live site |
| 15 Nov 2026 | Keyboard-only walkthrough | All features operable; in Vivaldi, Tab appeared to skip the activity title (not reproduced in Chrome, where the title receives focus with a visible outline) | Map made a click/tap link to the activity (kept out of Tab order to avoid a duplicate stop); Firefox retest pending |
| 15 Nov 2026 | Responsive (375 / 768 / 1440) | Layout reflows 3 → 2 → 1 columns; hamburger nav on mobile | — |
| 15 Nov 2026 | Browsers: Vivaldi (Chromium), Firefox | Consistent layout and behaviour | — |
| 15 Nov 2026 | User test (n = 1, informal) | Participant completed tasks; no issues raised | — (small sample noted as a limitation) |

Screenshots: `docs/testing/`

## AI use

I used Claude (Anthropic) during this assessment as follows:

- **Planning:** interpreting the brief and rubric, and mapping my Assessment 1 recommendations and feedback to prototype features.
- **Code:** generating the HTML, CSS and JavaScript scaffold and the feature implementations (load more, kudos, promotion cap and dismiss, progressive disclosure, privacy controls, elevation chart, comments, form validation) to my specifications from Assessment 1. I reviewed and tested each change, directed revisions and committed the work.
- **Design:** generating reference wireframe layouts, which I imported, edited and linked into a prototype flow in Figma.
- **Testing:** running an automated Lighthouse and axe pre-check and fixing the issues it found (layout shift, favicon, meta descriptions), which I applied and verified. I carried out the manual testing (contrast, responsive, loading and error states, keyboard, browsers) and the user test.
- **Writing:** drafting this README and the technical rationale, which I reviewed and edited.

The Assessment 1 analysis, design decisions, Figma work, manual and user testing, and final submission are my own. See the AI Statement of Acknowledgement in the submission.
