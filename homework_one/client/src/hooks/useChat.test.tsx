import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { server } from '../test/setup';
import { tokenStorage } from '../lib/auth';
import { ChatProvider, useChat } from './useChat';

function wrapper({ children }: { children: ReactNode }) {
  return <ChatProvider firstName="Jane">{children}</ChatProvider>;
}

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

beforeEach(() => {
  tokenStorage.set('test-token', true);
});

afterEach(() => {
  tokenStorage.clear();
});

describe('useChat', () => {
  it('on mount prepends a local stub with Nova greeting', async () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    await waitFor(() => expect(result.current.activeConversation).toBeDefined());

    const stub = result.current.activeConversation!;
    expect(stub.isStub).toBe(true);
    expect(stub.title).toBe('New conversation');
    expect(stub.messages).toHaveLength(1);
    expect(stub.messages[0].role).toBe('assistant');
    expect(stub.messages[0].content).toContain('Jane');
  });

  it('stub does not appear in recentConversations', async () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    await waitFor(() => expect(result.current.activeConversation).toBeDefined());
    expect(result.current.recentConversations).toHaveLength(0);
  });

  it('first sendMessage materializes the stub and streams a reply', async () => {
    const convId = 'new-conv-id';
    server.use(
      http.post('/api/chat/conversations', () =>
        HttpResponse.json(
          {
            id: convId,
            title: 'New conversation',
            updatedAt: new Date().toISOString(),
            messages: [{ id: 'm1', role: 'assistant', content: 'Hey Jane', createdAt: new Date().toISOString() }],
          },
          { status: 201 },
        ),
      ),
      http.post(`/api/chat/conversations/${convId}/messages`, () =>
        new HttpResponse(makeSseStream(['Sure', ' thing']), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.activeConversation?.isStub).toBe(true));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // Stub is now materialized
    expect(result.current.activeConversation?.isStub).toBe(false);
    expect(result.current.activeConversation?.id).toBe(convId);

    // User message + assistant reply are in the thread
    const msgs = result.current.activeConversation!.messages;
    expect(msgs.some((m) => m.role === 'user' && m.content === 'Hello')).toBe(true);
    expect(msgs.some((m) => m.role === 'assistant' && m.content === 'Sure thing')).toBe(true);

    // Conversation appears in recents after having a user turn
    expect(result.current.recentConversations).toHaveLength(1);
  });

  it('startNewConversation prepends a fresh stub; previous stays in recents after user turn', async () => {
    const convId = 'prev-conv';
    server.use(
      http.post('/api/chat/conversations', () =>
        HttpResponse.json(
          { id: convId, title: 'New conversation', updatedAt: new Date().toISOString(), messages: [] },
          { status: 201 },
        ),
      ),
      http.post(`/api/chat/conversations/${convId}/messages`, () =>
        new HttpResponse(makeSseStream(['ok']), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.activeConversation?.isStub).toBe(true));

    // Send a message to materialize first stub
    await act(async () => {
      await result.current.sendMessage('First');
    });

    // Now start a new conversation
    act(() => result.current.startNewConversation());

    const newStub = result.current.activeConversation!;
    expect(newStub.isStub).toBe(true);

    // Previous conversation (materialized, has user turns) is in recents
    expect(result.current.recentConversations.some((c) => c.id === convId)).toBe(true);

    // New empty stub is NOT in recents
    expect(result.current.recentConversations.some((c) => c.id === newStub.id)).toBe(false);
  });

  it('stream error surfaces as offline bot bubble', async () => {
    const convId = 'err-conv';
    server.use(
      http.post('/api/chat/conversations', () =>
        HttpResponse.json(
          { id: convId, title: 'New conversation', updatedAt: new Date().toISOString(), messages: [] },
          { status: 201 },
        ),
      ),
      http.post(`/api/chat/conversations/${convId}/messages`, () =>
        new HttpResponse(new ReadableStream({ start(c) { c.error(new Error('network')); } }), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.activeConversation?.isStub).toBe(true));

    await act(async () => {
      await result.current.sendMessage('test');
    });

    const msgs = result.current.activeConversation!.messages;
    const errMsg = msgs.find((m) => m.role === 'assistant' && m.content.includes('offline'));
    expect(errMsg).toBeDefined();
    expect(result.current.streaming).toBe(false);
  });
});
