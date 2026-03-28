/**
 * Rule-based FlexFlow coach: schedule, sleep, procrastination hints, rescue ideas.
 * No ML — deterministic heuristics over blocks, sleep logs, and move history.
 */

const FIVE_AM = 5 * 60;

/** @param {string} timeStr "HH:MM" */
export function timeToGridMinutes(timeStr) {
  const [h, m] = String(timeStr).split(':').map(Number);
  const fromMidnight = h * 60 + (m || 0);
  if (fromMidnight >= FIVE_AM) return fromMidnight - FIVE_AM;
  return 24 * 60 - FIVE_AM + fromMidnight;
}

export function gridMinutesToLabel(m) {
  const abs = FIVE_AM + m;
  const wrapped = abs >= 24 * 60 ? abs - 24 * 60 : abs;
  const hh = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const WORK_TYPES = new Set([
  'school',
  'study',
  'homework',
  'sports',
  'clubs',
  'commute',
]);

const STUDY_LIKE = new Set(['study', 'homework']);

const DEADLINE_RE = /due|deadline|exam|test|quiz|project|essay|paper|hw/i;

function normTitle(t) {
  return String(t || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** @param {import('./store.js').readStore extends Function} */
export function buildAssistantInsights({
  user,
  blocks,
  sleepRows,
  activityLog,
  now = new Date(),
}) {
  const wake = user?.wake_time || '07:00';
  const bed = user?.bed_time || '22:30';
  const bedG = timeToGridMinutes(bed);
  const wakeG = timeToGridMinutes(wake);
  const onboarding = user?.onboarding || {};
  const energyPeak = onboarding.energyPeak || 'afternoon';
  const name = user?.name?.split(/\s+/)[0] || 'there';

  /** @type {{ id: string, category: string, severity: 'info'|'warn'|'success', text: string }[]} */
  const insights = [];
  let id = 0;
  const add = (category, severity, text) => {
    insights.push({
      id: `i${++id}`,
      category,
      severity,
      text,
    });
  };

  const workMinsByDay = Array(7).fill(0);
  const freeMinsByDay = Array(7).fill(0);
  const studyMinsByDay = Array(7).fill(0);
  const studyBuckets = { morning: 0, afternoon: 0, evening: 0 };

  for (const b of blocks) {
    const len = b.end_minutes - b.start_minutes;
    if (b.type === 'free') freeMinsByDay[b.day] += len;
    if (WORK_TYPES.has(b.type)) workMinsByDay[b.day] += len;
    if (STUDY_LIKE.has(b.type)) {
      studyMinsByDay[b.day] += len;
      const mid = (b.start_minutes + b.end_minutes) / 2;
      if (mid < 7 * 60) studyBuckets.morning += len;
      else if (mid < 12 * 60) studyBuckets.afternoon += len;
      else studyBuckets.evening += len;
    }
  }

  const lateNight = [];
  const sleepConflict = [];
  const eveningStudyStart = timeToGridMinutes('21:00');
  for (const b of blocks) {
    if (b.type === 'sleep') continue;
    if (STUDY_LIKE.has(b.type)) {
      if (b.start_minutes >= eveningStudyStart || b.end_minutes > bedG) {
        lateNight.push(b);
      }
      if (b.start_minutes >= bedG || b.end_minutes > bedG) {
        sleepConflict.push(b);
      }
    }
  }

  if (lateNight.length >= 2) {
    add(
      'schedule',
      'warn',
      `You have ${lateNight.length} late-evening study blocks this week. Consider moving one earlier or adding a wind-down buffer before bed.`
    );
  } else if (lateNight.length === 1) {
    const b = lateNight[0];
    add(
      'sleep',
      'warn',
      `You have a late-night study session on ${dayName(
        b.day
      )}. Shifting it earlier can improve sleep quality and tomorrow's focus.`
    );
  }

  if (sleepConflict.length > 0) {
    add(
      'sleep',
      'warn',
      `${sleepConflict.length} study block(s) overlap your target bedtime (${bed}). Protecting that window helps your sleep streak.`
    );
  }

  for (let d = 0; d < 7; d++) {
    const workH = workMinsByDay[d] / 60;
    if (workH > 10) {
      add(
        'schedule',
        'warn',
        `${dayName(
          d
        )} looks overloaded (~${workH.toFixed(1)}h of commitments). A 30-minute break or shorter tasks can reduce stress.`
      );
    } else if (workH > 8.5) {
      add(
        'schedule',
        'info',
        `${dayName(d)} is pretty full. If energy dips, swap one block for recovery time.`
      );
    }
    if (workMinsByDay[d] > 6 * 60 && freeMinsByDay[d] < 30) {
      add(
        'schedule',
        'warn',
        `On ${dayName(
          d
        )}, there's little free time scheduled. Even a short walk between blocks helps.`
      );
    }
  }

  const studyVariance = variance(studyMinsByDay.filter((x) => x > 0));
  if (studyVariance > 120 ** 2 && studyMinsByDay.some((x) => x > 0)) {
    add(
      'schedule',
      'info',
      'Study time is uneven across the week. Spreading sessions can prevent cram nights.'
    );
  }

  const peakBucket = maxKey(studyBuckets);
  const peakLabel = {
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
  }[peakBucket];
  if (studyBuckets[peakBucket] > 0) {
    add(
      'energy',
      'info',
      `You pack the most study time in the ${peakLabel}. ${
        energyPeak === peakBucket
          ? 'That matches your energy preference — nice alignment.'
          : `You marked "${energyPeak}" as your peak focus window — try shifting harder subjects into that part of the day.`
      }`
    );
  }

  const log = (activityLog || []).filter((e) => e.user_id === user?.id);
  const recent = log.filter((e) => {
    const t = new Date(e.at).getTime();
    return now.getTime() - t < 14 * 86400000;
  });
  const byTitle = {};
  for (const e of recent) {
    const key = normTitle(e.title);
    if (!key) continue;
    byTitle[key] = (byTitle[key] || 0) + 1;
  }
  for (const [title, n] of Object.entries(byTitle)) {
    if (n >= 3 && title.length > 1) {
      add(
        'habits',
        'info',
        `You often reschedule "${truncate(
          title,
          40
        )}". Starting it right after school may help you finish earlier (and sleep better).`
      );
      break;
    }
  }

  const sleepScores = sleepRows
    .map((r) => r.sleep_score)
    .filter((x) => x != null && !Number.isNaN(Number(x)));
  if (sleepScores.length >= 3) {
    const avg =
      sleepScores.reduce((a, b) => a + Number(b), 0) / sleepScores.length;
    if (avg < 65) {
      add(
        'sleep',
        'warn',
        'Recent sleep scores are a bit low. Aim for a consistent bedtime Wind-down without screens 30–45 minutes before bed helps.'
      );
    } else if (avg >= 78) {
      add(
        'sleep',
        'success',
        'Sleep quality looks solid lately. Keep protecting your bedtime routine.'
      );
    }
  }

  const gam = user?.gamification || {};
  const sleepStreak = gam.sleepStreak || 0;
  const studyStreak = gam.studyStreak || 0;
  if (sleepStreak >= 5) {
    add(
      'motivation',
      'success',
      `Great job — ${sleepStreak}-day sleep streak! Consistency is huge for focus at school.`
    );
  } else if (sleepStreak >= 3) {
    add(
      'motivation',
      'info',
      `${sleepStreak} nights on track for sleep. One more steady week unlocks stronger recovery.`
    );
  }
  if (studyStreak >= 5) {
    add(
      'motivation',
      'success',
      `Study streak is at ${studyStreak} — you're building a serious habit.`
    );
  }

  const tips = buildTips({ bed, wake, energyPeak, lateNight, name });

  const badges = [
    {
      id: 'sleep_streak',
      label: 'Sleep streak',
      value: sleepStreak,
      highlight: sleepStreak >= 5,
    },
    {
      id: 'study_streak',
      label: 'Study streak',
      value: studyStreak,
      highlight: studyStreak >= 5,
    },
    {
      id: 'schedule_balance',
      label: 'Balance',
      value: lateNight.length === 0 ? 'On track' : 'Tune evenings',
      highlight: lateNight.length === 0,
    },
  ];

  const rescue = buildRescueSuggestions(blocks, now, bedG, wakeG);

  const weeklySummary = buildWeeklySummary({
    now,
    sleepRows,
    studyMinsByDay,
    workMinsByDay,
    lateNight,
    sleepStreak,
  });

  return {
    insights,
    tips,
    badges,
    rescue,
    weeklySummary,
    meta: {
      generatedAt: now.toISOString(),
      bedGrid: bedG,
      energyPeak,
    },
  };
}

export function replyCoachChat(message, ctx) {
  const m = String(message || '').toLowerCase();
  const pack = buildAssistantInsights(ctx);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (/sleep|tired|insomnia|bed/.test(m)) {
    const sleepInsights = pack.insights.filter((i) => i.category === 'sleep');
    if (sleepInsights.length)
      return { reply: pick(sleepInsights).text, usedInsight: true };
    return {
      reply: `Protect your wind-down: dim lights, same bedtime most nights, and avoid heavy study right before ${ctx.user?.bed_time || 'bedtime'} when you can.`,
      usedInsight: false,
    };
  }
  if (/stress|overwhelm|too much|busy/.test(m)) {
    return {
      reply:
        'Overload shows up in your calendar before your body says stop. Try one shorter day: drop or shorten a non-essential block, and add 30 minutes of free space.',
      usedInsight: false,
    };
  }
  if (/procrast|delay|put off/.test(m)) {
    const h = pack.insights.find((i) => i.category === 'habits');
    if (h) return { reply: h.text, usedInsight: true };
    return {
      reply:
        'Pick one small “start” ritual: two minutes on the hardest task right after school. Momentum beats waiting for the “perfect” hour.',
      usedInsight: false,
    };
  }
  if (/streak|motivat|proud/.test(m)) {
    const g = pack.insights.find((i) => i.category === 'motivation');
    if (g) return { reply: g.text, usedInsight: true };
    return {
      reply:
        "You're showing up — that counts. Tiny repeatable wins (same bedtime, one focused block) compound fast.",
      usedInsight: false,
    };
  }
  if (/help|idea|tip|what should/.test(m)) {
    return {
      reply: pick(
        pack.tips.length
          ? pack.tips
          : [
              'Skim your week: balance heavy days with lighter ones when possible.',
            ]
      ),
      usedInsight: false,
    };
  }

  const top =
    pack.insights.find((i) => i.severity === 'warn') || pack.insights[0];
  if (top) return { reply: top.text, usedInsight: true };
  return {
    reply:
      "I'm here to help with sleep, study timing, and balance. Try asking about sleep, stress, procrastination, or ask for a tip!",
    usedInsight: false,
  };
}

function buildTips({ bed, wake, energyPeak, lateNight, name }) {
  const tips = [
    `Hey ${name} — brief planner reviews on Sunday make Monday calmer.`,
    `Match hard subjects to your ${energyPeak} energy when possible.`,
    'A 5-minute stretch between blocks beats powering through fog.',
    `Target wake ${wake} and bed ${bed} — consistency matters more than perfection.`,
  ];
  if (lateNight.length) {
    tips.push(
      'Try “closing” study 60 minutes before bed: notes-only or light review.'
    );
  }
  return tips;
}

function buildRescueSuggestions(blocks, now, bedG, _wakeG) {
  const suggestions = [];
  const upcoming = blocks.filter(
    (b) =>
      STUDY_LIKE.has(b.type) &&
      (DEADLINE_RE.test(b.title || '') || normTitle(b.title).includes('due'))
  );
  const dow = (now.getDay() + 6) % 7;
  const tomorrow = (dow + 1) % 7;
  const soon = upcoming.filter((b) => b.day === tomorrow || b.day === dow);
  for (const b of soon.slice(0, 2)) {
    const slot = firstAfternoonSlot(blocks, b.day === dow ? dow : tomorrow);
    suggestions.push({
      blockId: b.id,
      title: b.title || 'Focused study',
      message: `"${
        b.title || 'This task'
      }" looks time-sensitive. A ${Math.min(
        90,
        Math.max(45, b.end_minutes - b.start_minutes)
      )}-minute focused session earlier in the day protects your sleep.`,
      suggestedDay: b.day === dow ? dow : tomorrow,
      suggestedStartMinutes: slot,
      suggestedLabel: gridMinutesToLabel(slot),
      durationMins: 60,
    });
  }
  if (suggestions.length === 0 && upcoming.length > 0) {
    const b = upcoming[0];
    const slot = firstAfternoonSlot(blocks, b.day);
    suggestions.push({
      blockId: b.id,
      title: b.title || 'Study',
      message: `Consider a dedicated block earlier (${gridMinutesToLabel(
        slot
      )}) so you're not chasing this near bedtime.`,
      suggestedDay: b.day,
      suggestedStartMinutes: slot,
      suggestedLabel: gridMinutesToLabel(slot),
      durationMins: 60,
    });
  }
  return suggestions;
}

/** Prefer ~4 PM grid slot without overlapping same-day blocks */
function firstAfternoonSlot(blocks, day) {
  const desired = timeToGridMinutes('16:00');
  const dayBlocks = blocks
    .filter((b) => b.day === day && b.type !== 'sleep')
    .sort((a, b) => a.start_minutes - b.start_minutes);
  const dur = 60;
  let candidate = desired;
  for (let tries = 0; tries < 8; tries++) {
    const end = candidate + dur;
    const clash = dayBlocks.some(
      (b) => candidate < b.end_minutes && end > b.start_minutes
    );
    if (!clash) return candidate;
    candidate += 30;
  }
  return timeToGridMinutes('15:00');
}

function buildWeeklySummary({
  now,
  sleepRows,
  studyMinsByDay,
  workMinsByDay,
  lateNight,
  sleepStreak,
}) {
  const day = now.getDay();
  const isWeekWrap = day === 0 || day === 1 || day === 6;
  if (!isWeekWrap) {
    return { ready: false, title: null, bullets: [] };
  }
  const bullets = [];
  const last7 = sleepRows.slice(0, 7);
  if (last7.length) {
    const scores = last7
      .map((r) => r.sleep_score)
      .filter((x) => x != null);
    if (scores.length)
      bullets.push(
        `Avg logged sleep score: ${(
          scores.reduce((a, b) => a + Number(b), 0) / scores.length
        ).toFixed(0)}/100`
      );
  }
  const totalStudyH =
    studyMinsByDay.reduce((a, b) => a + b, 0) / 60;
  bullets.push(`Study/homework planned: ~${totalStudyH.toFixed(1)}h total`);
  const peakDay = workMinsByDay.indexOf(Math.max(...workMinsByDay));
  bullets.push(`Busiest day: ${dayName(peakDay)}`);
  if (lateNight.length)
    bullets.push(
      `${lateNight.length} evening study block(s) — try shifting one earlier next week`
    );
  else bullets.push('No late-night study blocks flagged — nice boundary.');
  if (sleepStreak >= 3)
    bullets.push(`${sleepStreak}-day sleep streak — keep the rhythm.`);

  return {
    ready: true,
    title: 'Week in review',
    bullets,
  };
}

function dayName(i) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || 'Day';
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
}

function maxKey(obj) {
  let k = 'afternoon';
  let v = -1;
  for (const [key, val] of Object.entries(obj)) {
    if (val > v) {
      v = val;
      k = key;
    }
  }
  return k;
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}
