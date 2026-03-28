/**
 * Facade over resource modules — keeps call sites stable while routes grow.
 */
import { usersApi } from './users.js';
import { scheduleApi } from './schedule.js';
import { sleepApi } from './sleep.js';
import { authApi, persistAuthSession } from './auth.js';
import { assistantApi } from './assistant.js';

/** @param {import('../http/client.js').ApiError} err */
export function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export const api = {
  ...authApi,
  ...assistantApi,
  persistAuthSession,
  getUser: usersApi.get,
  patchUser: usersApi.patch,
  getBlocks: scheduleApi.getBlocks,
  createBlock: scheduleApi.createBlock,
  updateBlock: scheduleApi.updateBlock,
  deleteBlock: scheduleApi.deleteBlock,
  clearBlocks: scheduleApi.clearBlocks,
  bulkBlocks: scheduleApi.bulkBlocks,
  getSleep: sleepApi.list,
  logSleep: sleepApi.log,
};

/** Map API block to client shape */
export function normalizeBlock(b) {
  return {
    id: b.id,
    day: b.day,
    startMinutes: b.startMinutes ?? b.start_minutes,
    endMinutes: b.endMinutes ?? b.end_minutes,
    type: b.type,
    title: b.title || '',
    reminderEnabled: Boolean(b.reminderEnabled ?? b.reminder_enabled),
  };
}
