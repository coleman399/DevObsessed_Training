import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { EventDraft } from '../../lib/types';

type DraftState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  onGetDraft: (description: string) => Promise<EventDraft>;
  onCreate: (title: string, startTime: string, endTime: string, attendees: string[], description: string, addTeams: boolean) => Promise<void>;
  onClose: () => void;
}

function nowPlusHour(offsetHours = 1) {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function NewEventModal({ onGetDraft, onCreate, onClose }: Props) {
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState('');
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [draftError, setDraftError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(nowPlusHour(1));
  const [endTime, setEndTime] = useState(nowPlusHour(2));
  const [attendees, setAttendees] = useState('');
  const [description, setDescription] = useState('');
  const [addTeams, setAddTeams] = useState(true);
  const [creating, setCreating] = useState(false);

  async function handleDraft() {
    if (!aiPrompt.trim()) return;
    setDraftState('loading');
    setDraftError(null);
    try {
      const draft = await onGetDraft(aiPrompt.trim());
      setTitle(draft.title);
      setStartTime(draft.startTime.slice(0, 16));
      setEndTime(draft.endTime.slice(0, 16));
      setAttendees(draft.attendees.join(', '));
      setDescription(draft.description);
      setDraftState('ready');
    } catch {
      setDraftState('error');
      setDraftError('Failed to draft event. Try again.');
    }
  }

  async function handleCreate() {
    if (!title) return;
    setCreating(true);
    try {
      const att = attendees.split(',').map(a => a.trim()).filter(Boolean);
      await onCreate(title, startTime + ':00', endTime + ':00', att, description, addTeams);
      toast('Event created');
      onClose();
    } catch {
      toast('Failed to create event.');
      setCreating(false);
    }
  }

  return (
    <div className="event-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="event-modal">
        <div className="event-modal-header">
          <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>New Event</span>
          <button type="button" className="compose-close" onClick={onClose}>×</button>
        </div>

        <div className="event-modal-body">
          {/* AI prompt */}
          <div>
            <label className="event-label">Describe the meeting (optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input className="event-input" type="text"
                placeholder="e.g. 30-min sprint retro with the team tomorrow at 2pm"
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                style={{ flex: 1 }} />
              <button className="btn btn-ghost" type="button"
                disabled={!aiPrompt.trim() || draftState === 'loading'}
                onClick={handleDraft} style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                {draftState === 'loading' ? '…' : 'Draft with AI ✦'}
              </button>
            </div>
            {draftState === 'error' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--agp-red)', marginTop: '0.25rem' }}>
                {draftError} <button type="button" onClick={handleDraft} style={{ color: 'inherit', textDecoration: 'underline' }}>Retry</button>
              </div>
            )}
            {draftState === 'loading' && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div className="compose-skel-bar" style={{ width: '55%' }} />
                <div className="compose-skel-bar" style={{ width: '80%' }} />
              </div>
            )}
          </div>

          <div className="event-field">
            <label className="event-label">Title</label>
            <input className="event-input" type="text" placeholder="Meeting title"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="event-row2">
            <div className="event-field">
              <label className="event-label">Start</label>
              <input className="event-input" type="datetime-local"
                value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="event-field">
              <label className="event-label">End</label>
              <input className="event-input" type="datetime-local"
                value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="event-field">
            <label className="event-label">Attendees (comma-separated emails)</label>
            <input className="event-input" type="text" placeholder="alice@agp.com, bob@agp.com"
              value={attendees} onChange={e => setAttendees(e.target.value)} />
          </div>

          <div className="event-field">
            <label className="event-label">Description</label>
            <textarea className="event-textarea" rows={3}
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <label className="event-checkbox-row">
            <input type="checkbox" checked={addTeams} onChange={e => setAddTeams(e.target.checked)} />
            Add Teams meeting link
          </label>
        </div>

        <div className="event-modal-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="button"
            disabled={!title || creating} onClick={handleCreate}>
            {creating ? 'Creating…' : 'Create event'}
          </button>
        </div>
      </div>
    </div>
  );
}
