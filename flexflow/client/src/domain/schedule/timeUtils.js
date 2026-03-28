import { GRID_TOTAL_MINUTES, SNAP_MINUTES } from './constants.js';

/** @param {string} t "HH:MM" */
export function parseTimeToMinutesMidnight(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Convert clock time to grid minutes from 5:00 AM (same calendar day / early morning next)
 */
export function timeToGridMinutes(timeStr) {
  const fromMidnight = parseTimeToMinutesMidnight(timeStr);
  const fiveAm = 5 * 60;
  if (fromMidnight >= fiveAm) return fromMidnight - fiveAm;
  return 24 * 60 - fiveAm + fromMidnight;
}

/** Grid minutes → "HH:MM" label */
export function gridMinutesToLabel(g) {
  const fiveAm = 5 * 60;
  const absolute = fiveAm + g;
  const wrapped = absolute >= 24 * 60 ? absolute - 24 * 60 : absolute;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function snapMinutes(m) {
  return Math.round(m / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clampGrid(m) {
  const s = snapMinutes(m);
  return Math.max(0, Math.min(GRID_TOTAL_MINUTES - SNAP_MINUTES, s));
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
