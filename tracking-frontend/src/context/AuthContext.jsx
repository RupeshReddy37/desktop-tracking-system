import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { login as loginRequest, logout as logoutRequest } from '../services/auth';
import { getAccessToken, getRefreshToken, getUser, clearSession } from '../services/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    setInitializing(false);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginRequest(username, password);
    setUser({ username: data.username, role: data.role });
    return data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    await logoutRequest(refreshToken);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(getAccessToken() && user),
    initializing,
    login,
    logout
  }), [user, initializing, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { clearSession };
