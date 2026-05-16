import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getGraphToken } from '../lib/auth';
import type { ChannelMessage, TeamsChannel, TeamsChat } from '../lib/types';

type LoadState = 'idle' | 'loading' | 'ok' | 'error' | 'cred-error';

async function graphHeaders(): Promise<Record<string, string>> {
  const token = await getGraphToken();
  const h: Record<string, string> = {};
  if (token) h['X-Graph-Token'] = token;
  return h;
}

export function useTeams(teamsChannelsJson: string | null) {
  const [chats, setChats] = useState<TeamsChat[]>([]);
  const [channelMessages, setChannelMessages] = useState<Record<string, ChannelMessage[]>>({});
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const initialized = useRef(false);

  const channels: TeamsChannel[] = (() => {
    try { return teamsChannelsJson ? JSON.parse(teamsChannelsJson) : []; }
    catch { return []; }
  })();

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const headers = await graphHeaders();
      const data = await apiFetch<TeamsChat[]>('/api/graph/teams/chats', { headers });
      setChats(data);

      // Load messages for each configured channel
      const msgs: Record<string, ChannelMessage[]> = {};
      await Promise.allSettled(
        channels.map(async ch => {
          try {
            const m = await apiFetch<ChannelMessage[]>(
              `/api/graph/teams/channels/${ch.teamId}/${ch.channelId}`,
              { headers }
            );
            msgs[ch.channelId] = m;
          } catch { /* individual channel failure doesn't block the rest */ }
        })
      );
      setChannelMessages(msgs);
      setLoadState('ok');
    } catch (e) {
      const status = (e as { status?: number }).status;
      setLoadState(status === 401 || status === 403 ? 'cred-error' : 'error');
    }
  }, [teamsChannelsJson]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  const postToChannel = useCallback(async (teamId: string, channelId: string, content: string) => {
    const headers = await graphHeaders();
    await apiFetch(`/api/graph/teams/channels/${teamId}/${channelId}`, {
      method: 'POST',
      body: { content },
      headers,
    });
  }, []);

  const polishMessage = useCallback(async (message: string): Promise<string> => {
    const result = await apiFetch<{ polishedMessage: string }>('/api/chat/message-polish', {
      method: 'POST',
      body: { message },
    });
    return result.polishedMessage;
  }, []);

  return { chats, channelMessages, channels, loadState, load, postToChannel, polishMessage };
}
