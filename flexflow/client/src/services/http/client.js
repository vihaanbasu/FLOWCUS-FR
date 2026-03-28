import { AUTH_TOKEN_KEY } from '@/domain/schedule/constants.js';

/**
 * Thin HTTP layer: single place for base URL, errors, and JSON handling.
 * Swap `getBaseUrl()` when deploying API to another host.
 */
export function getApiBase() {
  return `${import.meta.env.VITE_API_BASE ?? ''}/api`;
}

export class ApiError extends Error {
  /** @param {string} message @param {number} status @param {unknown} body */
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * @param {string} path - e.g. `/users` (leading slash required)
 * @param {RequestInit & { skipAuth?: boolean }} [options]
 */
export async function request(path, options = {}) {
  const { skipAuth, ...init } = options;
  const url = `${getApiBase()}${path}`;
  const token = skipAuth ? null : getStoredToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data?.error
        ? data.error
        : res.statusText || 'Request failed';
    throw new ApiError(msg, res.status, data);
  }
  return data;
}
