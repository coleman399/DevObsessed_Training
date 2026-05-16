import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { signInWithMicrosoft, tokenStorage } from '../lib/auth';
import { apiFetch } from '../lib/api';
import type { AuthResponse, UserProfile } from '../lib/types';

interface AuthCtx {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check for existing token, load profile
  useEffect(() => {
    const existingToken = tokenStorage.get();
    if (!existingToken) { setIsLoading(false); return; }
    apiFetch<UserProfile>('/api/profile')
      .then(setProfile)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const msalResult = await signInWithMicrosoft();
      const authResp = await apiFetch<AuthResponse>('/api/auth/microsoft', {
        method: 'POST',
        body: { idToken: msalResult.idToken },
        token: null,
      });
      tokenStorage.set(authResp.token);
      setProfile(authResp.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    tokenStorage.clear();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const p = await apiFetch<UserProfile>('/api/profile');
    setProfile(p);
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    profile,
    isLoading,
    isAuthenticated: profile !== null,
    signIn,
    signOut,
    refreshProfile,
  }), [profile, isLoading, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
