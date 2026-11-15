/* ==========================================================================
   feed.js — feed page (index.html)
   Fetch, loading/error states, safe card rendering, paging ("Load more"),
   kudos, and capped + dismissible in-feed promotions (A1 recommendation 1).
   ========================================================================== */
import {
  fetchActivities, formatDuration, formatPace, formatWhen, el, icon, avatar,
} from './utils.js';

const PAGE_SIZE = 5;
const ME = 'Andy R.'; // the signed-in athlete (sample data)

/* Promotion cap (A1 recommendation 1: capped, not removed — a compromise
   between Strava's conversion goal and free-user retention):
   - first promo after PROMO_FIRST activities, then one every PROMO_INTERVAL
   - never more than MAX_PROMOS in the feed
   - once the user dismisses one, no more are inserted this visit
   - dismissed promos stay hidden on later visits (localStorage) */
const PROMO_FIRST = 2;
const PROMO_INTERVAL = 5;
const MAX_PROMOS = 2;
const DISMISSED_KEY = 'dismissedPromos';

const PROMOS = [
  {
    id: 'nov-200',
    title: 'Ride 200 km in November',
    text: 'Complete 200 km this month to unlock a partner discount and a digital badge.',
    cta: 'Join challenge',
  },
  {
    id: 'trail-series',
    title: 'Trail Running Series',
    text: 'Log three trail runs this month and go into the draw for new trail shoes.',
    cta: 'Join challenge',
  },
];

const feedEl = document.getElementById('feed');
const statusEl = document.getElementById('feed-status');
const loadMoreBtn = document.getElementById('load-more');

let activities = [];
let shown = 0;          // how many activity cards are rendered
const promosUsed = new Set(); // ids of promos already placed in the feed
let promosReduced = false; // set after the user dismisses a promo

/** localStorage can be blocked (private mode, strict settings): fail quietly. */
function readDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || []; } catch (_) { return []; }
}
function saveDismissed(id) {
  try {
    const ids = new Set(readDismissed());
    ids.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch (_) { /* ignore */ }
}

/** Small helper: <div class="stat"><dt>label</dt><dd>value</dd></div> */
function stat(label, value) {
  const wrap = el('div', 'stat');
  wrap.append(el('dt', '', label), el('dd', '', value));
  return wrap;
}

/** Build one activity card as an <article> (A1 semantic HTML spec).
    Layout mirrors Strava: avatar + athlete line, sport icon + title/stats,
    full-width map, kudos summary + action buttons. */
function renderCard(a) {
  const li = el('li');
  const article = el('article', 'card activity-card');
  const titleId = `activity-${a.id}-title`;
  article.setAttribute('aria-labelledby', titleId);

  // Row 1: avatar | athlete name + "when · device · location"
  const who = el('div', 'activity-card__body');
  who.append(
    el('p', 'activity-card__name', a.athlete),
    el('p', 'activity-card__sub', `${formatWhen(a.date)} · ${a.device} · ${a.location}`),
  );

  // Row 2: sport icon | title, description, stats
  const sport = icon(a.type.toLowerCase(), 'icon--lg activity-card__icon');
  const body = el('div', 'activity-card__body');

  const h2 = el('h2', 'activity-card__title');
  h2.id = titleId;
  const link = el('a', '', a.title);
  link.href = `activity.html?id=${encodeURIComponent(a.id)}`;
  h2.append(link);
  body.append(h2);

  // Screen readers get the sport as text (the icon is decorative)
  const sportText = el('span', 'visually-hidden', `${a.type}: `);
  h2.prepend(sportText);

  if (a.description) body.append(el('p', 'activity-card__desc', a.description));

  // Key stats only — free-user "scannable view" (A1)
  const statsRow = el('div', 'activity-card__stats');
  const stats = el('dl', 'stats');
  stats.append(
    stat('Distance', `${a.distanceKm.toFixed(2)} km`),
    a.type === 'Ride'
      ? stat('Elev Gain', `${a.elevationGainM} m`)
      : stat('Pace', formatPace(a)),
    stat('Time', formatDuration(a.movingTimeS)),
  );
  statsRow.append(stats);

  if (a.achievements) {
    const ach = el('dl', 'stat achievements');
    const dd = el('dd');
    dd.append(icon('trophy'), document.createTextNode(String(a.achievements)));
    ach.append(el('dt', '', 'Achievements'), dd);
    statsRow.append(ach);
  }
  body.append(statsRow);

  // Row 3: route map, full width. Lazy-loaded; space reserved via aspect-ratio
  const img = el('img', 'activity-card__map activity-card__full');
  img.src = a.mapImage;
  img.width = 1686;
  img.height = 883;
  img.loading = 'lazy';
  img.alt = `Route map for ${a.title}, ${a.distanceKm.toFixed(1)} km ${a.type.toLowerCase()} near ${a.location}`;

  // Row 4: kudos summary + kudos / comment buttons
  const actions = el('div', 'activity-card__actions activity-card__full');

  const summary = el('div', 'kudos-summary');
  const stack = el('span', 'avatar-stack');
  a.kudosBy.forEach((name) => stack.append(avatar(name, 'sm')));
  const count = el('span', 'kudos-count', kudosText(a.kudos));
  count.dataset.base = a.kudos; // original count, so toggling can't drift
  summary.append(stack, count);

  const buttons = el('div', 'activity-card__buttons');
  const kudosBtn = el('button', 'icon-btn kudos-btn');
  kudosBtn.type = 'button';
  kudosBtn.setAttribute('aria-pressed', 'false');
  kudosBtn.setAttribute('aria-label', `Give kudos to ${a.athlete}`);
  kudosBtn.dataset.activityId = a.id;
  kudosBtn.append(icon('kudos'));

  const commentLink = el('a', 'icon-btn');
  commentLink.href = `activity.html?id=${encodeURIComponent(a.id)}#comments-title`;
  commentLink.setAttribute('aria-label', `Comment on ${a.title}`);
  commentLink.append(icon('comment'));

  buttons.append(kudosBtn, commentLink);
  actions.append(summary, buttons);

  article.append(avatar(a.athlete), who, sport, body, img, actions);
  li.append(article);
  return li;
}

function kudosText(n) {
  return n === 1 ? '1 kudo' : `${n} kudos`;
}

/** In-feed sponsored challenge: the clutter A1 identified, now dismissible. */
function renderPromo(promo) {
  const li = el('li');
  li.className = 'promo-item';
  const section = el('section', 'card promo');
  const titleId = `promo-${promo.id}-title`;
  section.setAttribute('aria-labelledby', titleId);

  const dismiss = el('button', 'icon-btn icon-btn--bare promo__dismiss');
  dismiss.type = 'button';
  dismiss.dataset.promoId = promo.id;
  dismiss.setAttribute('aria-label', `Dismiss sponsored challenge: ${promo.title}`);
  dismiss.append(icon('close'));

  const title = el('h2', '', promo.title);
  title.id = titleId;
  const cta = el('a', 'btn btn--primary btn--sm', promo.cta);
  cta.href = '#';
  cta.setAttribute('aria-disabled', 'true'); // out of prototype scope

  section.append(
    dismiss,
    el('p', 'promo__label', 'Sponsored challenge'),
    title,
    el('p', '', promo.text),
    cta,
  );
  li.append(section);
  return li;
}

/** Decide whether a promo goes after the activity at this position (1-based).
    Applies the cap rules listed at the top of the file. */
function promoAfter(position) {
  if (promosReduced || promosUsed.size >= MAX_PROMOS) return null;
  if (position < PROMO_FIRST || (position - PROMO_FIRST) % PROMO_INTERVAL !== 0) return null;

  const dismissed = readDismissed();
  const promo = PROMOS.find((p) => !promosUsed.has(p.id) && !dismissed.includes(p.id));
  if (!promo) return null;
  promosUsed.add(promo.id);
  return promo;
}

/** Append the next PAGE_SIZE cards. Returns the first new card's <li>. */
function renderNextPage() {
  const start = shown;
  const next = activities.slice(start, start + PAGE_SIZE);
  const frag = document.createDocumentFragment();
  let firstNew = null;

  next.forEach((a, i) => {
    const card = renderCard(a);
    if (!firstNew) firstNew = card;
    frag.append(card);
    const promo = promoAfter(start + i + 1);
    if (promo) frag.append(renderPromo(promo));
  });

  feedEl.append(frag);
  shown += next.length;

  statusEl.textContent = `Showing ${shown} of ${activities.length} activities`;
  loadMoreBtn.hidden = shown >= activities.length;
  return firstNew;
}

/* ---------- Load more (A1: replaces infinite scroll) ----------
   After loading, focus moves to the first new activity's title so keyboard
   and screen reader users continue from where the new content starts. */
loadMoreBtn.addEventListener('click', () => {
  const firstNew = renderNextPage();
  firstNew?.querySelector('.activity-card__title a')?.focus();
});

/* ---------- Kudos ----------
   Toggle state with aria-pressed; count and avatar stack update to match.
   Prototype only: not saved. */
function toggleKudos(btn) {
  const nowPressed = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', String(nowPressed));

  const card = btn.closest('.activity-card');
  const count = card.querySelector('.kudos-count');
  count.textContent = kudosText(Number(count.dataset.base) + (nowPressed ? 1 : 0));

  const stack = card.querySelector('.avatar-stack');
  if (nowPressed) {
    const mine = avatar(ME, 'sm');
    mine.classList.add('is-mine');
    stack.prepend(mine);
  } else {
    stack.querySelector('.is-mine')?.remove();
  }
}

/* ---------- Promo dismiss ----------
   Remove the promo, remember it, stop inserting more this visit, and move
   focus somewhere sensible so keyboard users aren't dropped to the top. */
function dismissPromo(btn) {
  const li = btn.closest('li');
  const nextFocus = li.nextElementSibling?.querySelector('.activity-card__title a')
    || (loadMoreBtn.hidden ? null : loadMoreBtn);

  saveDismissed(btn.dataset.promoId);
  promosReduced = true;
  li.remove();
  statusEl.textContent = "Promotion dismissed. You'll see fewer sponsored challenges.";
  nextFocus?.focus();
}

// One listener for the whole feed (event delegation), so cards added by
// "Load more" work without attaching listeners to each one.
feedEl.addEventListener('click', (e) => {
  const kudosBtn = e.target.closest('.kudos-btn');
  if (kudosBtn) { toggleKudos(kudosBtn); return; }

  const dismissBtn = e.target.closest('.promo__dismiss');
  if (dismissBtn) dismissPromo(dismissBtn);
});

function showError() {
  feedEl.replaceChildren();
  const li = el('li', 'notice notice--error');
  // Opened from the zip (file://)? fetch can't work there — say so plainly.
  const msg = location.protocol === 'file:'
    ? 'This prototype needs to be opened via its live link or a local server (see README).'
    : "We couldn't load your feed. Check your connection and try again.";
  li.append(el('p', '', msg));
  const retry = el('button', 'btn', 'Try again');
  retry.type = 'button';
  retry.addEventListener('click', init);
  li.append(retry);
  feedEl.append(li);
  statusEl.textContent = 'Feed failed to load';
}

async function init() {
  feedEl.setAttribute('aria-busy', 'true');
  try {
    activities = await fetchActivities();
    feedEl.replaceChildren(); // remove skeletons
    shown = 0;
    promosUsed.clear();
    renderNextPage();
  } catch (err) {
    console.error('[feed]', err);
    showError();
  } finally {
    feedEl.setAttribute('aria-busy', 'false');
  }
}

init();
