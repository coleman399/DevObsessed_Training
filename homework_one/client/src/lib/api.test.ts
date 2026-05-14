import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/setup';
import { apiFetch } from './api';
import { ApiError } from './types';
import { tokenStorage } from './auth';

describe('apiFetch', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    tokenStorage.clear();
  });

  it('attaches a Bearer header when a token is in storage', async () => {
    tokenStorage.set('abc.def.ghi', true);
    let captured: string | null = null;
    server.use(
      http.get('/api/me', ({ request }) => {
        captured = request.headers.get('Authorization');
        return HttpResponse.json({ id: '1', name: 'Jane', email: 'j@x.com', createdAt: '' });
      }),
    );

    await apiFetch('/api/me');
    expect(captured).toBe('Bearer abc.def.ghi');
  });

  it('omits Authorization when token: null is passed explicitly', async () => {
    tokenStorage.set('stored.token', true);
    let captured: string | null = null;
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        captured = request.headers.get('Authorization');
        return HttpResponse.json({ token: 't', expiresAt: '', user: { id: '1', name: '', email: '' } });
      }),
    );

    await apiFetch('/api/auth/login', { method: 'POST', body: {}, token: null });
    expect(captured).toBeNull();
  });

  it('throws ApiError with the parsed JSON body on 4xx', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ title: 'Email already registered.' }, { status: 409 }),
      ),
    );

    await expect(
      apiFetch('/api/auth/register', { method: 'POST', body: { email: 'a@b.co' }, token: null }),
    ).rejects.toMatchObject({
      status: 409,
      body: { title: 'Email already registered.' },
    });
  });

  it('falls back to text body on a non-JSON 5xx (dev exception page)', async () => {
    server.use(
      http.get('/api/me', () =>
        HttpResponse.text('<html><body>boom</body></html>', { status: 500 }),
      ),
    );

    try {
      await apiFetch('/api/me');
      throw new Error('Expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.body).toEqual({ raw: '<html><body>boom</body></html>' });
    }
  });

  it('works without a token (anonymous request)', async () => {
    server.use(
      http.get('/api/me', () => HttpResponse.json({ id: '1', name: '', email: '', createdAt: '' })),
    );
    await expect(apiFetch('/api/me')).resolves.toMatchObject({ id: '1' });
  });
});
