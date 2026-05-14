import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { server } from '../test/setup';
import { tokenStorage } from '../lib/auth';
import { AuthProvider, useAuth } from './useAuth';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const sampleAuth = {
  token: 'jwt.from.api',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
};

describe('useAuth', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    tokenStorage.clear();
  });

  it('starts unauthenticated when no token is stored', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });

  it('login happy path → authenticated + token persisted', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(sampleAuth)));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('jane@example.com', 'Pass123', true);
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user?.email).toBe('jane@example.com');
    expect(tokenStorage.get()).toBe('jwt.from.api');
    expect(window.localStorage.getItem('devobsessed.auth.token')).toBe('jwt.from.api');
    expect(window.sessionStorage.getItem('devobsessed.auth.token')).toBeNull();
  });

  it('login 401 leaves state unauthenticated and rethrows', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ title: 'Invalid email or password.' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => {
        await result.current.login('jane@example.com', 'WrongPass', true);
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it('remember = false writes to sessionStorage instead of localStorage', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(sampleAuth)));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('jane@example.com', 'Pass123', false);
    });

    expect(window.sessionStorage.getItem('devobsessed.auth.token')).toBe('jwt.from.api');
    expect(window.localStorage.getItem('devobsessed.auth.token')).toBeNull();
  });

  it('tokenStorage precedence: localStorage wins over sessionStorage if both somehow exist', () => {
    window.localStorage.setItem('devobsessed.auth.token', 'long.lived');
    window.sessionStorage.setItem('devobsessed.auth.token', 'session.only');
    expect(tokenStorage.get()).toBe('long.lived');
  });

  it('logout clears both storages and returns state to unauthenticated', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(sampleAuth)));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('jane@example.com', 'Pass123', true);
    });

    act(() => result.current.logout());

    expect(result.current.status).toBe('unauthenticated');
    expect(tokenStorage.get()).toBeNull();
    expect(window.localStorage.getItem('devobsessed.auth.token')).toBeNull();
    expect(window.sessionStorage.getItem('devobsessed.auth.token')).toBeNull();
  });

  it('mount-time hydration: stored token + /api/me 200 → authenticated', async () => {
    tokenStorage.set('stored.token', true);
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: 'user-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          createdAt: new Date().toISOString(),
        }),
      ),
    );

    function Probe() {
      const auth = useAuth();
      return (
        <div data-testid="status" data-name={auth.user?.name ?? ''}>
          {auth.status}
        </div>
      );
    }

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('status').textContent).toBe('authenticated'));
    expect(getByTestId('status').dataset.name).toBe('Jane Doe');
  });

  it('mount-time hydration: stored token + /api/me 401 → token cleared, unauthenticated', async () => {
    tokenStorage.set('expired.token', true);
    server.use(http.get('/api/me', () => HttpResponse.json({}, { status: 401 })));

    function Probe() {
      const auth = useAuth();
      return <div data-testid="status">{auth.status}</div>;
    }

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('status').textContent).toBe('unauthenticated'));
    expect(tokenStorage.get()).toBeNull();
  });
});
