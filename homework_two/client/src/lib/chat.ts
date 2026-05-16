import { apiFetch } from './api';
import { tokenStorage } from './auth';
import type { ConversationDetail, ConversationSummary } from './types';

export function deriveTitle(text: string): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  return normalized.length <= 38 ? normalized : normalized.slice(0, 36) + '…';
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return apiFetch<ConversationSummary[]>('/api/chat/conversations');
}

export async function createConversation(): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>('/api/chat/conversations', { method: 'POST' });
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/api/chat/conversations/${id}`);
}

export async function streamChat(
  conversationId: string,
  message: string,
  onToken: (token: string) => void,
): Promise<void> {
  const token = tokenStorage.get();
  const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data) as { token?: string; error?: string };
        if (parsed.token) onToken(parsed.token);
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}
