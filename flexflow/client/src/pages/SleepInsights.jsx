import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useApp } from '@/context/AppContext.jsx';
import { api } from '@/services/api/index.js';
import { analyzeSchedule } from '@/domain/schedule/analytics.js';
import { getSleepConflicts } from '@/domain/schedule/scoring.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Button } from '@/components/ui/Button.jsx';

function Stat({ title, value, hint }) {
  return (
    <div className="rounded-2xl glass border border-white/10 p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="text-2xl font-display font-bold mt-1">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
    </div>
  );
}

export function SleepInsights() {
  const { userId, user, blocks } = useApp();
  const [rows, setRows] = useState([]);
  const bed = user?.bed_time || '22:30';

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!userId) return;
      try {
        const data = await api.getSleep(userId);
        if (!cancel) setRows(data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);

  const lateBlocks = useMemo(
    () => getSleepConflicts(blocks, bed).length,
    [blocks, bed]
  );

  const chartData = useMemo(() => {
    if (rows.length) {
      return [...rows].reverse().map((r) => ({
        name: r.date?.slice(5) || r.date,
        score: r.sleepScore ?? 72,
      }));
    }
    return [1, 2, 3, 4, 5, 6, 7].map((i) => ({
      name: `D${i}`,
      score: 72 + ((i * 3) % 5),
    }));
  }, [rows]);

  const avgScore =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((a, c) => a + c.score, 0) / chartData.length
        )
      : null;

  const dayLoad = useMemo(() => {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return names.map((n, i) => {
      const mins = blocks
        .filter((b) => b.day === i && ['study', 'homework'].includes(b.type))
        .reduce((a, b) => a + (b.endMinutes - b.startMinutes), 0);
      return { name: n, mins: Math.round(mins / 60) };
    });
  }, [blocks]);

  const insights = analyzeSchedule(blocks, bed);

  const logQuick = async () => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    await api.logSleep(userId, {
      date: today,
      sleepTime: bed,
      wakeTime: user?.wake_time || '07:00',
      sleepScore: 78,
    });
    const data = await api.getSleep(userId);
    setRows(data);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sleep insights"
        description="Track consistency, spot late-night work, and keep your week realistic."
        actions={
          <Button
            variant="primary"
            size="md"
            type="button"
            className="!bg-violet-600 !border-violet-400/40 hover:!bg-violet-500 shrink-0"
            onClick={logQuick}
          >
            Log quick entry
          </Button>
        }
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Stat
          title="Target bedtime"
          value={bed}
          hint="From your profile"
        />
        <Stat
          title="Late-night study blocks"
          value={String(lateBlocks)}
          hint="Past target bedtime"
        />
        <Stat
          title="Avg. sleep score"
          value={avgScore != null ? String(avgScore) : '—'}
          hint="From logged nights"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          layout
          className="rounded-2xl glass border border-white/10 p-4 h-72"
        >
          <p className="text-sm font-semibold mb-2">Sleep score trend</p>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                fill="url(#sc)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          layout
          className="rounded-2xl glass border border-white/10 p-4 h-72"
        >
          <p className="text-sm font-semibold mb-2">Study hours by weekday</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={dayLoad}>
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="mins" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="rounded-2xl glass border border-white/10 p-5 space-y-3">
        <h2 className="font-display font-semibold">Smart flags</h2>
        {insights.length === 0 && (
          <p className="text-sm text-slate-500">Looking balanced this week.</p>
        )}
        {insights.map((ins) => (
          <div
            key={ins.title + ins.type}
            className="rounded-xl bg-white/5 border border-white/10 p-3"
          >
            <p className="text-sm font-medium">{ins.title}</p>
            <p className="text-xs text-slate-400 mt-1">{ins.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
