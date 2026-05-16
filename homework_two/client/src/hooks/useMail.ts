import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getGraphToken } from '../lib/auth';
import type { EmailDraft, MailMessage } from '../lib/types';

type LoadState = 'idle' | 'loading' | 'ok' | 'error' | 'cred-error';

async function graphHeaders(): Promise<Record<string, string>> {
  const token = await getGraphToken();
  const h: Record<string, string> = {};
  if (token) h['X-Graph-Token'] = token;
  return h;
}

export function useMail() {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const initialized = useRef(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await apiFetch<MailMessage[]>('/api/graph/mail', {
        headers: await graphHeaders(),
      });
      setMessages(data);
      setLoadState('ok');
    } catch (e) {
      const status = (e as { status?: number }).status;
      setLoadState(status === 401 || status === 403 ? 'cred-error' : 'error');
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  const sendMail = useCallback(async (to: string, subject: string, body: string, replyToId?: string) => {
    await apiFetch('/api/graph/mail/send', {
      method: 'POST',
      body: { toEmail: to, subject, body, replyToMessageId: replyToId ?? null },
      headers: await graphHeaders(),
    });
    void load();
  }, [load]);

  const getDraft = useCallback(async (emailBody: string, emailSubject: string): Promise<EmailDraft> => {
    return apiFetch<EmailDraft>('/api/chat/email-draft', {
      method: 'POST',
      body: { emailBody, emailSubject },
    });
  }, []);

  return { messages, loadState, load, sendMail, getDraft };
}
