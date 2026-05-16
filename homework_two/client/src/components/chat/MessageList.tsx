import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { LocalMessage } from '../../hooks/useChat';

interface Props {
  messages: LocalMessage[];
  streaming: boolean;
}

export function MessageList({ messages, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const lastMsg = messages[messages.length - 1];
  const lastIsStreamingAssistant =
    streaming && lastMsg?.role === 'assistant';

  return (
    <div className="chat-thread" role="log" aria-live="polite">
      {messages.map((m, i) => {
        const isLastAssistant = i === messages.length - 1 && m.role === 'assistant';
        return (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            streaming={isLastAssistant && streaming}
          />
        );
      })}
      {streaming && !lastIsStreamingAssistant && (
        <div className="chat-msg assistant">
          <div className="chat-bubble streaming" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
