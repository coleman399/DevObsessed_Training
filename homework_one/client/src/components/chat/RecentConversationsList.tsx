import { relativeTime } from '../../lib/chat';
import { useChat } from '../../hooks/useChat';

export function RecentConversationsList() {
  const { recentConversations, activeConversationId, selectConversation } = useChat();

  if (recentConversations.length === 0) return null;

  return (
    <div className="wc-recents">
      <div className="wc-recents-header">
        <span className="wc-recents-label">RECENT CONVERSATIONS</span>
        <span className="wc-recents-count">{recentConversations.length}</span>
      </div>
      {recentConversations.map((conv) => (
        <button
          key={conv.id}
          type="button"
          className={`wc-recent-row${conv.id === activeConversationId ? ' active' : ''}`}
          onClick={() => void selectConversation(conv.id)}
        >
          <span className="wc-recent-title">{conv.title}</span>
          <span className="wc-recent-time">{relativeTime(conv.updatedAt)}</span>
        </button>
      ))}
    </div>
  );
}
