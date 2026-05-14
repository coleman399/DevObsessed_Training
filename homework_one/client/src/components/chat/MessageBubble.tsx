import type { LocalMessage } from '../../hooks/useChat';

interface MessageBubbleProps {
  message: LocalMessage;
  showTyping: boolean;
  showByline: boolean;
}

function Byline() {
  return (
    <div className="wc-byline">
      <span className="wc-bot-mark" aria-hidden="true" />
      <span>NOVA</span>
    </div>
  );
}

export function MessageBubble({ message, showTyping, showByline }: MessageBubbleProps) {
  const isBot = message.role === 'assistant';

  return (
    <div className={`wc-msg ${isBot ? 'bot' : 'user'}`}>
      {isBot && showByline && <Byline />}
      <div className={`wc-bubble ${isBot ? 'wc-bubble-bot' : 'wc-bubble-user'}`}>
        {showTyping ? (
          <div className="wc-typing" aria-label="Nova is typing">
            <i />
            <i />
            <i />
          </div>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
