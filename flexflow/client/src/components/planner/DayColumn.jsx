import { DAYS } from '@/domain/schedule/constants.js';
import { HOUR_HEIGHT, GRID_PX, HOUR_TICKS } from './plannerGridConfig.js';
import { BlockTypeMenu } from './BlockTypeMenu.jsx';
import { PlannerBlockCard } from './PlannerBlockCard.jsx';

export function DayColumn({
  dayIndex,
  columnRef,
  blocks,
  drag,
  pxPerMinute,
  addMenuOpen,
  onToggleAddMenu,
  onPickBlockType,
  onGridDoubleClick,
  beginMove,
  beginResize,
  setEditing,
}) {
  const label = DAYS[dayIndex];
  const dayBlocks = blocks.filter((b) => b.day === dayIndex);

  return (
    <div
      ref={columnRef}
      className="flex-1 min-w-[100px] border-r border-white/5 last:border-r-0 relative"
    >
      <div className="sticky top-0 z-20 glass border-b border-white/10 px-2 py-2 text-center backdrop-blur-xl">
        <p className="text-xs font-display font-semibold text-white/90">
          {label.slice(0, 3)}
        </p>
        <p className="text-[10px] text-slate-500 hidden sm:block">{label}</p>
        <button
          type="button"
          onClick={onToggleAddMenu}
          className="mt-1 text-[10px] font-medium text-indigo-300 hover:text-white transition-colors"
        >
          + Block
        </button>
      </div>
      <div
        className="relative bg-gradient-to-b from-white/[0.02] to-transparent"
        style={{ height: GRID_PX }}
        role="application"
        aria-label={`Schedule column ${label}`}
        onDoubleClick={onGridDoubleClick}
      >
        {HOUR_TICKS.map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-white/[0.06] pointer-events-none"
            style={{ top: i * HOUR_HEIGHT }}
          />
        ))}
        <BlockTypeMenu
          open={addMenuOpen}
          onPick={(type) => onPickBlockType(dayIndex, type)}
        />
        {dayBlocks.map((b) => (
          <PlannerBlockCard
            key={b.id}
            block={b}
            drag={drag}
            dayIndex={dayIndex}
            pxPerMinute={pxPerMinute}
            onPointerDownMove={(e) => beginMove(e, b)}
            onPointerDownResize={(e) => beginResize(e, b)}
            onEdit={setEditing}
          />
        ))}
      </div>
    </div>
  );
}
