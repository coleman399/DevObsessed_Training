import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { TeamsChannel } from '../../lib/types';

type PolishState = 'idle' | 'loading' | 'error';

interface Props {
  channels: TeamsChannel[];
  displayName: string;
  canPost: boolean;
  onPost: (teamId: string, channelId: string, content: string) => Promise<void>;
  onPolish: (message: string) => Promise<string>;
  onClose: () => void;
}

export function SendToChannelModal({ channels, displayName, canPost, onPost, onPolish, onClose }: Props) {
  const { toast } = useToast();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [message, setMessage] = useState('');
  const [polishState, setPolishState] = useState<PolishState>('idle');
  const [polishError, setPolishError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const selected = channels[selectedIdx];

  async function handlePolish() {
    if (!message.trim()) return;
    setPolishState('loading');
    setPolishError(null);
    try {
      const polished = await onPolish(message);
      setMessage(polished);
      setPolishState('idle');
    } catch {
      setPolishState('error');
      setPolishError('Polish failed. You can still post the original.');
    }
  }

  async function handlePost() {
    if (!selected || !message.trim() || !canPost) return;
    setPosting(true);
    try {
      await onPost(selected.teamId, selected.channelId, message.trim());
      toast(`Posted to #${selected.channelName}`);
      onClose();
    } catch {
      toast('Failed to post message.');
      setPosting(false);
    }
  }

  return (
    <div className="stc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="stc-modal">
        <div className="stc-header">
          <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Post to Channel</span>
          <button type="button" className="compose-close" onClick={onClose}>×</button>
        </div>

        <div className="stc-body">
          {!canPost && (
            <div className="teams-scope-warning">
              ⚠️ <strong>ChannelMessage.Send</strong> not granted. IT admin consent required to post.
            </div>
          )}

          {channels.length === 0 ? (
            <div className="m365-empty" style={{ padding: '1rem 0' }}>
              <div className="m365-empty-title">No channels configured</div>
              <div className="m365-empty-desc">Add channels in Profile Settings.</div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Channel</label>
                <select className="stc-select" value={selectedIdx}
                  onChange={e => setSelectedIdx(Number(e.target.value))}>
                  {channels.map((ch, i) => (
                    <option key={ch.channelId} value={i}>
                      {ch.teamName} · #{ch.channelName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Message</label>
                  <button className="btn btn-ghost" type="button"
                    disabled={!message.trim() || polishState === 'loading'}
                    onClick={handlePolish}
                    style={{ fontSize: '0.75rem', padding: '0.1875rem 0.5rem' }}>
                    {polishState === 'loading' ? 'Polishing…' : 'Polish with AI ✦'}
                  </button>
                </div>
                <textarea className="stc-textarea" rows={5}
                  placeholder="Write your message…"
                  value={message} onChange={e => setMessage(e.target.value)} />
                {polishState === 'error' && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--agp-orange)', marginTop: '0.25rem' }}>{polishError}</div>
                )}
              </div>

              {selected && (
                <div className="stc-preview-strip">
                  Posting as {displayName} to {selected.teamName} · #{selected.channelName}
                </div>
              )}
            </>
          )}
        </div>

        <div className="stc-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="button"
            disabled={!canPost || !message.trim() || posting || channels.length === 0}
            onClick={handlePost}>
            {posting ? 'Posting…' : 'Post to channel'}
          </button>
        </div>
      </div>
    </div>
  );
}
