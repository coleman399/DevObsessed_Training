import { useState } from 'react';
import type { PullRequestSummary } from '../../lib/types';

type SummaryState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  pr: PullRequestSummary;
  onSummarize: (title: string, description: string | null, changedFiles: string[]) => Promise<string>;
  onApprove?: (repoId: string, prId: string) => Promise<void>;
  onAddComment: (prId: string, text: string) => Promise<void>;
}

export function PullRequestCard({ pr, onSummarize, onApprove, onAddComment }: Props) {
  const [summaryState, setSummaryState] = useState<SummaryState>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  async function handleSummarize() {
    setSummaryState('loading');
    setSummaryError(null);
    try {
      const text = await onSummarize(pr.title, pr.description, []);
      setSummary(text);
      setSummaryState('ready');
    } catch {
      setSummaryState('error');
      setSummaryError('Failed to summarize. Try again.');
    }
  }

  async function handleApprove() {
    if (!onApprove) return;
    setApproving(true);
    try {
      await onApprove(pr.repoId, pr.id);
    } catch {
      // error is not blocking — user sees no change
    } finally {
      setApproving(false);
    }
  }

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setCommentPosting(true);
    setCommentError(null);
    try {
      await onAddComment(pr.id, commentText.trim());
      setCommentText('');
      setCommentOpen(false);
    } catch {
      setCommentError('Failed to post. Try again.');
    } finally {
      setCommentPosting(false);
    }
  }

  return (
    <div className="pr-card">
      <div className="pr-card-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="repo-platform-badge" style={{ flexShrink: 0 }}
              data-platform={pr.platform}>{pr.platform === 'ado' ? 'ADO' : 'GH'}</span>
            <span className="pr-title">{pr.title}</span>
            {pr.url && (
              <a href={pr.url} target="_blank" rel="noreferrer"
                style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>↗</a>
            )}
          </div>
          <div className="pr-meta">
            <span className="pr-branch">{pr.sourceBranch} → {pr.targetBranch}</span>
            <span className="pr-author">by {pr.author}</span>
            <span className="pr-status-pill">{pr.status}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{pr.repoName}</span>
          </div>
        </div>
      </div>

      {/* Summary box */}
      {summaryState === 'loading' && (
        <div className="pr-summary-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite', flexShrink: 0, display: 'inline-block' }} />
          Summarizing…
        </div>
      )}
      {summaryState === 'ready' && summary && (
        <div className="pr-summary-box">{summary}</div>
      )}
      {summaryState === 'error' && (
        <div style={{ fontSize: '0.75rem', color: 'var(--agp-red)' }}>
          {summaryError} <button type="button" onClick={handleSummarize} style={{ color: 'inherit', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* Actions */}
      <div className="pr-actions">
        {summaryState === 'idle' && (
          <button className="btn btn-ghost" type="button" onClick={handleSummarize}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            Summarize ✦
          </button>
        )}
        {pr.platform === 'ado' && onApprove && (
          <button className="btn btn-ghost" type="button"
            disabled={approving} onClick={handleApprove}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            {approving ? 'Approving…' : '✓ Approve'}
          </button>
        )}
        <button className="btn btn-ghost" type="button"
          onClick={() => { setCommentOpen(o => !o); setCommentError(null); }}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
          {commentOpen ? 'Cancel' : '💬 Comment'}
        </button>
      </div>

      {/* Comment form */}
      {commentOpen && (
        <div className="pr-comment-form">
          <textarea className="pr-comment-input" rows={2}
            placeholder="Write a review comment…"
            value={commentText} onChange={e => setCommentText(e.target.value)} />
          {commentError && <div style={{ fontSize: '0.75rem', color: 'var(--agp-red)' }}>{commentError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
            <button className="btn btn-primary" type="button"
              disabled={!commentText.trim() || commentPosting}
              onClick={handlePostComment}>
              {commentPosting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
