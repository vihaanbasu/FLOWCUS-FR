import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api/index.js';
import { generateScheduleFromOnboarding } from '@/domain/schedule/autoSchedule.js';
import { useApp } from '@/context/AppContext.jsx';
import { Button } from '@/components/ui/Button.jsx';

const STEPS = [
  'profile',
  'sleep',
  'school',
  'activities',
  'homework',
  'review',
];

export function OnboardingWizard({ onDone }) {
  const { user, userId, loadBlocks, refreshUser } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    grade: '10',
    wakeTime: '07:00',
    bedTime: '22:30',
    schoolStart: '08:00',
    schoolEnd: '15:30',
    commuteMinutes: 30,
    homeworkLoad: 'medium',
    weekendWake: '09:00',
    weekendBed: '23:00',
    activities: [
      { name: 'Soccer practice', durationMins: 90, type: 'sports' },
      { name: 'Robotics club', durationMins: 60, type: 'clubs' },
    ],
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name:
        prev.name?.trim() !== '' ? prev.name : user.name || '',
      grade: user.grade ? user.grade : prev.grade,
    }));
  }, [user]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!userId) {
      alert('Session expired. Please sign in again.');
      return;
    }
    setLoading(true);
    try {
      const onboarding = {
        wakeTime: form.wakeTime,
        bedTime: form.bedTime,
        schoolStart: form.schoolStart,
        schoolEnd: form.schoolEnd,
        commuteMinutes: form.commuteMinutes,
        homeworkLoad: form.homeworkLoad,
        weekendWake: form.weekendWake,
        weekendBed: form.weekendBed,
        activities: form.activities,
      };
      await api.patchUser(userId, {
        name: form.name.trim(),
        grade: form.grade,
        wake_time: form.wakeTime,
        bed_time: form.bedTime,
        onboarding,
      });
      const blocks = generateScheduleFromOnboarding(onboarding);
      await api.clearBlocks(userId);
      await api.bulkBlocks(userId, blocks);
      const u2 = await api.getUser(userId);
      const achievements = Array.from(
        new Set([...(u2.gamification?.achievements || []), 'setup_complete'])
      );
      await api.patchUser(userId, {
        gamification: {
          ...(u2.gamification || {}),
          studyStreak: 1,
          sleepStreak: 1,
          achievements,
          weeklyImprovement: 8,
        },
      });
      await refreshUser();
      await loadBlocks(userId);
      onDone?.();
    } catch (e) {
      console.error(e);
      alert('Could not finish setup. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const key = STEPS[step];
  const input =
    'mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-500/25 outline-none transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl glass border border-white/15 p-8 shadow-glass"
      >
        <div className="flex gap-1.5 mb-8" role="list" aria-label="Setup progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              role="listitem"
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-indigo-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {key === 'profile' && (
              <Step title="Let’s personalize FlexFlow">
                <Field label="What should we call you?">
                  <input
                    className={input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Name"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Grade">
                  <select
                    className={input}
                    value={form.grade}
                    onChange={(e) =>
                      setForm({ ...form, grade: e.target.value })
                    }
                  >
                    {['9', '10', '11', '12'].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </Field>
              </Step>
            )}
            {key === 'sleep' && (
              <Step title="Sleep anchors">
                <Field label="Usual wake time">
                  <input
                    type="time"
                    className={input}
                    value={form.wakeTime}
                    onChange={(e) =>
                      setForm({ ...form, wakeTime: e.target.value })
                    }
                  />
                </Field>
                <Field label="Target bedtime">
                  <input
                    type="time"
                    className={input}
                    value={form.bedTime}
                    onChange={(e) =>
                      setForm({ ...form, bedTime: e.target.value })
                    }
                  />
                </Field>
              </Step>
            )}
            {key === 'school' && (
              <Step title="School rhythm">
                <Field label="School starts">
                  <input
                    type="time"
                    className={input}
                    value={form.schoolStart}
                    onChange={(e) =>
                      setForm({ ...form, schoolStart: e.target.value })
                    }
                  />
                </Field>
                <Field label="School ends">
                  <input
                    type="time"
                    className={input}
                    value={form.schoolEnd}
                    onChange={(e) =>
                      setForm({ ...form, schoolEnd: e.target.value })
                    }
                  />
                </Field>
                <Field label="Commute (one way, minutes)">
                  <input
                    type="number"
                    className={input}
                    min={5}
                    value={form.commuteMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        commuteMinutes: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </Step>
            )}
            {key === 'activities' && (
              <Step title="After school">
                <p className="text-sm text-slate-400 mb-3">
                  We’ll sprinkle these across weekdays. Edit anytime in the
                  planner.
                </p>
                {form.activities.map((a, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className={`${input} flex-1`}
                      value={a.name}
                      onChange={(e) => {
                        const copy = [...form.activities];
                        copy[i] = { ...copy[i], name: e.target.value };
                        setForm({ ...form, activities: copy });
                      }}
                    />
                    <input
                      type="number"
                      className={`${input} w-20 shrink-0`}
                      value={a.durationMins}
                      onChange={(e) => {
                        const copy = [...form.activities];
                        copy[i] = {
                          ...copy[i],
                          durationMins: Number(e.target.value),
                        };
                        setForm({ ...form, activities: copy });
                      }}
                    />
                  </div>
                ))}
                <Field label="Weekend wake / bed">
                  <div className="flex gap-2">
                    <input
                      type="time"
                      className={`${input} flex-1`}
                      value={form.weekendWake}
                      onChange={(e) =>
                        setForm({ ...form, weekendWake: e.target.value })
                      }
                    />
                    <input
                      type="time"
                      className={`${input} flex-1`}
                      value={form.weekendBed}
                      onChange={(e) =>
                        setForm({ ...form, weekendBed: e.target.value })
                      }
                    />
                  </div>
                </Field>
              </Step>
            )}
            {key === 'homework' && (
              <Step title="Homework load">
                <Field label="Typical weekday homework">
                  <div className="grid grid-cols-3 gap-2">
                    {['light', 'medium', 'heavy'].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setForm({ ...form, homeworkLoad: h })}
                        className={`rounded-xl py-2.5 text-xs font-medium capitalize border transition-colors ${
                          form.homeworkLoad === h
                            ? 'bg-indigo-500/30 border-indigo-400/50 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </Field>
              </Step>
            )}
            {key === 'review' && (
              <Step title="You’re ready">
                <p className="text-sm text-slate-300 leading-relaxed">
                  We’ll generate your first week with school blocks, commute,
                  breaks, homework, study windows, and sleep — fully editable in
                  the planner.
                </p>
                <ul className="mt-4 text-xs text-slate-400 space-y-1.5">
                  <li>• Wake {form.wakeTime} · Bed {form.bedTime}</li>
                  <li>
                    • School {form.schoolStart}–{form.schoolEnd}
                  </li>
                  <li>• Commute ~{form.commuteMinutes} min each way</li>
                </ul>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex justify-between gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={back}
            disabled={step === 0 || loading}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button
              variant="success"
              type="button"
              onClick={finish}
              disabled={loading || !form.name.trim()}
            >
              {loading ? 'Building…' : 'Build my schedule'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Step({ title, children }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4 tracking-tight">
        {title}
      </h1>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm text-slate-300 mb-4">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
