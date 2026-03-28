import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DAYS,
  GRID_TOTAL_MINUTES,
  BLOCK_TYPES,
  PX_PER_MINUTE,
} from '@/domain/schedule/constants.js';
import { clampGrid, snapMinutes } from '@/domain/schedule/timeUtils.js';
import { getSleepConflicts } from '@/domain/schedule/scoring.js';
import { api } from '@/services/api/index.js';
import { usePlannerDrag } from '@/hooks/usePlannerDrag.js';
import { GRID_PX } from './plannerGridConfig.js';
import { TimeRuler } from './TimeRuler.jsx';
import { DayColumn } from './DayColumn.jsx';
import { SleepWarningAlert } from './SleepWarningAlert.jsx';
import { BlockEditorModal } from './BlockEditorModal.jsx';

/**
 * Full weekly grid: composition root for ruler, day columns, modals, sleep alerts.
 */
export function WeeklyPlanner({
  blocks,
  userId,
  bedTime,
  onBlocksChange,
  onSleepConflict,
}) {
  const columnRefs = useRef([]);
  const gridRef = useRef(null);
  const [editing, setEditing] = useState(null);
  const [addMenuDay, setAddMenuDay] = useState(null);

  const conflicts = useMemo(
    () => getSleepConflicts(blocks, bedTime || '22:30'),
    [blocks, bedTime]
  );

  useEffect(() => {
    onSleepConflict?.(conflicts.length > 0);
  }, [conflicts, onSleepConflict]);

  const pxPerMinute = PX_PER_MINUTE;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const findDayFromX = useCallback((clientX) => {
    for (let i = 0; i < columnRefs.current.length; i++) {
      const el = columnRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return i;
    }
    return null;
  }, []);

  const yToMinutes = useCallback(
    (clientY, colEl) => {
      if (!colEl) return 0;
      const r = colEl.getBoundingClientRect();
      const y = clientY - r.top;
      return clampGrid(snapMinutes(y / pxPerMinute));
    },
    [pxPerMinute]
  );

  const { drag, beginMove, beginResize } = usePlannerDrag({
    userId,
    blocksRef,
    onBlocksChange,
    columnRefs,
    findDayFromX,
    yToMinutes,
  });

  const addBlock = async (day, start, type) => {
    if (!userId) return;
    const end = Math.min(GRID_TOTAL_MINUTES, start + 60);
    try {
      const created = await api.createBlock(userId, {
        day,
        startMinutes: start,
        endMinutes: end,
        type,
        title: BLOCK_TYPES[type]?.label || type,
        reminderEnabled: false,
      });
      onBlocksChange([
        ...blocks,
        {
          id: created.id,
          day: created.day,
          startMinutes: created.startMinutes,
          endMinutes: created.endMinutes,
          type: created.type,
          title: created.title,
          reminderEnabled: created.reminderEnabled,
        },
      ]);
      setAddMenuDay(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div
        ref={gridRef}
        className="flex rounded-2xl glass border border-white/10 overflow-hidden min-h-[520px] max-h-[calc(100vh-200px)] flex-1 shadow-soft ring-1 ring-white/5"
      >
        <TimeRuler />
        <div className="flex-1 overflow-x-auto planner-scroll">
          <div className="flex min-w-[700px]" style={{ height: GRID_PX + 40 }}>
            {DAYS.map((_, dayIndex) => (
              <DayColumn
                key={DAYS[dayIndex]}
                dayIndex={dayIndex}
                columnRef={(el) => {
                  columnRefs.current[dayIndex] = el;
                }}
                blocks={blocks}
                drag={drag}
                pxPerMinute={pxPerMinute}
                addMenuOpen={addMenuDay === dayIndex}
                onToggleAddMenu={() =>
                  setAddMenuDay(addMenuDay === dayIndex ? null : dayIndex)
                }
                onPickBlockType={(d, type) => addBlock(d, 12 * 60, type)}
                onGridDoubleClick={(ev) => {
                  const start = yToMinutes(
                    ev.clientY,
                    columnRefs.current[dayIndex]
                  );
                  setEditing({
                    id: 'new',
                    day: dayIndex,
                    startMinutes: start,
                    endMinutes: Math.min(GRID_TOTAL_MINUTES, start + 45),
                    type: 'study',
                    title: 'New block',
                    reminderEnabled: false,
                  });
                }}
                beginMove={beginMove}
                beginResize={beginResize}
                setEditing={setEditing}
              />
            ))}
          </div>
        </div>
      </div>

      <SleepWarningAlert
        show={conflicts.length > 0}
        conflictCount={conflicts.length}
        bedTime={bedTime}
      />

      <BlockEditorModal
        editing={editing}
        onClose={() => setEditing(null)}
        userId={userId}
        blocks={blocks}
        onBlocksChange={onBlocksChange}
        onDraftChange={setEditing}
      />
    </div>
  );
}
