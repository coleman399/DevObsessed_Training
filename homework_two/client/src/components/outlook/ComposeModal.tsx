import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { EmailDraft, MailMessage } from '../../lib/types';

type DraftState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  replyTo?: MailMessage;
  onSend: (to: string, subject: string, body: string, replyToId?: string) => Promise<void>;
  onGetDraft: (emailBody: string, emailSubject: string) => Promise<EmailDraft>;
  onClose: () => void;
}

export function ComposeModal({ replyTo, onSend, onGetDraft, onClose }: Props) {
  const { toast } = useToast();
  const [to, setTo] = useState(replyTo?.fromEmail ?? '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleDraft() {
    setDraftState('loading');
    setDraftError(null);
    try {
      const draft = await onGetDraft(replyTo?.bodyPreview ?? '', subject);
      setSubject(draft.subject);
      setBody(draft.body);
      setDraftState('ready');
    } catch {
      setDraftState('error');
      setDraftError('Failed to draft. Try again.');
    }
  }

  async function handleSend() {
    if (!to || !subject) return;
    setSending(true);
    try {
      await onSend(to, subject, body, replyTo?.id);
      toast(`Email sent to ${to}`);
      onClose();
    } catch {
      toast('Failed to send email.');
      setSending(false);
    }
  }

  return (
    <div className="compose-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="compose-modal">
        <div className="compose-header">
          <span className="compose-header-title">{replyTo ? 'Reply' : 'New Email'}</span>
          <button type="button" className="compose-close" onClick={onClose}>×</button>
        </div>

        <div className="compose-body">
          {/* AI draft area */}
          {!replyTo && (
            <div>
              {draftState === 'loading' ? (
                <div className="compose-ai-skeleton">
                  <div className="compose-ai-label"><span className="compose-dot" />Drafting with AI…</div>
                  <div className="compose-skel-bar" style={{ width: '70%' }} />
                  <div className="compose-skel-bar" style={{ width: '95%' }} />
                </div>
              ) : (
                <button className="btn btn-ghost" type="button" onClick={handleDraft}
                  style={{ fontSize: '0.8125rem', width: '100%' }}>
                  Draft with AI ✦
                </button>
              )}
              {draftState === 'error' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--agp-red)', marginTop: '0.375rem' }}>
                  {draftError} <button type="button" onClick={handleDraft} style={{ color: 'inherit', textDecoration: 'underline' }}>Retry</button>
                </div>
              )}
            </div>
          )}

          {replyTo && (
            <div style={{ padding: '0.625rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-strong)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Replying to {replyTo.fromName}</div>
              <div>{replyTo.bodyPreview}</div>
              <div style={{ marginTop: '0.5rem' }}>
                {draftState === 'loading' ? (
                  <div className="compose-ai-label"><span className="compose-dot" />Drafting reply…</div>
                ) : (
                  <button className="btn btn-ghost" type="button" onClick={handleDraft}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
                    Draft reply with AI ✦
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="compose-field">
            <label className="compose-label">To</label>
            <input className="compose-input" type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com" />
          </div>

          <div className="compose-field">
            <label className="compose-label">Subject</label>
            <input className="compose-input" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
          </div>

          <div className="compose-field">
            <label className="compose-label">Body</label>
            <textarea className="compose-body-input" value={body}
              onChange={e => setBody(e.target.value)} placeholder="Write your message…" />
          </div>
        </div>

        <div className="compose-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="button"
            disabled={!to || !subject || sending}
            onClick={handleSend}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
