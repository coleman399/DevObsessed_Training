import { apiFetch } from './api';
import { tokenStorage } from './auth';
import type { ConversationDetail, ConversationSummary } from './types';

// ── SSE streaming ─────────────────────────────────────────────────────────────

export async function streamChat(
  conversationId: string,
  message: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = tokenStorage.get();
  const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are newline-terminated; keep the last incomplete line in buffer.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data) as { token?: string; error?: string };
          if (parsed.error) throw new Error('stream_failed');
          if (parsed.token) onToken(parsed.token);
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function relativeTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3_600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3_600)}h ago`;
  if (diff < 86_400 * 7) return `${Math.floor(diff / 86_400)}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function deriveTitle(firstUserMessage: string): string {
  const t = firstUserMessage.trim().replace(/\s+/g, ' ');
  if (t.length <= 38) return t;
  return t.slice(0, 36).trimEnd() + '…'; // …
}

// ── API wrappers ──────────────────────────────────────────────────────────────

export const listConversations = () =>
  apiFetch<ConversationSummary[]>('/api/chat/conversations');

export const createConversation = () =>
  apiFetch<ConversationDetail>('/api/chat/conversations', { method: 'POST' });

export const getConversation = (id: string) =>
  apiFetch<ConversationDetail>(`/api/chat/conversations/${id}`);

export const patchTitle = (id: string, title: string) =>
  apiFetch<void>(`/api/chat/conversations/${id}`, { method: 'PATCH', body: { title } });
