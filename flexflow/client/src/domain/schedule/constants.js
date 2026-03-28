export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Minutes from 5:00 AM (0) through 1:00 AM next day (1200) */
export const GRID_TOTAL_MINUTES = 20 * 60;

export const SNAP_MINUTES = 15;

export const PX_PER_MINUTE = 0.85;
export const COLUMN_MIN_WIDTH = 100;

export const BLOCK_TYPES = {
  school: { label: 'School', key: 'school' },
  study: { label: 'Study', key: 'study' },
  homework: { label: 'Homework', key: 'homework' },
  sports: { label: 'Sports', key: 'sports' },
  clubs: { label: 'Clubs', key: 'clubs' },
  commute: { label: 'Commute', key: 'commute' },
  free: { label: 'Free time', key: 'free' },
  sleep: { label: 'Sleep', key: 'sleep' },
  other: { label: 'Other', key: 'other' },
};

/** Tailwind class fragments for block colors */
export const BLOCK_COLORS = {
  school: 'bg-blue-500/85 border-blue-400/50 text-white',
  study: 'bg-amber-400/90 border-amber-300/50 text-slate-900',
  homework: 'bg-yellow-400/85 border-yellow-300/50 text-slate-900',
  sports: 'bg-emerald-500/85 border-emerald-400/50 text-white',
  clubs: 'bg-green-500/85 border-green-400/50 text-white',
  commute: 'bg-slate-500/80 border-slate-400/45 text-white',
  free: 'bg-slate-600/55 border-slate-500/40 text-slate-100',
  sleep: 'bg-violet-600/85 border-violet-400/50 text-white',
  other: 'bg-orange-500/85 border-orange-400/50 text-white',
};

/** @deprecated cleared on logout; session uses JWT */
export const USER_STORAGE_KEY = 'flexflow_user_id';

export const AUTH_TOKEN_KEY = 'flexflow_token';

export const MOTIVATION_MESSAGES = [
  "You've got this — one focused block at a time.",
  'Breathe. Focus. Small steps win.',
  'Your future self will thank you for this session.',
  'Progress beats perfection.',
  'Stay with it — momentum builds here.',
];
