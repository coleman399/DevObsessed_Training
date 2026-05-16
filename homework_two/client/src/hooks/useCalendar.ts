import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getGraphToken } from '../lib/auth';
import type { CalendarEvent, EventDraft } from '../lib/types';

type LoadState = 'idle' | 'loading' | 'ok' | 'error' | 'cred-error';

async function graphHeaders(): Promise<Record<string, string>> {
  const token = await getGraphToken();
  const h: Record<string, string> = {};
  if (token) h['X-Graph-Token'] = token;
  return h;
}

function weekBounds(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const initialized = useRef(false);

  const load = useCallback(async (anchor?: Date) => {
    const bounds = weekBounds(anchor ?? weekAnchor);
    setLoadState('loading');
    try {
      const data = await apiFetch<CalendarEvent[]>(
        `/api/graph/calendar?start=${encodeURIComponent(bounds.start)}&end=${encodeURIComponent(bounds.end)}`,
        { headers: await graphHeaders() }
      );
      setEvents(data);
      setLoadState('ok');
    } catch (e) {
      const status = (e as { status?: number }).status;
      setLoadState(status === 401 || status === 403 ? 'cred-error' : 'error');
    }
  }, [weekAnchor]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  const goToWeek = useCallback((direction: 'prev' | 'next') => {
    setWeekAnchor(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      void load(next);
      return next;
    });
  }, [load]);

  const createEvent = useCallback(async (
    title: string, startTime: string, endTime: string,
    attendees: string[], description: string, addTeamsMeeting: boolean
  ) => {
    await apiFetch('/api/graph/calendar/events', {
      method: 'POST',
      body: { title, startTime, endTime, attendees, description, addTeamsMeeting },
      headers: await graphHeaders(),
    });
    void load();
  }, [load]);

  const getEventDraft = useCallback(async (description: string): Promise<EventDraft> => {
    return apiFetch<EventDraft>('/api/chat/event-draft', {
      method: 'POST',
      body: { description },
    });
  }, []);

  return { events, loadState, weekAnchor, load, goToWeek, createEvent, getEventDraft };
}
