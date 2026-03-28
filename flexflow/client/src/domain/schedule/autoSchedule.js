import { timeToGridMinutes, gridMinutesToLabel } from './timeUtils.js';
import { GRID_TOTAL_MINUTES } from './constants.js';

/**
 * @param {object} onboarding
 */
export function generateScheduleFromOnboarding(onboarding) {
  const {
    wakeTime = '07:00',
    schoolStart = '08:00',
    schoolEnd = '15:30',
    commuteMinutes = 30,
    bedTime = '22:30',
    activities = [],
    homeworkLoad = 'medium',
    weekendWake = '09:00',
    weekendBed = '23:00',
  } = onboarding;

  const commute = Math.max(10, Number(commuteMinutes) || 30);
  const hwMins =
    homeworkLoad === 'heavy' ? 120 : homeworkLoad === 'light' ? 45 : 75;

  const blocks = [];

  const push = (day, startG, endG, type, title, reminderEnabled = false) => {
    const s = Math.max(0, startG);
    const e = Math.min(GRID_TOTAL_MINUTES, endG);
    if (e - s < 15) return;
    blocks.push({
      day,
      startMinutes: s,
      endMinutes: e,
      type,
      title,
      reminderEnabled: reminderEnabled || type === 'homework' || type === 'school',
    });
  };

  const ss = timeToGridMinutes(schoolStart);
  const se = timeToGridMinutes(schoolEnd);

  for (let d = 0; d < 5; d++) {
    const w = timeToGridMinutes(wakeTime);
    const bed = timeToGridMinutes(bedTime);
    const commuteStart = Math.max(0, ss - commute);

    push(d, w, commuteStart, 'free', 'Morning routine');
    push(d, commuteStart, ss, 'commute', 'To school', true);
    push(d, ss, se, 'school', 'School', true);
    push(d, se, se + commute, 'commute', 'From school');
    let cursor = se + commute;
    push(d, cursor, cursor + 40, 'free', 'After-school break');
    cursor += 40;

    const act = activities[d % Math.max(activities.length, 1)];
    if (activities.length && act?.name) {
      const dur = Math.max(30, Number(act.durationMins) || 60);
      push(
        d,
        cursor,
        cursor + dur,
        act.type || 'clubs',
        act.name
      );
      cursor += dur;
    }

    push(d, cursor, cursor + 30, 'free', 'Transition');
    cursor += 30;
    push(d, cursor, cursor + 45, 'other', 'Dinner');
    cursor += 45;
    push(d, cursor, cursor + hwMins, 'homework', 'Homework', true);
    cursor += hwMins;
    push(d, cursor, cursor + 45, 'study', 'Study session');
    cursor += 45;
    if (cursor < bed - 20) {
      push(d, cursor, bed, 'free', 'Evening');
    }
    const sleepEnd = Math.min(GRID_TOTAL_MINUTES, bed + 8 * 60);
    push(d, bed, sleepEnd, 'sleep', 'Sleep');
  }

  for (let d = 5; d < 7; d++) {
    const w = timeToGridMinutes(weekendWake);
    const bed = timeToGridMinutes(weekendBed);
    push(d, w, w + 60, 'free', 'Weekend morning');
    let c = w + 90;
    push(d, c, c + hwMins, 'homework', 'Weekend homework', true);
    c += hwMins;
    push(d, c, c + 120, 'free', 'Activities / free time');
    c += 120;
    if (c < bed - 30) push(d, c, bed - 30, 'study', 'Optional study');
    push(d, bed, Math.min(GRID_TOTAL_MINUTES, bed + 9 * 60), 'sleep', 'Sleep');
  }

  return blocks;
}

/** Debug helper */
export function labelRange(startG, endG) {
  return `${gridMinutesToLabel(startG)}–${gridMinutesToLabel(endG)}`;
}
