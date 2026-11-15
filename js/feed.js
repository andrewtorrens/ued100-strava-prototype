/* ==========================================================================
   feed.js — feed page (index.html)
   Fetch, loading/error states, safe card rendering, paging.
   ========================================================================== */
import { fetchActivities, formatDuration, formatPace, formatDate, el } from './utils.js';

const PAGE_SIZE = 5;

const feedEl = document.getElementById('feed');
const statusEl = document.getElementById('feed-status');
const loadMoreBtn = document.getElementById('load-more');

let activities = [];
let shown = 0; // how many cards are currently rendered

/** Build one activity card as an <article> (A1 semantic HTML spec). */
function renderCard(a) {
  const li = el('li');
  const article = el('article', 'card activity-card');
  const titleId = `activity-${a.id}-title`;
  article.setAttribute('aria-labelledby', titleId);

  // Meta row: athlete · type · date
  const meta = el('p', 'activity-card__meta');
  meta.append(
    el('span', 'activity-card__athlete', a.athlete),
    el('span', '', a.type),
  );
  const time = el('time', '', formatDate(a.date));
  time.dateTime = a.date;
  meta.append(time);

  // Title links to the detail page
  const h2 = el('h2', 'activity-card__title');
  h2.id = titleId;
  const link = el('a', '', a.title);
  link.href = `activity.html?id=${encodeURIComponent(a.id)}`;
  h2.append(link);

  // Key stats only — free-user "scannable view" (A1)
  const stats = el('dl', 'stats');
  [
    ['Distance', `${a.distanceKm.toFixed(1)} km`],
    [a.type === 'Ride' ? 'Speed' : 'Pace', formatPace(a)],
    ['Time', formatDuration(a.movingTimeS)],
  ].forEach(([label, value]) => {
    const wrap = el('div', 'stat');
    wrap.append(el('dt', '', label), el('dd', '', value));
    stats.append(wrap);
  });

  // Route map: lazy-loaded, dimensions reserved via CSS aspect-ratio
  const img = el('img', 'activity-card__map');
  img.src = a.mapImage;
  img.width = 1600;
  img.height = 900;
  img.loading = 'lazy';
  img.alt = `Route map for ${a.title}, ${a.distanceKm.toFixed(1)} km ${a.type.toLowerCase()} near ${a.location}`;

  // Actions
  const actions = el('div', 'activity-card__actions');
  const kudos = el('button', 'btn btn--ghost', `👍 ${a.kudos}`);
  kudos.type = 'button';
  kudos.setAttribute('aria-pressed', 'false');
  kudos.setAttribute('aria-label', `Give kudos, ${a.kudos} so far`);
  kudos.dataset.activityId = a.id;
  actions.append(kudos);

  article.append(meta, h2, stats, img, actions);
  li.append(article);
  return li;
}

/** Append the next PAGE_SIZE cards. */
function renderNextPage() {
  const next = activities.slice(shown, shown + PAGE_SIZE);
  const frag = document.createDocumentFragment();
  next.forEach((a) => frag.append(renderCard(a)));
  feedEl.append(frag);
  shown += next.length;

  statusEl.textContent = `Showing ${shown} of ${activities.length} activities`;
  loadMoreBtn.hidden = shown >= activities.length;
}

function showError() {
  feedEl.replaceChildren();
  const li = el('li', 'notice notice--error');
  li.append(
    el('p', '', "We couldn't load your feed. Check your connection and try again."),
  );
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
// TODO: promos (A1 recommendation 1)

init();
