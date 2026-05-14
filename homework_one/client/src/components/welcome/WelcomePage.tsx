import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChatProvider } from '../../hooks/useChat';
import { deriveName, timeGreeting } from '../../lib/validation';
import { ChatHeader } from '../chat/ChatHeader';
import { ChatInput } from '../chat/ChatInput';
import { MessageList } from '../chat/MessageList';
import { RecentConversationsList } from '../chat/RecentConversationsList';
import { TodayPanel } from './TodayPanel';

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function WelcomePage() {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const displayName = user?.name?.trim() || deriveName(user?.email ?? '');
  const firstName = displayName.split(' ')[0] || 'friend';

  return (
    <ChatProvider firstName={firstName}>
      <section className="w-stage" aria-labelledby="welcome-title">
        <span className="w-time">
          <span className="dot" aria-hidden="true" />
          {formatTime(now)} · {timeGreeting(now)}
        </span>
        <button type="button" className="w-signout" onClick={logout}>
          Sign out ↗
        </button>

        <div className="w-grid">
          <div className="w-left">
            <span className="w-eyebrow">
              <span className="dot" aria-hidden="true" />
              Session active
            </span>
            <h1 className="w-title" id="welcome-title">
              <span className="l1">Welcome,</span>
              <span className="l2">{firstName}.</span>
            </h1>
            <p className="w-sub">
              We're glad you're here. Ask Nova anything — or pick up where you left off.
            </p>

            <div className="wc-chat">
              <ChatHeader />
              <MessageList />
              <ChatInput />
            </div>
          </div>

          <div className="w-right">
            <TodayPanel onSessionExpired={logout} />
            <RecentConversationsList />
          </div>
        </div>
      </section>
    </ChatProvider>
  );
}
