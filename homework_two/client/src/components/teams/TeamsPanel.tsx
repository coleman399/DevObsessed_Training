import { useState } from 'react';
import { SendToChannelModal } from './SendToChannelModal';
import { useTeams } from '../../hooks/useTeams';
import type { UserProfile } from '../../lib/types';
import '../../styles/m365.css';

function formatTime(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

interface Props {
  profile: UserProfile;
  canPost: boolean;
}

export function TeamsPanel({ profile, canPost }: Props) {
  const { chats, channelMessages, channels, loadState, load, replyToChat, postToChannel, polishMessage } = useTeams(profile.teamsChannelsJson);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [credDismissed, setCredDismissed] = useState(false);
  const [replyOpen, setReplyOpen] = useState<string | null>(null); // chatId
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  async function handleReply(chatId: string) {
    if (!replyText.trim()) return;
    setReplySending(true);
    setReplyError(null);
    try {
      await replyToChat(chatId, replyText.trim());
      setReplyText('');
      setReplyOpen(null);
    } catch {
      setReplyError('Failed to send. Try again.');
    } finally {
      setReplySending(false);
    }
  }

  return (
    <div className="m365-panel">
      <div className="m365-panel-header">
        <span className="m365-panel-title">Teams</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>↻ Refresh</button>
          <button className="btn btn-primary" type="button" onClick={() => setSendModalOpen(true)}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}
            disabled={!canPost}>
            Post to channel
          </button>
        </div>
      </div>

      {!canPost && (
        <div className="teams-scope-warning">
          ⚠️ <strong>ChannelMessage.Send</strong> not granted — Teams is read-only.
          Contact your Azure AD admin to enable posting.
        </div>
      )}

      {loadState === 'cred-error' && !credDismissed && (
        <div className="m365-cred-banner">
          <span>Your Microsoft connection expired. <a href="#profile">Update in Profile Settings</a></span>
          <button type="button" onClick={() => setCredDismissed(true)} style={{ opacity: 0.6, fontSize: '1rem' }}>×</button>
        </div>
      )}

      {loadState === 'loading' && (
        <div className="m365-skeleton-list">
          {[1, 2, 3].map(n => <div key={n} className="m365-skeleton-row" />)}
        </div>
      )}

      {loadState === 'error' && (
        <div className="m365-error-card">
          <span>Failed to load Teams.</span>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>Retry</button>
        </div>
      )}

      {loadState === 'ok' && (
        <>
          {/* Chats / mentions */}
          {chats.length > 0 && (
            <>
              <div className="teams-section-label">Recent chats</div>
              <div className="teams-chat-list">
                {chats.slice(0, 5).map(c => (
                  <div key={c.id} className="teams-chat-row">
                    <div className="teams-chat-topic">{c.topic}</div>
                    <div className="teams-chat-preview">{c.lastMessagePreview}</div>

                    {/* Inline reply */}
                    {replyOpen === c.id ? (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <textarea
                          className="wi-comment-input"
                          rows={2}
                          placeholder="Reply…"
                          autoFocus
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleReply(c.id); }
                            if (e.key === 'Escape') { setReplyOpen(null); setReplyText(''); }
                          }}
                        />
                        {replyError && <div style={{ fontSize: '0.75rem', color: 'var(--agp-red)' }}>{replyError}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          <button className="btn btn-ghost" type="button"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => { setReplyOpen(null); setReplyText(''); setReplyError(null); }}>
                            Cancel
                          </button>
                          <button className="btn btn-primary" type="button"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            disabled={!replyText.trim() || replySending}
                            onClick={() => void handleReply(c.id)}>
                            {replySending ? 'Sending…' : 'Send'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="wi-comment-toggle" type="button"
                        onClick={() => { setReplyOpen(c.id); setReplyText(''); setReplyError(null); }}>
                        ▸ Reply
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Configured channels */}
          {channels.map(ch => {
            const msgs = channelMessages[ch.channelId] ?? [];
            return (
              <div key={ch.channelId} className="teams-channel-section">
                <div className="teams-channel-header">
                  <span className="teams-channel-name">{ch.teamName} · #{ch.channelName}</span>
                </div>
                {msgs.length === 0 ? (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>No recent messages.</div>
                ) : (
                  <div className="teams-msg-list">
                    {msgs.map(m => (
                      <div key={m.id} className="teams-msg-row">
                        <div className="teams-msg-header">
                          <span className="teams-msg-sender">{m.sender}</span>
                          <span className="teams-msg-time">{formatTime(m.sentAt)}</span>
                        </div>
                        <div className="teams-msg-content"
                          dangerouslySetInnerHTML={{ __html: m.content.replace(/<[^>]*>/g, '') }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {chats.length === 0 && channels.length === 0 && (
            <div className="m365-empty">
              <div className="m365-empty-title">No Teams activity</div>
              <div className="m365-empty-desc">Configure channels in Profile Settings to monitor them here.</div>
            </div>
          )}
        </>
      )}

      {sendModalOpen && (
        <SendToChannelModal
          channels={channels}
          displayName={profile.displayName}
          canPost={canPost}
          onPost={postToChannel}
          onPolish={polishMessage}
          onClose={() => setSendModalOpen(false)}
        />
      )}
    </div>
  );
}
