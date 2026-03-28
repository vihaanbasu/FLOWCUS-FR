import { request, setStoredToken } from '../http/client.js';

export const authApi = {
  register: (body) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    }),
  login: (body) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    }),
  me: () => request('/auth/me'),
};

export function persistAuthSession(token) {
  setStoredToken(token);
}
