import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext.jsx';
import { api, getErrorMessage } from '@/services/api/index.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card, CardHeader } from '@/components/ui/Card.jsx';

const ENERGY_OPTIONS = [
  { value: 'morning', label: 'Morning — sharpest before noon' },
  { value: 'afternoon', label: 'Afternoon — peak after lunch' },
  { value: 'evening', label: 'Evening — night owl energy' },
];

export function CoachPage() {
  const { user, userId, refreshUser } = useApp();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [coachNotify, setCoachNotify] = useState(
    () => localStorage.getItem('flexflow_coach_notify') === '1'
  );
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.insights(userId);
      setInsights(data);
      setMessages((prev) => {
        if (
          prev.length === 1 &&
          prev[0].role === 'coach' &&
          prev[0].text.includes("couldn't load")
        ) {
          const first =
            data.insights?.find((i) => i.severity === 'warn') ||
            data.insights?.[0];
          return [
            {
              role: 'coach',
              text: first
                ? first.text
                : `Hi${user?.name ? `, ${user.name.split(/\s+/)[0]}` : ''}! I'm your FlexFlow coach — ask me about sleep, stress, procrastination, or your schedule.`,
            },
          ];
        }
        return prev;
      });
    } catch (e) {
      console.error(e);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.name]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      if (insights) {
        const first =
          insights.insights?.find((i) => i.severity === 'warn') ||
          insights.insights?.[0];
        return [
          {
            role: 'coach',
            text: first
              ? first.text
              : `Hi${user?.name ? `, ${user.name.split(/\s+/)[0]}` : ''}! I'm your FlexFlow coach — ask me about sleep, stress, procrastination, or your schedule.`,
          },
        ];
      }
      return [
        {
          role: 'coach',
          text: "I couldn't load coach insights. Check that the server is running, then tap Refresh.",
        },
      ];
    });
  }, [loading, insights, user?.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = async (e) => {
    e.preventDefault();
    const t = chatInput.trim();
    if (!t || !userId || sending) return;
    setChatInput('');
    setMessages((m) => [...m, { role: 'user', text: t }]);
    setSending(true);
    try {
      const { reply } = await api.chat(userId, t);
      setMessages((m) => [...m, { role: 'coach', text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'coach', text: getErrorMessage(err) },
      ]);
    } finally {
      setSending(false);
    }
  };

  const saveEnergy = async (value) => {
    if (!userId || !user) return;
    try {
      await api.patchUser(userId, {
        onboarding: { ...user.onboarding, energyPeak: value },
      });
      await refreshUser();
      await load();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const toggleNotify = (on) => {
    setCoachNotify(on);
    localStorage.setItem('flexflow_coach_notify', on ? '1' : '0');
  };

  const energyPeak = user?.onboarding?.energyPeak || 'afternoon';

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <PageHeader
        title="FlexFlow Coach"
        description="Personal productivity and sleep coach — powered by your real schedule."
        actions={
          <Button variant="secondary" size="sm" type="button" onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden border-indigo-500/20">
            <div className="px-5 py-4 border-b border-white/10 bg-indigo-500/10">
              <CardHeader
                title="Chat"
                subtitle="Friendly, private tips from your calendar — no account data leaves your browser except to your FlexFlow server."
              />
            </div>
            <div className="p-4 max-h-[min(52vh,420px)] overflow-y-auto space-y-3 planner-scroll">
              {loading && (
                <p className="text-sm text-slate-500">Loading coach…</p>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-500/35 border border-indigo-400/30 text-white'
                          : 'bg-white/10 border border-white/15 text-slate-100'
                      }`}
                    >
                      {msg.role === 'coach' && (
                        <span className="text-[10px] uppercase tracking-wide text-indigo-300/90 block mb-1.5">
                          Coach
                        </span>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
            <form
              onSubmit={sendChat}
              className="p-4 border-t border-white/10 flex gap-2"
            >
              <label className="sr-only" htmlFor="coach-chat">
                Message
              </label>
              <input
                id="coach-chat"
                className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400/40 outline-none"
                placeholder="Ask about sleep, stress, procrastination…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={sending || !userId}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={sending || !chatInput.trim() || !userId}
              >
                Send
              </Button>
            </form>
          </Card>

          {insights?.rescue?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5"
            >
              <h3 className="font-display font-bold text-lg text-amber-100">
                Rescue ideas
              </h3>
              <p className="text-xs text-amber-200/70 mt-1 mb-4">
                Suggestions to finish strong without trading sleep — add blocks in
                the planner when one fits.
              </p>
              <ul className="space-y-3">
                {insights.rescue.map((r, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl bg-black/20 border border-white/10 p-4 text-sm"
                  >
                    <p className="text-slate-200">{r.message}</p>
                    <p className="text-xs text-amber-200/80 mt-2 tabular-nums">
                      Suggested: {r.suggestedLabel} · ~{r.durationMins} min
                    </p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              title="Your energy rhythm"
              subtitle="Used to align hard tasks with when you focus best."
            />
            <div className="mt-4 space-y-2">
              {ENERGY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => saveEnergy(opt.value)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 text-xs border transition-colors ${
                    energyPeak === opt.value
                      ? 'bg-indigo-500/25 border-indigo-400/40 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader
              title="Proactive nudges"
              subtitle="Optional browser notifications when the dashboard spots risks."
            />
            <button
              type="button"
              onClick={() => toggleNotify(!coachNotify)}
              className={`mt-3 w-full rounded-xl px-3 py-2 text-xs font-medium border transition-colors ${
                coachNotify
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              {coachNotify ? 'Coach nudges: on' : 'Coach nudges: off'}
            </button>
          </Card>

          <Card className="p-5">
            <CardHeader title="Tips library" subtitle="Micro-habits that compound." />
            <ul className="mt-3 space-y-2">
              <AnimatePresence>
                {(insights?.tips || []).map((tip, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-slate-400 leading-relaxed pl-3 border-l-2 border-indigo-500/40"
                  >
                    {tip}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Card>

          {insights?.weeklySummary?.ready && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl glass border border-white/15 p-5"
            >
              <h3 className="font-display font-bold text-base">
                {insights.weeklySummary.title}
              </h3>
              <ul className="mt-3 text-xs text-slate-400 space-y-2">
                {insights.weeklySummary.bullets.map((b, i) => (
                  <li key={i}>• {b}</li>
                ))}
              </ul>
            </motion.div>
          )}

          {insights?.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {insights.badges.map((b) => (
                <span
                  key={b.id}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                    b.highlight
                      ? 'border-emerald-400/50 text-emerald-200 bg-emerald-500/15'
                      : 'border-white/15 text-slate-400 bg-white/5'
                  }`}
                >
                  {b.label}
                  {typeof b.value !== 'undefined' && (
                    <span className="text-slate-300"> · {b.value}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {insights?.insights?.length > 0 && (
        <Card className="p-5">
          <CardHeader
            title="All signals this week"
            subtitle="Schedule, sleep, habits, and motivation — from your data."
          />
          <ul className="mt-4 space-y-2">
            {insights.insights.map((item) => (
              <motion.li
                key={item.id}
                layout
                className={`rounded-xl px-3 py-2 text-sm border ${
                  item.severity === 'warn'
                    ? 'bg-amber-500/10 border-amber-400/25 text-amber-50'
                    : item.severity === 'success'
                      ? 'bg-emerald-500/10 border-emerald-400/25 text-emerald-50'
                      : 'bg-white/5 border-white/10 text-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wide text-slate-500 block mb-0.5">
                  {item.category}
                </span>
                {item.text}
              </motion.li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
