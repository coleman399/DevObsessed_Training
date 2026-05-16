import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { PanelTarget } from '../../lib/types';
import '../../styles/overlay.css';

function relTime(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)        return 'just now';
    if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ''; }
}

const TYPE_ICON: Record<string, string> = {
  mention: '💬', pr_review: '⌥', work_item: '◻', email: '✉', meeting: '📅',
};

interface Props {
  onNavigate: (tab: PanelTarget) => void;
}

export function NotificationBell({ onNavigate }: Props) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="cs-nav-bell"
        style={{ position: 'relative' }}
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M8 1a5 5 0 0 1 5 5v2l1.5 2.5h-13L3 8V6a5 5 0 0 1 5-5z"/>
          <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}
                style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 400 }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">You're all caught up</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`nb-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => {
                    markRead(n.id);
                    onNavigate(n.panelTarget as PanelTarget);
                    setOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <span className="nb-item-title">{n.title}</span>
                  </div>
                  <div className="nb-item-body">{n.body}</div>
                  <div className="nb-item-meta">{relTime(n.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
