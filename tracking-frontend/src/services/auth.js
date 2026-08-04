import { api } from './api';
import { setSession, clearSession } from './tokenStorage';

export async function login(username, password) {
  const data = await api.post('/api/v1/auth/login', { username, password }, { auth: false });
  setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    username: data.username,
    role: data.role
  });
  return data;
}

export async function logout(refreshToken) {
  try {
    if (refreshToken) {
      await api.post('/api/v1/auth/logout', { refreshToken }, { auth: false });
    }
  } finally {
    clearSession();
  }
}
