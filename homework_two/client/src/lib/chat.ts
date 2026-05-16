import { apiFetch } from './api';
import { getDevOpsToken, getGraphToken, tokenStorage } from './auth';
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

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onToolCall?: (name: string, label: string) => void;
}

export async function streamChat(
  conversationId: string,
  message: string,
  callbacks: StreamCallbacks | ((token: string) => void),
  pinnedFiles?: string[],
): Promise<void> {
  const { onToken, onToolCall } = typeof callbacks === 'function'
    ? { onToken: callbacks, onToolCall: undefined }
    : callbacks;

  const appToken = tokenStorage.get();
  const devOpsToken = await getDevOpsToken();
  const graphToken  = await getGraphToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  if (appToken)    headers['Authorization']  = `Bearer ${appToken}`;
  if (devOpsToken) headers['X-DevOps-Token'] = devOpsToken;
  if (graphToken)  headers['X-Graph-Token']  = graphToken;

  const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, pinnedFiles: pinnedFiles ?? [] }),
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
        const parsed = JSON.parse(data) as {
          token?: string;
          toolCall?: { name: string; label: string };
          error?: string;
        };
        if (parsed.token) onToken(parsed.token);
        if (parsed.toolCall && onToolCall) onToolCall(parsed.toolCall.name, parsed.toolCall.label);
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}
