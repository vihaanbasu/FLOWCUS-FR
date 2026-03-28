import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext.jsx';
import { analyzeSchedule, bestStudyWindow } from '@/domain/schedule/analytics.js';
import { computeWeeklyScheduleScore } from '@/domain/schedule/scoring.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Card } from '@/components/ui/Card.jsx';

export function AnalyticsPage() {
  const { user, blocks } = useApp();
  const bed = user?.bed_time || '22:30';
  const insights = useMemo(() => analyzeSchedule(blocks, bed), [blocks, bed]);
  const window = useMemo(() => bestStudyWindow(blocks), [blocks]);
  const weekly = computeWeeklyScheduleScore(blocks, bed);

  const g = user?.gamification || {};
  const achievements = g.achievements || [];

  const badgeDefs = [
    {
      id: 'setup_complete',
      label: 'Plan starter',
      desc: 'Finished onboarding',
    },
    {
      id: 'balance',
      label: 'Balanced week',
      desc: 'Schedule score above 80',
      unlocked: weekly.total >= 80,
    },
    {
      id: 'sleep_streak',
      label: 'Sleep streak 3+',
      desc: 'Keep evenings clean',
      unlocked: (g.sleepStreak || 0) >= 3,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insights & gamification"
        description="Lightweight analytics that nudge better habits — not overwhelming charts."
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5" lift>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Weekly score</p>
          <p className="text-4xl font-display font-black mt-2">{weekly.total}</p>
        </Card>
        <Card className="p-5" lift>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Study streak</p>
          <p className="text-4xl font-display font-black mt-2">
            {g.studyStreak ?? 0}
            <span className="text-lg text-slate-500 font-semibold"> days</span>
          </p>
        </Card>
        <Card className="p-5" lift>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Sleep streak</p>
          <p className="text-4xl font-display font-black mt-2">
            {g.sleepStreak ?? 0}
            <span className="text-lg text-slate-500 font-semibold"> days</span>
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-display font-semibold mb-2">You study best…</h2>
        <p className="text-lg text-indigo-200">{window}</p>
        <p className="text-xs text-slate-500 mt-2">
          Inferred from where you place study & homework blocks.
        </p>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-display font-semibold">Coach notes</h2>
        {insights.map((ins) => (
          <div
            key={ins.title}
            className="rounded-xl bg-white/5 border border-white/10 p-3 flex gap-3"
          >
            <span className="h-8 w-8 rounded-full bg-indigo-500/25 flex items-center justify-center text-xs font-bold shrink-0">
              ✦
            </span>
            <div>
              <p className="text-sm font-medium">{ins.title}</p>
              <p className="text-xs text-slate-400 mt-1">{ins.detail}</p>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-sm text-slate-500">Everything looks chill right now.</p>
        )}
      </Card>

      <div>
        <h2 className="font-display font-semibold mb-3">Achievements</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badgeDefs.map((b) => {
            const unlocked =
              b.unlocked !== undefined
                ? b.unlocked
                : achievements.includes(b.id);
            return (
              <motion.div
                key={b.id}
                whileHover={{ y: -3 }}
                className={`rounded-2xl border p-4 ${
                  unlocked
                    ? 'border-amber-400/40 bg-amber-400/10'
                    : 'border-white/10 bg-white/[0.03] opacity-60'
                }`}
              >
                <p className="text-sm font-semibold">{b.label}</p>
                <p className="text-xs text-slate-400 mt-1">{b.desc}</p>
                <p className="text-[10px] mt-2 text-slate-500">
                  {unlocked ? 'Unlocked' : 'Locked'}
                </p>
              </motion.div>
            );
          })}
          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]"
          >
            <p className="text-sm font-semibold">Weekly improvement</p>
            <p className="text-xs text-slate-400 mt-1">
              Score delta vs last week (prototype)
            </p>
            <p className="text-2xl font-display font-bold mt-2 text-emerald-300">
              +{g.weeklyImprovement ?? 4}%
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
