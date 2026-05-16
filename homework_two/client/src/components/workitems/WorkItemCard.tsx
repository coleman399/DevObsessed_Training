import { useRef, useState } from 'react';
import type { WorkItemSummary, WorkItemType } from '../../lib/types';

const STATE_TRANSITIONS: Record<string, string[]> = {
  // Bug + User Story
  New:      ['Active', 'Resolved', 'Closed'],
  Active:   ['Resolved', 'Closed'],
  Resolved: ['Active', 'Closed'],
  Closed:   ['Active'],
  // Task
  'To Do':      ['In Progress', 'Done'],
  'In Progress': ['To Do', 'Done'],
  Done:         ['To Do', 'In Progress'],
};

function typeBadgeClass(type: WorkItemType): string {
  if (type === 'Bug') return 'wi-type-badge bug';
  if (type === 'Task') return 'wi-type-badge task';
  return 'wi-type-badge userstory';
}

function statePillClass(state: string): string {
  const s = state.toLowerCase().replace(/\s+/g, '');
  return `wi-state-pill ${s}`;
}

interface Props {
  item: WorkItemSummary;
  onStateChange: (id: number, newState: string) => Promise<void>;
  onAddComment: (id: number, text: string) => Promise<void>;
}

export function WorkItemCard({ item, onStateChange, onAddComment }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nextStates = STATE_TRANSITIONS[item.state] ?? [];

  async function handleStateSelect(state: string) {
    setDropdownOpen(false);
    setStateError(null);
    try {
      await onStateChange(item.id, state);
    } catch {
      setStateError(`Failed to update state. Try again.`);
    }
  }

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setCommentPosting(true);
    setCommentError(null);
    try {
      await onAddComment(item.id, commentText.trim());
      setCommentText('');
      setCommentOpen(false);
    } catch {
      setCommentError('Failed to post comment. Try again.');
    } finally {
      setCommentPosting(false);
    }
  }

  return (
    <div className="wi-card">
      {/* Main row */}
      <div className="wi-card-row">
        <span className={typeBadgeClass(item.workItemType)}>{item.workItemType}</span>
        <span className="wi-id">#{item.id}</span>
        <span className="wi-title" title={item.title}>{item.title}</span>

        {/* State pill */}
        <div className="wi-state-wrap" ref={dropdownRef}>
          <button
            type="button"
            className={statePillClass(item.state)}
            onClick={() => setDropdownOpen(o => !o)}
            aria-label="Change state"
          >
            {item.state}
          </button>
          {dropdownOpen && nextStates.length > 0 && (
            <div className="wi-state-dropdown">
              {nextStates.map(s => (
                <button key={s} type="button" className="wi-state-option" onClick={() => handleStateSelect(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {item.url && (
          <a className="wi-ado-link" href={item.url} target="_blank" rel="noreferrer" title="Open in Azure DevOps">
            ↗
          </a>
        )}
      </div>

      {stateError && <div className="wi-inline-error">{stateError}</div>}

      {/* Comment section */}
      <button
        type="button"
        className="wi-comment-toggle"
        onClick={() => { setCommentOpen(o => !o); setCommentError(null); }}
      >
        {commentOpen ? '▾' : '▸'} Add comment
      </button>

      {commentOpen && (
        <div className="wi-comment-form">
          <textarea
            className="wi-comment-input"
            rows={2}
            placeholder="Write a comment…"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          {commentError && <div className="wi-inline-error">{commentError}</div>}
          <div className="wi-comment-actions">
            <button className="btn btn-ghost" type="button"
              onClick={() => { setCommentOpen(false); setCommentText(''); }}>
              Cancel
            </button>
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
