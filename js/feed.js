/* ==========================================================================
   feed.js — feed page (index.html)
   Fetch, loading/error states, safe card rendering, paging, in-feed promo.
   ========================================================================== */
import {
  fetchActivities, formatDuration, formatPace, formatWhen, el, icon, avatar,
} from './utils.js';

const PAGE_SIZE = 5;
const PROMO_AFTER = 2; // in-feed sponsored card appears after this many activities

const feedEl = document.getElementById('feed');
const statusEl = document.getElementById('feed-status');
const loadMoreBtn = document.getElementById('load-more');

let activities = [];
let shown = 0; // how many cards are currently rendered

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
  img.width = 1600;
  img.height = 900;
  img.loading = 'lazy';
  img.alt = `Route map for ${a.title}, ${a.distanceKm.toFixed(1)} km ${a.type.toLowerCase()} near ${a.location}`;

  // Row 4: kudos summary + kudos / comment buttons
  const actions = el('div', 'activity-card__actions activity-card__full');

  const summary = el('div', 'kudos-summary');
  if (a.kudos > 0) {
    const stack = el('span', 'avatar-stack');
    a.kudosBy.forEach((name) => stack.append(avatar(name, 'sm')));
    summary.append(stack);
  }
  const count = el('span', 'kudos-count', a.kudos === 1 ? '1 kudo' : `${a.kudos} kudos`);
  summary.append(count);

  const buttons = el('div', 'activity-card__buttons');
  const kudosBtn = el('button', 'icon-btn kudos-btn');
  kudosBtn.type = 'button';
  kudosBtn.setAttribute('aria-pressed', 'false');
  kudosBtn.setAttribute('aria-label', 'Give kudos');
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

/** In-feed sponsored challenge: the clutter A1 identified.
    Rendered between activities, as on Strava's free tier. */
function renderPromo() {
  const li = el('li');
  const section = el('section', 'card promo');
  section.setAttribute('aria-labelledby', 'feed-promo-title');

  const dismiss = el('button', 'icon-btn icon-btn--bare promo__dismiss');
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Dismiss this promotion');
  dismiss.append(icon('close'));

  const title = el('h2', '', 'Ride 200 km in November');
  title.id = 'feed-promo-title';
  const cta = el('a', 'btn btn--primary btn--sm', 'Join challenge');
  cta.href = '#';

  section.append(
    dismiss,
    el('p', 'promo__label', 'Sponsored challenge'),
    title,
    el('p', '', 'Complete 200 km this month to unlock a partner discount and a digital badge.'),
    cta,
  );
  li.append(section);
  return li;
}

/** Append the next PAGE_SIZE cards. */
function renderNextPage() {
  const next = activities.slice(shown, shown + PAGE_SIZE);
  const frag = document.createDocumentFragment();
  next.forEach((a, i) => {
    frag.append(renderCard(a));
    if (shown + i + 1 === PROMO_AFTER) frag.append(renderPromo());
  });
  feedEl.append(frag);
  shown += next.length;

  statusEl.textContent = `Showing ${shown} of ${activities.length} activities`;
  loadMoreBtn.hidden = shown >= activities.length;
}

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
    renderNextPage();
  } catch (err) {
    console.error('[feed]', err);
    showError();
  } finally {
    feedEl.setAttribute('aria-busy', 'false');
  }
}

// TODO: load more
// TODO: kudos
// TODO: promos — dismiss + cap (A1 recommendation 1)

init();
