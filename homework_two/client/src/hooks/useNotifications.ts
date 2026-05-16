import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getDevOpsToken, getGraphToken } from '../lib/auth';
import type { Notification } from '../lib/types';

const POLL_MS = 60_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [devOpsToken, graphToken] = await Promise.all([getDevOpsToken(), getGraphToken()]);
      const headers: Record<string, string> = {};
      if (devOpsToken) headers['X-DevOps-Token'] = devOpsToken;
      if (graphToken)  headers['X-Graph-Token']  = graphToken;

      const data = await apiFetch<Notification[]>('/api/notifications', { headers });
      setNotifications(data);
    } catch {
      // Keep existing notifications on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    intervalRef.current = setInterval(() => void load(), POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, loading, unreadCount, markAllRead, markRead };
}
