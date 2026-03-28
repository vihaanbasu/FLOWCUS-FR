import { gridMinutesToLabel } from '@/domain/schedule/timeUtils.js';
import { HOUR_HEIGHT, GRID_PX, HOUR_TICKS } from './plannerGridConfig.js';

export function TimeRuler() {
  return (
    <div className="w-14 shrink-0 border-r border-white/10 bg-black/25 overflow-hidden select-none">
      <div style={{ height: GRID_PX + 40 }} className="relative pt-8">
        {HOUR_TICKS.slice(0, -1).map((i) => (
          <div
            key={i}
            className="absolute text-[10px] text-slate-500 right-1 pr-1 font-medium tabular-nums"
            style={{ top: i * HOUR_HEIGHT + 32 }}
          >
            {gridMinutesToLabel(i * 60)}
          </div>
        ))}
      </div>
    </div>
  );
}
