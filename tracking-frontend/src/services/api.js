import { getAccessToken, getRefreshToken, setSession, clearSession } from './tokenStorage';
import { getCached, setCached } from './cache';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    throw new Error('Refresh token expired');
  }

  const data = await response.json();
  setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    username: data.username,
    role: data.role
  });
  return data.accessToken;
}

async function request(path, { method = 'GET', body, headers = {}, auth = true, cache = false, cacheTTL = 5 * 60 * 1000 } = {}) {
  // Check cache for GET requests
  if (cache && method === 'GET') {
    const cached = getCached(path, { body });
    if (cached) return cached;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (response.status === 401 && auth) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      requestHeaders.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch {
      clearSession();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // ignore non-JSON error bodies
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  let result;
  if (contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = await response.text();
  }

  // Cache successful GET responses
  if (cache && method === 'GET') {
    setCached(path, result, { body }, cacheTTL);
  }

  return result;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' })
};

export { API_BASE };
