/* ==========================================================================
   activity.js — activity detail page (activity.html?id=...)
   Reads ?id, loads data, fills stats via textContent, sets map alt text,
   handles not-found/error states. Features: progressive disclosure
   (A1 rec 2), map privacy controls, SVG elevation chart with text
   alternative, kudos and comments (rendered as plain text).
   ========================================================================== */
import {
  fetchActivities, formatDuration, formatPace, formatWhen, avatar, el, ME,
} from './utils.js';

const statusEl = document.getElementById('activity-status');
const article = document.getElementById('activity');

/** Set text on every [data-field="name"] element. textContent only (XSS). */
function setField(name, value) {
  article.querySelectorAll(`[data-field="${name}"]`).forEach((node) => {
    node.textContent = value;
  });
}

function showMessage(text) {
  article.replaceChildren();
  const p = document.createElement('p');
  p.className = 'notice notice--error';
  p.textContent = text;
  const back = document.createElement('a');
  back.href = 'index.html';
  back.textContent = 'Back to feed';
  article.append(p, back);
}

async function init() {
  const id = new URLSearchParams(location.search).get('id');

  let activities;
  try {
    activities = await fetchActivities();
  } catch (err) {
    console.error('[activity]', err);
    showMessage("We couldn't load this activity. Check your connection and try again.");
    return;
  }

  // No ?id -> show the first activity so the page is always demo-able
  const a = id ? activities.find((x) => String(x.id) === id) : activities[0];
  if (!a) {
    showMessage("That activity doesn't exist or is private.");
    return;
  }

  document.title = `${a.title} — Strava redesign prototype`;

  // Key metrics (always visible)
  setField('athlete', a.athlete);
  setField('type', `${a.type}: `);
  setField('date', formatWhen(a.date));
  setField('device', a.device);
  setField('location', a.location);
  setField('description', a.description);
  article.querySelector('[data-field="avatar"]').replaceWith(avatar(a.athlete));
  article.querySelector('time[data-field="date"]').dateTime = a.date;
  setField('title', a.title);
  setField('distance', `${a.distanceKm.toFixed(1)} km`);
  setField('movingTime', formatDuration(a.movingTimeS));
  setField('pace', formatPace(a));
  setField('elevation', `${a.elevationGainM} m`);

  // Advanced metrics (inside the hidden #advanced-data panel)
  setField('avgHr', a.avgHr ? `${a.avgHr} bpm` : '—');
  setField('avgPower', a.avgPowerW ? `${a.avgPowerW} W` : '—');
  setField('calories', a.calories ? `${a.calories} kcal` : '—');

  // Map image + descriptive alt text
  const map = article.querySelector('[data-field="map"]');
  map.src = a.mapImage;
  map.alt = `Route map: ${a.distanceKm.toFixed(1)} km ${a.type.toLowerCase()} near ${a.location}`;

  statusEl.textContent = `Loaded activity: ${a.title}`;

  // Hand the data to the features below
  initAdvancedToggle();
  initElevationChart(a);
  initPrivacy(a);
  initKudos(a);
  initComments(a);
}

/* ---------- Storage helper ----------
   localStorage can be blocked (private mode, strict settings): fail quietly. */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* ignore */ }
  },
};

/* ---------- Progressive disclosure (A1 recommendation 2) ----------
   Key metrics are always visible (free-user scannable view); advanced data
   is one click away (subscriber depth on demand). Chosen over tabs in A1
   because one view serves both groups. The open/closed choice is remembered. */
function initAdvancedToggle() {
  const btn = document.getElementById('advanced-toggle');
  const panel = document.getElementById('advanced-data');

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Hide advanced data' : 'Show advanced data';
    panel.hidden = !open;
  }

  setOpen(store.get('advancedOpen', false));
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    store.set('advancedOpen', open);
  });
}

/* ---------- Elevation chart ----------
   Inline SVG built with createElementNS (no chart library = no third-party
   code). The SVG is labelled by the figcaption summary, which is the text
   alternative for screen reader users (A1 accessibility spec). */
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

function initElevationChart(activity) {
  const profile = activity.elevationProfile;
  const holder = document.getElementById('elevation-chart');
  const summary = document.getElementById('elevation-summary');
  if (!profile?.length) {
    summary.textContent = 'No elevation data for this activity.';
    return;
  }

  // Chart geometry (viewBox units; the SVG scales to its container)
  const W = 600, H = 200, PAD = { top: 12, right: 12, bottom: 28, left: 44 };
  const kms = profile.map((p) => p.km);
  const ms = profile.map((p) => p.m);
  const minM = Math.min(...ms), maxM = Math.max(...ms);
  const maxKm = Math.max(...kms);
  const range = Math.max(maxM - minM, 1);

  const x = (km) => PAD.left + (km / maxKm) * (W - PAD.left - PAD.right);
  const y = (m) => PAD.top + (1 - (m - minM) / range) * (H - PAD.top - PAD.bottom);

  const points = profile.map((p) => `${x(p.km).toFixed(1)},${y(p.m).toFixed(1)}`);
  const baseY = H - PAD.bottom;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'chart__svg',
    role: 'img',
    'aria-labelledby': 'elevation-summary',
  });

  // Filled area under the line, then the line itself
  svg.append(
    svgEl('polygon', {
      class: 'chart__area',
      points: `${x(0)},${baseY} ${points.join(' ')} ${x(maxKm)},${baseY}`,
    }),
    svgEl('polyline', { class: 'chart__line', points: points.join(' ') }),
    svgEl('line', { class: 'chart__axis', x1: PAD.left, y1: baseY, x2: W - PAD.right, y2: baseY }),
  );

  // Axis labels: min/max elevation, start/end distance
  const label = (text, attrs) => {
    const t = svgEl('text', { class: 'chart__label', ...attrs });
    t.textContent = text;
    return t;
  };
  svg.append(
    label(`${maxM} m`, { x: PAD.left - 6, y: y(maxM) + 4, 'text-anchor': 'end' }),
    label(`${minM} m`, { x: PAD.left - 6, y: y(minM) + 4, 'text-anchor': 'end' }),
    label('0 km', { x: PAD.left, y: H - 8, 'text-anchor': 'start' }),
    label(`${maxKm} km`, { x: W - PAD.right, y: H - 8, 'text-anchor': 'end' }),
  );

  holder.replaceChildren(svg);

  // Text alternative: the key facts a sighted user would read off the chart
  const peak = profile.reduce((best, p) => (p.m > best.m ? p : best), profile[0]);
  summary.textContent = `Elevation profile: ranges from ${minM} m to ${maxM} m, `
    + `highest point ${peak.m} m at ${peak.km} km, total climbing ${activity.elevationGainM} m.`;
}

/* ---------- Map privacy (A1: Global Heatmap / privacy risk) ----------
   Controls sit directly under the map so they're easy to find. Privacy zone
   is ON by default. Settings are saved per activity. Only the owner sees the
   controls; on other athletes' activities the map badge alone shows the
   state (and the map's alt text says it for screen reader users). */
const VISIBILITY_TEXT = {
  everyone: 'Everyone can see this map',
  followers: 'Only your followers can see this map',
  'only-me': 'Only you can see this map',
};

function initPrivacy(activity) {
  const summary = document.getElementById('privacy-summary');
  const badge = document.getElementById('map-badge');
  const controls = document.getElementById('privacy-controls');
  const visibility = document.getElementById('map-visibility');
  const zone = document.getElementById('privacy-zone');
  const key = `privacy-${activity.id}`;
  const isMine = activity.athlete === ME;

  // Defaults: followers only, privacy zone on
  const settings = store.get(key, { visibility: 'followers', zone: true });

  function render() {
    badge.textContent = settings.zone ? 'Start/end hidden' : 'Start/end visible';
    badge.classList.toggle('map-badge--warn', !settings.zone);

    if (!isMine) return;
    summary.textContent = `${VISIBILITY_TEXT[settings.visibility]}. `
      + (settings.zone
        ? 'Start and end points are hidden.'
        : 'Warning: your start and end points are visible and may reveal where you live.');
  }

  if (!isMine) {
    // No controls to show: drop the panel, keep the badge, describe it in alt text
    summary.closest('section').hidden = true;
    const map = document.querySelector('[data-field="map"]');
    map.alt += settings.zone ? '. Start and end points hidden by privacy zone.' : '.';
  } else {
    controls.hidden = false;
    visibility.value = settings.visibility;
    zone.checked = settings.zone;

    visibility.addEventListener('change', () => {
      settings.visibility = visibility.value;
      store.set(key, settings);
      render();
    });
    zone.addEventListener('change', () => {
      settings.zone = zone.checked;
      store.set(key, settings);
      render();
    });
  }
  render();
}

/* ---------- Kudos ----------
   Same pattern as the feed: aria-pressed state, count updates. You can't
   give kudos to your own activity (as on Strava). */
function initKudos(activity) {
  const btn = document.getElementById('kudos-btn');
  const count = document.getElementById('kudos-count');
  const text = (n) => (n === 1 ? '1 kudo' : `${n} kudos`);
  count.textContent = text(activity.kudos);

  if (activity.athlete === ME) {
    btn.hidden = true;
    return;
  }
  btn.setAttribute('aria-label', `Give kudos to ${activity.athlete}`);
  btn.addEventListener('click', () => {
    const pressed = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(pressed));
    count.textContent = text(activity.kudos + (pressed ? 1 : 0));
  });
}

/* ---------- Comments ----------
   SECURITY (A1 XSS spec): comment text is only ever set with textContent,
   so markup typed into a comment is displayed, never executed. Activity 3
   includes a test comment containing an <img onerror> payload to show this.
   Prototype only: new comments aren't saved. */
const COMMENT_MAX = 280;

function renderComment({ author, text }) {
  const li = el('li', 'comment');
  const body = el('div', 'comment__body');
  body.append(el('p', 'comment__author', author), el('p', 'comment__text', text));
  li.append(avatar(author, 'sm'), body);
  return li;
}

function initComments(activity) {
  const list = document.getElementById('comment-list');
  const form = document.getElementById('comment-form');
  const input = document.getElementById('comment-text');
  const error = document.getElementById('comment-error');

  (activity.comments || []).forEach((c) => list.append(renderComment(c)));

  function showError(message) {
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') {
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return showError('Write a comment before posting.');
    if (text.length > COMMENT_MAX) return showError(`Comments can be up to ${COMMENT_MAX} characters.`);

    list.append(renderComment({ author: ME, text }));
    input.value = '';
    statusEl.textContent = 'Comment posted.';
  });
}

init();
