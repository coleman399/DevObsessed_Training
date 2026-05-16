import { useState } from 'react';
import { NewEventModal } from './NewEventModal';
import { useCalendar } from '../../hooks/useCalendar';
import '../../styles/m365.css';

function formatTimeRange(start: string, end: string, isAllDay: boolean) {
  if (isAllDay) return 'All day';
  try {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${fmt(s)} – ${fmt(e)}`;
  } catch { return ''; }
}

function weekLabel(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString([], opts)} – ${end.toLocaleDateString([], opts)}`;
}

export function CalendarPanel() {
  const { events, loadState, weekAnchor, load, goToWeek, createEvent, getEventDraft } = useCalendar();
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [credDismissed, setCredDismissed] = useState(false);

  return (
    <div className="m365-panel">
      <div className="m365-panel-header">
        <span className="m365-panel-title">Calendar</span>
        <button className="btn btn-primary" type="button" onClick={() => setNewEventOpen(true)}
          style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>
          + New Event
        </button>
      </div>

      {loadState === 'cred-error' && !credDismissed && (
        <div className="m365-cred-banner">
          <span>Your Microsoft connection expired. <a href="#profile">Update in Profile Settings</a></span>
          <button type="button" onClick={() => setCredDismissed(true)} style={{ opacity: 0.6, fontSize: '1rem' }}>×</button>
        </div>
      )}

      <div className="cal-nav">
        <button className="btn btn-ghost" type="button" onClick={() => goToWeek('prev')}
          style={{ padding: '0.3125rem 0.625rem', fontSize: '0.75rem' }}>
          ← Prev
        </button>
        <span className="cal-week-label">{weekLabel(weekAnchor)}</span>
        <button className="btn btn-ghost" type="button" onClick={() => goToWeek('next')}
          style={{ padding: '0.3125rem 0.625rem', fontSize: '0.75rem' }}>
          Next →
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => void load()}
          style={{ padding: '0.3125rem 0.625rem', fontSize: '0.75rem' }}>
          ↻
        </button>
      </div>

      {loadState === 'loading' && (
        <div className="m365-skeleton-list">
          {[1, 2, 3].map(n => <div key={n} className="m365-skeleton-row" />)}
        </div>
      )}

      {loadState === 'error' && (
        <div className="m365-error-card">
          <span>Failed to load calendar.</span>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>Retry</button>
        </div>
      )}

      {loadState === 'ok' && events.length === 0 && (
        <div className="m365-empty">
          <div className="m365-empty-title">No events this week</div>
          <div className="m365-empty-desc">Your calendar is clear.</div>
        </div>
      )}

      {loadState === 'ok' && events.length > 0 && (
        <div className="cal-list">
          {events.map(ev => (
            <div key={ev.id} className="event-card">
              <div className="event-card-top">
                <span className="event-title">{ev.title}</span>
                <span className="event-time">{formatTimeRange(ev.start, ev.end, ev.isAllDay)}</span>
                {ev.joinUrl && (
                  <a className="event-join-btn" href={ev.joinUrl} target="_blank" rel="noreferrer">
                    Join
                  </a>
                )}
              </div>
              {ev.location && <div className="event-location">{ev.location}</div>}
            </div>
          ))}
        </div>
      )}

      {newEventOpen && (
        <NewEventModal
          onGetDraft={getEventDraft}
          onCreate={createEvent}
          onClose={() => setNewEventOpen(false)}
        />
      )}
    </div>
  );
}
