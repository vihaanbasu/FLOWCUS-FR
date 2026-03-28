import { request } from '../http/client.js';

export const usersApi = {
  get: (id) => request(`/users/${id}`),
  patch: (id, body) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
