import { timeToGridMinutes, gridMinutesToLabel } from './timeUtils.js';

/**
 * @param {object[]} blocks
 */
export function analyzeSchedule(blocks, bedTime = '22:30') {
  const insights = [];
  const dailyLoad = Array(7).fill(0);
  for (const b of blocks) {
    dailyLoad[b.day] += b.endMinutes - b.startMinutes;
  }
  const maxDay = dailyLoad.indexOf(Math.max(...dailyLoad));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (dailyLoad[maxDay] > 16 * 60) {
    insights.push({
      type: 'overload',
      title: 'Heavy day ahead',
      detail: `${days[maxDay]} looks packed — try moving something light to another day.`,
    });
  }

  const bedG = timeToGridMinutes(bedTime);
  let lateCount = 0;
  for (const b of blocks) {
    if ((b.type === 'study' || b.type === 'homework') && b.startMinutes > bedG) {
      lateCount += 1;
    }
  }
  if (lateCount > 0) {
    insights.push({
      type: 'sleep',
      title: 'Late-night focus',
      detail:
        'Evening work after your target bedtime can hurt sleep. Try shifting study earlier.',
    });
  }

  const studyByHour = Array(24).fill(0);
  for (const b of blocks) {
    if (b.type !== 'study' && b.type !== 'homework') continue;
    const startH = Math.floor((5 * 60 + b.startMinutes) / 60) % 24;
    studyByHour[startH] += b.endMinutes - b.startMinutes;
  }
  let bestH = 16;
  let bestAmt = 0;
  for (let h = 14; h <= 19; h++) {
    if (studyByHour[h] > bestAmt) {
      bestAmt = studyByHour[h];
      bestH = h;
    }
  }
  if (bestAmt > 0) {
    insights.push({
      type: 'pattern',
      title: 'Peak focus window',
      detail: `You study most around ${bestH}:00–${bestH + 2}:00 — protect that window.`,
    });
  }

  const procrastinationSignal = blocks.filter(
    (b) =>
      (b.type === 'homework' || b.type === 'study') &&
      b.startMinutes > timeToGridMinutes('21:00')
  ).length;
  if (procrastinationSignal >= 4) {
    insights.push({
      type: 'procrastination',
      title: 'Later-evening cram pattern',
      detail:
        'Several sessions land after 9 PM. Try a 25-minute sprint right after school.',
    });
  }

  return insights;
}

export function bestStudyWindow(blocks) {
  const buckets = {};
  for (const b of blocks) {
    if (b.type !== 'study' && b.type !== 'homework') continue;
    const k = Math.floor(b.startMinutes / 120);
    const start = k * 120;
    const label = `${gridMinutesToLabel(start)} – ${gridMinutesToLabel(start + 120)}`;
    buckets[label] = (buckets[label] || 0) + 1;
  }
  const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '4:00 PM – 6:00 PM';
}
