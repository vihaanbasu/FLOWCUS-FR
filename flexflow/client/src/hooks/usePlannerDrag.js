import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GRID_TOTAL_MINUTES,
  SNAP_MINUTES,
} from '@/domain/schedule/constants.js';
import { clampGrid } from '@/domain/schedule/timeUtils.js';
import { api } from '@/services/api/index.js';

/**
 * Pointer drag + resize for weekly grid blocks.
 * Keeps DOM/event logic out of presentational components.
 */
export function usePlannerDrag({
  userId,
  blocksRef,
  onBlocksChange,
  columnRefs,
  findDayFromX,
  yToMinutes,
}) {
  const dragLiveRef = useRef(null);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (!drag) {
      dragLiveRef.current = null;
      return undefined;
    }
    dragLiveRef.current = drag;

    const onMove = (e) => {
      setDrag((d) => {
        if (!d) return null;
        const nextDayRaw = findDayFromX(e.clientX);
        const day = nextDayRaw === null ? d.day : nextDayRaw;
        const activeCol = columnRefs.current[day];
        if (d.mode === 'move') {
          const raw = yToMinutes(e.clientY, activeCol) - d.offsetY;
          const start = clampGrid(raw);
          const dur = d.origEnd - d.origStart;
          let end = start + dur;
          let st = start;
          if (end > GRID_TOTAL_MINUTES) {
            end = GRID_TOTAL_MINUTES;
            st = Math.max(0, end - dur);
          }
          const next = {
            ...d,
            previewDay: day,
            previewStart: st,
            previewEnd: end,
          };
          dragLiveRef.current = next;
          return next;
        }
        const end = clampGrid(
          Math.max(
            d.origStart + SNAP_MINUTES,
            yToMinutes(e.clientY, activeCol)
          )
        );
        const next = { ...d, previewDay: day, previewEnd: end };
        dragLiveRef.current = next;
        return next;
      });
    };

    const onUp = () => {
      const d = dragLiveRef.current;
      dragLiveRef.current = null;
      setDrag(null);
      if (!d || !userId) return;
      const day = d.previewDay ?? d.day;
      const start =
        d.mode === 'resize'
          ? d.origStart
          : d.previewStart ?? d.origStart;
      const end = d.previewEnd ?? d.origEnd;
      const updated = {
        day,
        startMinutes: start,
        endMinutes: end,
        type: d.type,
        title: d.title,
        reminderEnabled: d.reminderEnabled,
      };
      (async () => {
        try {
          await api.updateBlock(d.id, updated);
          const prev = blocksRef.current;
          onBlocksChange(
            prev.map((b) => (b.id === d.id ? { ...b, ...updated } : b))
          );
        } catch (err) {
          console.error(err);
        }
      })();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag?.id, userId, yToMinutes, findDayFromX, onBlocksChange, columnRefs]);

  const beginMove = useCallback(
    (e, b) => {
      e.stopPropagation();
      const col = columnRefs.current[b.day];
      const startM = yToMinutes(e.clientY, col);
      const offsetY = startM - b.startMinutes;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDrag({
        id: b.id,
        mode: 'move',
        day: b.day,
        origStart: b.startMinutes,
        origEnd: b.endMinutes,
        offsetY,
        type: b.type,
        title: b.title,
        reminderEnabled: b.reminderEnabled,
        previewStart: b.startMinutes,
        previewEnd: b.endMinutes,
        previewDay: b.day,
      });
    },
    [columnRefs, yToMinutes]
  );

  const beginResize = useCallback((e, b) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({
      id: b.id,
      mode: 'resize',
      day: b.day,
      origStart: b.startMinutes,
      origEnd: b.endMinutes,
      type: b.type,
      title: b.title,
      reminderEnabled: b.reminderEnabled,
      previewStart: b.startMinutes,
      previewEnd: b.endMinutes,
      previewDay: b.day,
    });
  }, []);

  return { drag, setDrag, beginMove, beginResize };
}
