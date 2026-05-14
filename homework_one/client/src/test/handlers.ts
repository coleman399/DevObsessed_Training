import { http, HttpResponse } from 'msw';
import type { AuthResponse, MeResponse, Stats } from '../lib/types';

// Default MSW handlers for the success path. Individual tests use server.use(...)
// to override these with 4xx/5xx scenarios.

const sampleUser = {
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
};

const sampleAuthResponse: AuthResponse = {
  token: 'fake.jwt.token',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  user: sampleUser,
};

const sampleMe: MeResponse = {
  id: sampleUser.id,
  name: sampleUser.name,
  email: sampleUser.email,
  createdAt: new Date().toISOString(),
};

const sampleStats: Stats = {
  drafts: 0,
  pendingInvites: 0,
  workspaceName: 'jane-hq',
  memberCount: 1,
  plan: 'Free',
};

export const handlers = [
  http.post('/api/auth/register', () => HttpResponse.json(sampleAuthResponse)),
  http.post('/api/auth/login', () => HttpResponse.json(sampleAuthResponse)),
  http.get('/api/me', () => HttpResponse.json(sampleMe)),
  http.get('/api/stats', () => HttpResponse.json(sampleStats)),
];
