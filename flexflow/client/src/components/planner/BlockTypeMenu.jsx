import { motion, AnimatePresence } from 'framer-motion';
import { BLOCK_TYPES } from '@/domain/schedule/constants.js';

export function BlockTypeMenu({ open, onPick }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute z-30 left-1 right-1 top-10 rounded-xl bg-slate-900/95 border border-white/15 p-2 flex flex-wrap gap-1 shadow-xl"
        >
          {Object.values(BLOCK_TYPES).map((t) => (
            <button
              key={t.key}
              type="button"
              className="text-[10px] px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => onPick(t.key)}
            >
              {t.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
