import { useState } from 'react';
import { ComposeModal } from './ComposeModal';
import { useMail } from '../../hooks/useMail';
import type { MailMessage } from '../../lib/types';
import '../../styles/m365.css';

function formatTime(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export function MailPanel() {
  const { messages, loadState, load, sendMail, getDraft } = useMail();
  const [compose, setCompose] = useState<'new' | MailMessage | null>(null);
  const [credDismissed, setCredDismissed] = useState(false);

  return (
    <div className="m365-panel">
      <div className="m365-panel-header">
        <span className="m365-panel-title">Inbox</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>
            ↻ Refresh
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setCompose('new')}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>
            + Compose
          </button>
        </div>
      </div>

      {loadState === 'cred-error' && !credDismissed && (
        <div className="m365-cred-banner">
          <span>Your Microsoft connection expired. <a href="#profile">Update in Profile Settings</a></span>
          <button type="button" onClick={() => setCredDismissed(true)} style={{ opacity: 0.6, fontSize: '1rem' }}>×</button>
        </div>
      )}

      {loadState === 'loading' && (
        <div className="m365-skeleton-list">
          {[1, 2, 3, 4].map(n => <div key={n} className="m365-skeleton-row" />)}
        </div>
      )}

      {loadState === 'error' && (
        <div className="m365-error-card">
          <span>Failed to load email.</span>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>Retry</button>
        </div>
      )}

      {loadState === 'ok' && messages.length === 0 && (
        <div className="m365-empty">
          <div className="m365-empty-title">All caught up</div>
          <div className="m365-empty-desc">No unread messages in your inbox.</div>
        </div>
      )}

      {loadState === 'ok' && messages.length > 0 && (
        <div className="mail-list">
          {messages.map(m => (
            <div key={m.id} className={`mail-row ${!m.isRead ? 'unread' : ''}`}
              onClick={() => setCompose(m)} role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setCompose(m)}>
              <div className="mail-row-top">
                <span className="mail-from">{m.fromName || m.fromEmail}</span>
                <span className="mail-time">{formatTime(m.receivedAt)}</span>
              </div>
              <div className="mail-subject">{m.subject}</div>
              <div className="mail-preview">{m.bodyPreview}</div>
            </div>
          ))}
        </div>
      )}

      {compose && (
        <ComposeModal
          replyTo={compose === 'new' ? undefined : compose}
          onSend={sendMail}
          onGetDraft={getDraft}
          onClose={() => setCompose(null)}
        />
      )}
    </div>
  );
}
