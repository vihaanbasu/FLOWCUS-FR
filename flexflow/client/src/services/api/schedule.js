import { request } from '../http/client.js';

export const scheduleApi = {
  getBlocks: (userId) => request(`/users/${userId}/blocks`),
  createBlock: (userId, body) =>
    request(`/users/${userId}/blocks`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateBlock: (id, body) =>
    request(`/blocks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBlock: (id) => request(`/blocks/${id}`, { method: 'DELETE' }),
  clearBlocks: (userId) =>
    request(`/users/${userId}/blocks`, { method: 'DELETE' }),
  bulkBlocks: (userId, blocks) =>
    request(`/users/${userId}/blocks/bulk`, {
      method: 'POST',
      body: JSON.stringify({ blocks }),
    }),
};
