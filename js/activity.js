/* ==========================================================================
   activity.js — activity detail page (activity.html?id=...)
   Reads ?id, loads data, fills stats via textContent, sets map alt text,
   handles not-found/error states.
   ========================================================================== */
import { fetchActivities, formatDuration, formatPace, formatDate } from './utils.js';

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
  setField('type', a.type);
  setField('date', formatDate(a.date));
  article.querySelector('time[data-field="date"]').dateTime = a.date;
  setField('title', a.title);
  setField('distance', `${a.distanceKm.toFixed(1)} km`);
  setField('movingTime', formatDuration(a.movingTimeS));
  setField('pace', formatPace(a));
  setField('elevation', `${a.elevationGainM} m`);
  setField('kudos', a.kudos);

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
  initElevationChart(a.elevationProfile);
  initPrivacy(a);
  initSocial(a);
}

/* ---------- Features ---------- */

/** Progressive disclosure (A1 recommendation 2). TODO */
function initAdvancedToggle() {}

/** Elevation chart. TODO */
function initElevationChart(profile) {}

/** Map privacy. TODO */
function initPrivacy(activity) {}

/** Kudos + comments. TODO */
function initSocial(activity) {}

init();
