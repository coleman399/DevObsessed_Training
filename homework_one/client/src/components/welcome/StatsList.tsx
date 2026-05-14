import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { formatPlan } from '../../lib/validation';
import { ApiError, type Stats } from '../../lib/types';

interface StatsListProps {
  /** Called when /api/stats returns 401 — typically wired to useAuth().logout. */
  onSessionExpired?: () => void;
}

type Status = 'loading' | 'ready' | 'error';

export function StatsList({ onSessionExpired }: StatsListProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<Stats>('/api/stats');
        if (cancelled) return;
        setStats(data);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onSessionExpired?.();
          return;
        }
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onSessionExpired]);

  return (
    <div className="w-right">
      <h2>Today, in your space</h2>
      {status === 'loading' && <p className="w-stats-loading">Fetching…</p>}
      {status === 'error' && <p className="w-stats-error">Couldn't load stats. Try refreshing.</p>}
      {status === 'ready' && stats && (
        <ul className="w-stats">
          <li>
            <span className="label">Drafts</span>
            <span className="value">{stats.drafts}</span>
          </li>
          <li>
            <span className="label">Pending invites</span>
            <span className="value">{stats.pendingInvites}</span>
          </li>
          <li>
            <span className="label">Workspace</span>
            <span className="value mono">{stats.workspaceName}</span>
          </li>
          <li>
            <span className="label">Plan</span>
            <span className="value">{formatPlan(stats.plan)}</span>
          </li>
        </ul>
      )}
    </div>
  );
}
