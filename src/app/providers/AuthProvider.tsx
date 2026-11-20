import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from '../../context/authContext';
import { refreshAccessToken, setAccessToken } from '../../services/api';
import { authApi, type StoreUser } from '../../services/storeApi';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (!token) return;
        setAccessToken(token);
        const current = await authApi.me();
        if (active) setUser(current.user);
      } catch {
        setAccessToken(null);
        if (active) setUser(null);
      } finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setUser(result.user);
    return result.user;
  }, []);
  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register(name, email, password);
    setUser(result.user);
    return result.user;
  }, []);
  const socialLogin = useCallback(async (provider: 'google' | 'apple', identityToken: string, profile?: { firstName?: string; lastName?: string }) => {
    const result = provider === 'google'
      ? await authApi.googleLogin(identityToken)
      : await authApi.appleLogin(identityToken, profile ? { name: profile } : undefined);
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ isLoggedIn: Boolean(user), isLoading, user, login, register, socialLogin, logout }), [isLoading, user, login, register, socialLogin, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
