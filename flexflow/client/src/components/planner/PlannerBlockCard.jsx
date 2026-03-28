import { motion } from 'framer-motion';
import { BLOCK_COLORS } from '@/domain/schedule/constants.js';
import { gridMinutesToLabel } from '@/domain/schedule/timeUtils.js';

export function PlannerBlockCard({
  block,
  drag,
  dayIndex,
  pxPerMinute,
  onPointerDownMove,
  onPointerDownResize,
  onEdit,
}) {
  const active = drag?.id === block.id;
  const startM =
    active && drag.mode === 'move' ? drag.previewStart : block.startMinutes;
  const endM = active && drag ? drag.previewEnd : block.endMinutes;
  const displayDay = active ? drag.previewDay : block.day;
  if (displayDay !== dayIndex) return null;

  const top = startM * pxPerMinute;
  const h = (endM - startM) * pxPerMinute;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`absolute left-1 right-1 rounded-xl border text-left shadow-soft cursor-grab active:cursor-grabbing z-10 overflow-hidden touch-none ${
        BLOCK_COLORS[block.type] || BLOCK_COLORS.other
      }`}
      style={{ top, height: Math.max(h, 18) }}
      onPointerDown={onPointerDownMove}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(block);
      }}
    >
      <div className="px-2 py-1 text-[10px] sm:text-xs font-semibold leading-tight truncate pointer-events-none">
        {block.title}
      </div>
      <div className="px-2 text-[9px] opacity-90 pointer-events-none tabular-nums">
        {gridMinutesToLabel(startM)} – {gridMinutesToLabel(endM)}
      </div>
      <button
        type="button"
        aria-label="Resize block"
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-black/10 hover:bg-black/25 border-t border-black/10"
        onPointerDown={onPointerDownResize}
      />
    </motion.div>
  );
}
