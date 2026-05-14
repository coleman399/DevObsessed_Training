import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/setup';
import { deriveTitle, relativeTime, streamChat } from './chat';
import { tokenStorage } from './auth';

// ── deriveTitle ───────────────────────────────────────────────────────────────

describe('deriveTitle', () => {
  it('returns short text verbatim', () => {
    expect(deriveTitle('Hello world')).toBe('Hello world');
  });

  it('returns text of exactly 38 chars verbatim', () => {
    const text = 'a'.repeat(38);
    expect(deriveTitle(text)).toBe(text);
  });

  it('truncates text longer than 38 chars with ellipsis', () => {
    const text = 'a'.repeat(40);
    expect(deriveTitle(text)).toBe('a'.repeat(36) + '…');
  });

  it('collapses whitespace before measuring', () => {
    expect(deriveTitle('  hello   world  ')).toBe('hello world');
  });
});

// ── relativeTime ──────────────────────────────────────────────────────────────

describe('relativeTime', () => {
  it('returns "just now" for under 60 seconds', () => {
    expect(relativeTime(new Date(Date.now() - 30_000))).toBe('just now');
  });

  it('returns "Nm ago" for under 1 hour', () => {
    expect(relativeTime(new Date(Date.now() - 5 * 60_000))).toBe('5m ago');
    expect(relativeTime(new Date(Date.now() - 59 * 60_000))).toBe('59m ago');
  });

  it('returns "Nh ago" for under 24 hours', () => {
    expect(relativeTime(new Date(Date.now() - 3 * 3_600_000))).toBe('3h ago');
  });

  it('returns "Nd ago" for under 7 days', () => {
    expect(relativeTime(new Date(Date.now() - 2 * 86_400_000))).toBe('2d ago');
  });

  it('returns locale date string for 7+ days ago', () => {
    const old = new Date(Date.now() - 10 * 86_400_000);
    const result = relativeTime(old);
    expect(result).not.toContain('ago');
    expect(result).not.toBe('just now');
    expect(result).toMatch(/\w{3}\s*\d+/);
  });
});

// ── streamChat SSE parser ─────────────────────────────────────────────────────

describe('streamChat', () => {
  function makeSseStream(tokens: string[], withError = false): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (const token of tokens) {
          controller.enqueue(encoder.encode(`data: {"token":"${token}"}\n\n`));
        }
        if (withError) {
          controller.enqueue(encoder.encode('data: {"error":"stream_failed"}\n\n'));
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

  it('collects tokens from SSE frames', async () => {
    server.use(
      http.post('/api/chat/conversations/conv-1/messages', () =>
        new HttpResponse(makeSseStream(['Hello', ' world']), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    );

    const tokens: string[] = [];
    await streamChat('conv-1', 'hi', (t) => tokens.push(t));
    expect(tokens).toEqual(['Hello', ' world']);
  });

  it('stops at [DONE] sentinel', async () => {
    server.use(
      http.post('/api/chat/conversations/conv-2/messages', () =>
        new HttpResponse(makeSseStream(['A', 'B', 'C']), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    );

    const tokens: string[] = [];
    await streamChat('conv-2', 'hi', (t) => tokens.push(t));
    expect(tokens).toEqual(['A', 'B', 'C']);
  });

  it('throws on { error } frame', async () => {
    server.use(
      http.post('/api/chat/conversations/conv-3/messages', () =>
        new HttpResponse(makeSseStream([], true), {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    );

    await expect(streamChat('conv-3', 'hi', vi.fn())).rejects.toThrow('stream_failed');
  });

  it('handles frames split across chunk boundaries', async () => {
    const encoder = new TextEncoder();
    // Deliberately split one SSE frame across multiple chunks
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"token'));
        controller.enqueue(encoder.encode('":"split"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    server.use(
      http.post('/api/chat/conversations/conv-4/messages', () =>
        new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
      ),
    );

    const tokens: string[] = [];
    await streamChat('conv-4', 'hi', (t) => tokens.push(t));
    expect(tokens).toEqual(['split']);
  });
});
