import { useState } from 'react';
import type { WorkItemDraft, WorkItemType } from '../../lib/types';

type DraftState = 'idle' | 'loading' | 'ready' | 'error';

const TYPES: WorkItemType[] = ['Bug', 'Task', 'User Story'];

function defaultType(role: string): WorkItemType {
  if (role === 'ProductOwner') return 'User Story';
  if (role === 'QA') return 'Bug';
  return 'Task';
}

interface Props {
  role: string;
  onGetDraft: (description: string, type: WorkItemType) => Promise<WorkItemDraft>;
  onCreate: (draft: WorkItemDraft) => Promise<void>;
  onClose: () => void;
}

export function WorkItemBuilder({ role, onGetDraft, onCreate, onClose }: Props) {
  const [type, setType] = useState<WorkItemType>(defaultType(role));
  const [description, setDescription] = useState('');
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkItemDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleDraft() {
    if (!description.trim()) return;
    setDraftState('loading');
    setDraftError(null);
    try {
      const d = await onGetDraft(description.trim(), type);
      setDraft(d);
      setDraftState('ready');
    } catch {
      setDraftState('error');
      setDraftError('Claude couldn\'t draft this item. Try again.');
    }
  }

  async function handleCreate() {
    if (!draft) return;
    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(draft);
      onClose();
    } catch {
      setCreateError('Failed to create work item. Check your DevOps connection in Profile Settings.');
      setCreating(false);
    }
  }

  function updateDraft<K extends keyof WorkItemDraft>(key: K, value: WorkItemDraft[K]) {
    setDraft(d => d ? { ...d, [key]: value } : d);
  }

  return (
    <div className="wib-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wib-modal">
        <div className="wib-header">
          <span className="wib-header-title">New Work Item</span>
          <button type="button" className="wib-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="wib-body">
          {/* Type selector */}
          <div>
            <label className="wib-label">Type</label>
            <div className="wib-type-row">
              {TYPES.map(t => (
                <button key={t} type="button"
                  className={`wib-type-btn ${type === t ? 'selected' : ''}`}
                  onClick={() => { setType(t); setDraft(null); setDraftState('idle'); }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description input */}
          <div>
            <label className="wib-label">Describe the item</label>
            <textarea
              className="wib-textarea"
              rows={3}
              placeholder={
                type === 'Bug'        ? 'Describe the bug and how to reproduce it…' :
                type === 'Task'       ? 'Describe the technical task…' :
                                        'Describe the user need or feature…'
              }
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Draft button */}
          {draftState === 'idle' || draftState === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="button"
                disabled={!description.trim()}
                onClick={handleDraft}>
                Draft with AI ✦
              </button>
              {draftError && (
                <div className="wib-error">
                  <span>{draftError}</span>
                  <button type="button" className="btn btn-ghost" onClick={handleDraft} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    Try again
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Loading skeleton */}
          {draftState === 'loading' && (
            <div className="wib-skeleton">
              <div className="wib-skeleton-label">
                <span className="wib-skeleton-dot" />
                Asking Claude…
              </div>
              <div className="wib-skeleton-bar" style={{ width: '60%' }} />
              <div className="wib-skeleton-bar" style={{ width: '90%' }} />
              <div className="wib-skeleton-bar" style={{ width: '75%' }} />
            </div>
          )}

          {/* Editable draft */}
          {draftState === 'ready' && draft && (
            <div className="wib-draft-section">
              <div className="wib-draft-header">
                <span>AI Draft — edit before creating</span>
                <button type="button" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}
                  onClick={handleDraft}>Re-draft</button>
              </div>

              <div className="wib-field">
                <label className="wib-label">Title</label>
                <input className="wib-input" type="text" value={draft.title}
                  onChange={e => updateDraft('title', e.target.value)} />
              </div>

              <div className="wib-field">
                <label className="wib-label">Description</label>
                <textarea className="wib-textarea" rows={3} value={draft.description}
                  onChange={e => updateDraft('description', e.target.value)} />
              </div>

              {draft.workItemType === 'Bug' && (
                <div className="wib-field">
                  <label className="wib-label">Repro steps</label>
                  <textarea className="wib-textarea" rows={3} value={draft.reproSteps ?? ''}
                    onChange={e => updateDraft('reproSteps', e.target.value)} />
                </div>
              )}

              {draft.workItemType === 'Task' && (
                <div className="wib-field">
                  <label className="wib-label">Remaining work (hours)</label>
                  <input className="wib-input" type="number" min={0} value={draft.remainingWork ?? ''}
                    onChange={e => updateDraft('remainingWork', Number(e.target.value))} />
                </div>
              )}

              {draft.workItemType === 'User Story' && draft.acceptanceCriteria && (
                <div className="wib-field">
                  <label className="wib-label">Acceptance criteria</label>
                  <textarea className="wib-textarea" rows={4}
                    value={draft.acceptanceCriteria.join('\n')}
                    onChange={e => updateDraft('acceptanceCriteria', e.target.value.split('\n'))} />
                </div>
              )}

              {draft.tags.length > 0 && (
                <div>
                  <label className="wib-label">Tags</label>
                  <div className="wib-tags">
                    {draft.tags.map(t => <span key={t} className="wib-tag">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {createError && <div className="wib-error"><span>{createError}</span></div>}
        </div>

        <div className="wib-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="button"
            disabled={!draft || !draft.title || creating}
            onClick={handleCreate}>
            {creating ? 'Creating…' : 'Create in DevOps'}
          </button>
        </div>
      </div>
    </div>
  );
}
