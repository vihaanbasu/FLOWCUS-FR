import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext.jsx';
import { DAYS } from '@/domain/schedule/constants.js';
import { gridMinutesToLabel } from '@/domain/schedule/timeUtils.js';
import {
  computeSleepScore,
  computeRoutineBalanceScore,
  computeDailyLoadScore,
  computeWeeklyScheduleScore,
  getProductivityPulse,
} from '@/domain/schedule/scoring.js';
import { useNotifications } from '@/hooks/useNotifications.js';
import { useCoachInsightsNudge } from '@/hooks/useCoachInsightsNudge.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card, CardHeader } from '@/components/ui/Card.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';

function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

function minutesNowGrid() {
  const now = new Date();
  const minsMidnight = now.getHours() * 60 + now.getMinutes();
  const five = 5 * 60;
  return minsMidnight >= five ? minsMidnight - five : minsMidnight + 24 * 60 - five;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, userId, blocks, notificationsOn, setNotificationsOn } = useApp();
  const { requestPermission } = useNotifications();
  useCoachInsightsNudge(userId);
  const day = todayIndex();
  const nowG = minutesNowGrid();
  const bed = user?.bed_time || '22:30';

  const todayBlocks = useMemo(
    () =>
      blocks
        .filter((b) => b.day === day)
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [blocks, day]
  );

  const next = todayBlocks.find((b) => b.endMinutes > nowG);
  const remainingTasks = todayBlocks.filter(
    (b) =>
      (b.type === 'homework' || b.type === 'study') &&
      b.startMinutes > nowG
  ).length;

  const sleepScore = computeSleepScore(blocks, bed);
  const routineScore = computeRoutineBalanceScore(blocks);
  const loadScore = computeDailyLoadScore(blocks);
  const weekly = computeWeeklyScheduleScore(blocks, bed);
  const pulse = getProductivityPulse(blocks, day);

  /* bedtime countdown: approximate using bed_time string */
  const bedParts = bed.split(':').map(Number);
  const bedM = bedParts[0] * 60 + bedParts[1];
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  let minsToBed = bedM - nowM;
  if (minsToBed < 0) minsToBed += 24 * 60;

  const barPct = Math.min(100, pulse);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hey${user?.name ? `, ${user.name}` : ''}`}
        description={`${DAYS[day]} · Your day at a glance`}
        actions={
          <>
            <Button
              variant={notificationsOn ? 'success' : 'secondary'}
              size="sm"
              type="button"
              className={
                notificationsOn
                  ? '!bg-emerald-500/20 !border-emerald-500/40 !text-emerald-200'
                  : ''
              }
              onClick={async () => {
                const ok = await requestPermission();
                setNotificationsOn(ok);
              }}
            >
              {notificationsOn ? 'Notifications on' : 'Enable notifications'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => navigate('/planner')}
            >
              Open planner
            </Button>
          </>
        }
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 p-5" layout>
          <CardHeader
            title="Today"
            subtitle={`${todayBlocks.length} blocks`}
          />
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 planner-scroll">
            {todayBlocks.length === 0 && (
              <EmptyState
                title="No blocks today"
                description="Build your week in the planner to see your day here."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={() => navigate('/planner')}
                  >
                    Go to planner
                  </Button>
                }
              />
            )}
            {todayBlocks.map((b) => (
              <div
                key={b.id}
                className={`flex justify-between text-sm rounded-xl px-3 py-2 border border-white/10 ${
                  b.startMinutes <= nowG && b.endMinutes > nowG
                    ? 'bg-indigo-500/20'
                    : 'bg-white/5'
                }`}
              >
                <span className="font-medium truncate mr-2">{b.title}</span>
                <span className="text-slate-400 shrink-0 tabular-nums text-xs">
                  {gridMinutesToLabel(b.startMinutes)} –{' '}
                  {gridMinutesToLabel(b.endMinutes)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Day progress</span>
              <span>{barPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="rounded-2xl glass border border-white/10 p-5">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">
              Next up
            </h3>
            {next ? (
              <p className="mt-2 font-display text-lg font-semibold leading-snug">
                {next.title}
              </p>
            ) : (
              <p className="mt-2 text-slate-500 text-sm">Nothing left today 🎉</p>
            )}
            {next && (
              <p className="text-xs text-slate-400 mt-1 tabular-nums">
                {gridMinutesToLabel(next.startMinutes)} –{' '}
                {gridMinutesToLabel(next.endMinutes)}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-4">
              Study / homework left today:{' '}
              <span className="text-white font-semibold">{remainingTasks}</span>
            </p>
          </div>
          <div className="rounded-2xl glass border border-violet-500/25 p-5 bg-violet-500/5">
            <h3 className="text-xs uppercase tracking-wide text-violet-300/80">
              Sleep countdown
            </h3>
            <p className="mt-2 text-2xl font-display font-bold tabular-nums">
              {Math.floor(minsToBed / 60)}h {minsToBed % 60}m
            </p>
            <p className="text-xs text-slate-400 mt-1">Until target bedtime ({bed})</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ScoreCard label="Sleep score" value={sleepScore} tint="from-violet-500/30" />
        <ScoreCard label="Routine balance" value={routineScore} tint="from-cyan-500/25" />
        <ScoreCard label="Daily load" value={loadScore} tint="from-amber-500/25" />
        <ScoreCard label="Productivity pulse" value={pulse} tint="from-emerald-500/25" />
      </div>

      <motion.div
        layout
        className="rounded-2xl glass border border-white/10 p-6 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">
              Weekly schedule score
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Holistic view of sleep, study spread, and stress risk
            </p>
          </div>
          <div className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300">
            {weekly.total}
            <span className="text-lg text-slate-500 font-semibold">/100</span>
          </div>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <BreakRow label="Sleep balance" v={weekly.breakdown.sleepBalance} />
          <BreakRow label="Study distribution" v={weekly.breakdown.studyDistribution} />
          <BreakRow label="Free time balance" v={weekly.breakdown.freeTimeBalance} />
          <BreakRow label="Stress resiliency" v={weekly.breakdown.stressRisk} />
        </div>
      </motion.div>

      <motion.div
        layout
        className="rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 to-violet-600/10 p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-indigo-100">
              FlexFlow Coach
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Personalized schedule and sleep tips from your real calendar. Open
              the coach for chat, rescue ideas, and weekly review.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => navigate('/coach')}
          >
            Open coach
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/focus"
          className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-sm font-medium glass-hover"
        >
          Enter focus mode
        </Link>
        <Link
          to="/sleep"
          className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-sm font-medium glass-hover"
        >
          Sleep insights
        </Link>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border border-white/10 p-4 bg-gradient-to-br ${tint} to-transparent`}
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-display font-bold mt-1">{value}</p>
    </motion.div>
  );
}

function BreakRow({ label, v }) {
  return (
    <div className="rounded-xl bg-black/25 border border-white/10 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold mt-1">{v}</p>
    </div>
  );
}
