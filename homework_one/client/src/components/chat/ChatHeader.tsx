import { useChat } from '../../hooks/useChat';

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChatHeader() {
  const { activeConversation, startNewConversation } = useChat();
  const title = activeConversation?.title ?? 'New conversation';

  return (
    <div className="wc-header">
      <span className="wc-header-title">
        <span className="wc-header-dot" aria-hidden="true" />
        <span className="wc-header-label">{title.toUpperCase()}</span>
      </span>
      <button
        type="button"
        className="wc-header-new"
        onClick={startNewConversation}
        title="Start a new conversation"
        aria-label="New conversation"
      >
        <PlusIcon />
        New
      </button>
    </div>
  );
}
