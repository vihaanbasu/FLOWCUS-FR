import { timeToGridMinutes } from './timeUtils.js';

function parseBedMinutes(bedTimeStr) {
  return timeToGridMinutes(bedTimeStr);
}

/**
 * @param {object[]} blocks normalized blocks
 * @param {string} bedTimeStr user preferred bedtime
 */
export function getSleepConflicts(blocks, bedTimeStr) {
  const bed = parseBedMinutes(bedTimeStr);
  const risky = [];
  for (const b of blocks) {
    if (b.type === 'sleep') continue;
    const studyLike = b.type === 'study' || b.type === 'homework';
    if (!studyLike) continue;
    if (b.startMinutes >= bed || b.endMinutes > bed) {
      risky.push(b);
    }
  }
  return risky;
}

export function computeSleepScore(blocks, bedTimeStr) {
  const conflicts = getSleepConflicts(blocks, bedTimeStr).length;
  return Math.max(40, 100 - conflicts * 15);
}

export function computeRoutineBalanceScore(blocks) {
  const byDay = Array.from({ length: 7 }, () => ({
    work: 0,
    free: 0,
    sleep: 0,
  }));
  for (const b of blocks) {
    const len = b.endMinutes - b.startMinutes;
    const t = byDay[b.day];
    if (b.type === 'sleep') t.sleep += len;
    else if (['school', 'study', 'homework'].includes(b.type)) t.work += len;
    else if (b.type === 'free') t.free += len;
  }
  const variances = [];
  for (const d of byDay) {
    const total = d.work + d.free + d.sleep || 1;
    const ratio = d.free / total;
    variances.push(Math.abs(0.25 - ratio));
  }
  const avgVar =
    variances.reduce((a, b) => a + b, 0) / variances.length;
  return Math.round(Math.max(55, 95 - avgVar * 120));
}

export function computeDailyLoadScore(blocks) {
  const mins = Array(7).fill(0);
  for (const b of blocks) {
    if (['school', 'study', 'homework', 'sports', 'clubs'].includes(b.type)) {
      mins[b.day] += b.endMinutes - b.startMinutes;
    }
  }
  const avg = mins.reduce((a, b) => a + b, 0) / 7;
  const peak = Math.max(...mins);
  const stress = peak - avg;
  return Math.round(Math.max(50, 100 - stress / 3));
}

/**
 * Weekly schedule score 0-100 with breakdown
 */
export function computeWeeklyScheduleScore(blocks, bedTimeStr) {
  const sleep = computeSleepScore(blocks, bedTimeStr);
  const studyDist = computeStudyDistribution(blocks);
  const freeBal = computeRoutineBalanceScore(blocks);
  const stressRisk = 100 - Math.min(40, estimateStressRisk(blocks));

  const total = Math.round(
    sleep * 0.35 + studyDist * 0.25 + freeBal * 0.2 + stressRisk * 0.2
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      sleepBalance: sleep,
      studyDistribution: studyDist,
      freeTimeBalance: freeBal,
      stressRisk: stressRisk,
    },
  };
}

function computeStudyDistribution(blocks) {
  const studyByDay = Array(7).fill(0);
  for (const b of blocks) {
    if (b.type === 'study' || b.type === 'homework') {
      studyByDay[b.day] += b.endMinutes - b.startMinutes;
    }
  }
  const nonzero = studyByDay.filter((x) => x > 0);
  if (nonzero.length === 0) return 70;
  const mean = nonzero.reduce((a, b) => a + b, 0) / nonzero.length;
  let varSum = 0;
  for (const x of studyByDay) {
    if (x > 0) varSum += (x - mean) ** 2;
  }
  const spread = Math.sqrt(varSum / nonzero.length);
  return Math.round(Math.max(55, 92 - spread / 8));
}

function estimateStressRisk(blocks) {
  const daily = Array(7).fill(0);
  for (const b of blocks) {
    if (['school', 'study', 'homework'].includes(b.type)) {
      daily[b.day] += b.endMinutes - b.startMinutes;
    }
  }
  const over = daily.filter((m) => m > 9 * 60).length;
  return over * 12;
}

export function getProductivityPulse(blocks, dayIndex) {
  const today = blocks.filter((b) => b.day === dayIndex);
  const doneTypes = new Set(['school', 'homework', 'study']);
  const total = today.reduce(
    (acc, b) => acc + (doneTypes.has(b.type) ? b.endMinutes - b.startMinutes : 0),
    0
  );
  const max = 8 * 60;
  return Math.min(100, Math.round((total / max) * 100));
}
