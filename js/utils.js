/* ==========================================================================
   utils.js — shared helpers (ES module)
   Data loading + formatting used by feed.js and activity.js.
   ========================================================================== */

const DATA_URL = 'data/activities.json';

/**
 * Fetch all activities. Mirrors A1's "asynchronous data fetching";
 * in production this would be a paginated API call.
 * Throws on network/HTTP errors so callers can show an error state.
 */
export async function fetchActivities() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** 3725 -> "1h 2m"; 1505 -> "25m 5s" */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}h ${m}m` : `${m}m ${s}s`;
}

/** Runs show pace (min/km); rides show speed (km/h) — matches Strava's convention. */
export function formatPace(activity) {
  const { distanceKm, movingTimeS, type } = activity;
  if (type === 'Run' || type === 'Walk') {
    const secPerKm = movingTimeS / distanceKm;
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60).toString().padStart(2, '0');
    return `${m}:${s} /km`;
  }
  return `${(distanceKm / (movingTimeS / 3600)).toFixed(1)} km/h`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Create an element and set its text safely.
 * SECURITY: always textContent, never innerHTML, so user-generated strings
 * (titles, comments) render as text and can't inject markup (A1 XSS spec).
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
