import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '../lib/api';
import { tokenStorage } from '../lib/auth';
import { ApiError, type AuthResponse, type MeResponse, type User } from '../lib/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthCtx {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'unauthenticated'));

  // Mount-time hydration: if a token is in storage, ask /api/me who it belongs to.
  useEffect(() => {
    const stored = tokenStorage.get();
    if (!stored) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch<MeResponse>('/api/me', { token: stored });
        if (cancelled) return;
        setUser({ id: me.id, name: me.name, email: me.email });
        setToken(stored);
        setStatus('authenticated');
      } catch (err) {
        if (cancelled) return;
        // Token was stale/tampered/expired — clear and bounce to auth screen.
        if (err instanceof ApiError && err.status === 401) {
          tokenStorage.clear();
          setToken(null);
          setUser(null);
          setStatus('unauthenticated');
        } else {
          // Network or 5xx — keep the token but flip to unauthenticated so the UI shows auth screen.
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setStatus('loading');
    try {
      const auth = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        token: null,
      });
      tokenStorage.set(auth.token, remember);
      setUser(auth.user);
      setToken(auth.token);
      setStatus('authenticated');
    } catch (err) {
      setStatus('unauthenticated');
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setStatus('loading');
    try {
      const auth = await apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
        token: null,
      });
      // Register goes through "Remember me = true" by default — new accounts persist past tab close.
      tokenStorage.set(auth.token, true);
      setUser(auth.user);
      setToken(auth.token);
      setStatus('authenticated');
    } catch (err) {
      setStatus('unauthenticated');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setToken(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, token, status, login, register, logout }),
    [user, token, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
