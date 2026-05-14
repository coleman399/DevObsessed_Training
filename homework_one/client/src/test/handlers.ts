import { http, HttpResponse } from 'msw';
import type { AuthResponse, ConversationDetail, MeResponse, Stats } from '../lib/types';

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

const sampleConvId = 'conv-default';

const sampleConversationDetail: ConversationDetail = {
  id: sampleConvId,
  title: 'New conversation',
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hey Jane, what are we working on first?',
      createdAt: new Date().toISOString(),
    },
  ],
};

function makeSseStream(tokens: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(`data: {"token":"${token}"}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

export const handlers = [
  http.post('/api/auth/register', () => HttpResponse.json(sampleAuthResponse)),
  http.post('/api/auth/login', () => HttpResponse.json(sampleAuthResponse)),
  http.get('/api/me', () => HttpResponse.json(sampleMe)),
  http.get('/api/stats', () => HttpResponse.json(sampleStats)),

  // Chat
  http.get('/api/chat/conversations', () => HttpResponse.json([])),
  http.post('/api/chat/conversations', () =>
    HttpResponse.json(sampleConversationDetail, { status: 201 }),
  ),
  http.get('/api/chat/conversations/:id', () => HttpResponse.json(sampleConversationDetail)),
  http.patch('/api/chat/conversations/:id', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/chat/conversations/:id/messages', () =>
    new HttpResponse(makeSseStream(['Hello', ' there']), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    }),
  ),
];
