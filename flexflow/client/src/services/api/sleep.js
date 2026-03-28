import { request } from '../http/client.js';

export const sleepApi = {
  list: (userId) => request(`/users/${userId}/sleep`),
  log: (userId, body) =>
    request(`/users/${userId}/sleep`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
