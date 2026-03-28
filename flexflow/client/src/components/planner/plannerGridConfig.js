import {
  GRID_TOTAL_MINUTES,
  PX_PER_MINUTE,
} from '@/domain/schedule/constants.js';

export const HOUR_HEIGHT = 60 * PX_PER_MINUTE;
export const GRID_PX = GRID_TOTAL_MINUTES * PX_PER_MINUTE;
export const HOUR_TICKS = Array.from({ length: 21 }, (_, i) => i);
