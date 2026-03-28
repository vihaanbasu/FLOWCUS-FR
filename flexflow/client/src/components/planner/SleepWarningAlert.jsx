import { motion, AnimatePresence } from 'framer-motion';

export function SleepWarningAlert({ show, conflictCount, bedTime }) {
  return (
    <AnimatePresence>
      {show && conflictCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          <p className="font-semibold">Sleep-aware tip</p>
          <p className="text-amber-200/90 mt-1">
            Late study near bedtime may reduce sleep and focus tomorrow. Consider
            moving {conflictCount} block(s) before {bedTime || '22:30'}.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
