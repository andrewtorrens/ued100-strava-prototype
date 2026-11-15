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

/** "Today at 5:49 AM" / "Yesterday at …" / "12 November 2026 at …" (Strava style) */
export function formatWhen(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${date} at ${time}`;
}

/** Decorative icon: <span class="icon icon--ride" aria-hidden="true"> */
export function icon(name, extra = '') {
  const span = el('span', `icon icon--${name} ${extra}`.trim());
  span.setAttribute('aria-hidden', 'true');
  return span;
}

/** Initials avatar; colour picked from the name so it's stable per athlete. */
export function avatar(name, size = '') {
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % 6;
  const span = el('span', `avatar avatar--c${hash} ${size ? `avatar--${size}` : ''}`.trim(), initials);
  span.setAttribute('aria-hidden', 'true');   // the name is always shown as text beside it
  return span;
}
