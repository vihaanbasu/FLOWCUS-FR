import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MOTIVATION_MESSAGES } from '@/domain/schedule/constants.js';
import { Button } from '@/components/ui/Button.jsx';

const PRESETS = [
  { label: '25 / 5', work: 25 * 60, break: 5 * 60 },
  { label: '50 / 10', work: 50 * 60, break: 10 * 60 },
  { label: 'Deep 40', work: 40 * 60, break: 8 * 60 },
];

export function FocusMode() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [phase, setPhase] = useState('work');
  const [seconds, setSeconds] = useState(PRESETS[0].work);
  const [running, setRunning] = useState(false);
  const [blockSites, setBlockSites] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    setPhase('work');
    setSeconds(preset.work);
    setRunning(false);
  }, [preset]);

  useEffect(() => {
    if (!running) return undefined;
    if (seconds <= 0) {
      setPhase((p) => {
        const next = p === 'work' ? 'break' : 'work';
        setSeconds(next === 'work' ? preset.work : preset.break);
        setMsgIndex((i) => (i + 1) % MOTIVATION_MESSAGES.length);
        return next;
      });
      return undefined;
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, seconds, preset]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key="focus"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-3xl glass border border-white/15 p-8 text-center shadow-glass"
        >
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-300 float-right -mt-2"
          >
            Exit
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300/80">
            Focus mode
          </p>
          <h1 className="font-display text-3xl font-bold mt-2">
            {phase === 'work' ? 'Deep work' : 'Breathe'}
          </h1>
          <p className="text-sm text-slate-400 mt-3 min-h-[40px] px-2">
            {MOTIVATION_MESSAGES[msgIndex]}
          </p>
          <div className="mt-8 font-display text-7xl sm:text-8xl font-black tabular-nums tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
            {mm}:{ss}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  preset.label === p.label
                    ? 'bg-indigo-500/30 border-indigo-400/50'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              type="button"
              className="min-w-[120px]"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? 'Pause' : 'Start'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              type="button"
              onClick={() => {
                setRunning(false);
                setPhase('work');
                setSeconds(preset.work);
              }}
            >
              Reset
            </Button>
          </div>
          <label className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={blockSites}
              onChange={(e) => setBlockSites(e.target.checked)}
            />
            Website blocker mode (pair with a browser extension for real blocking)
          </label>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
