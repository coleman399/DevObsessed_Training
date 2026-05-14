import { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageBubble } from './MessageBubble';

export function MessageList() {
  const { activeConversation, streaming } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = activeConversation?.messages ?? [];

  const firstBotIndex = messages.findIndex((m) => m.role === 'assistant');
  const lastMsg = messages[messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length, lastMsg?.content, streaming]);

  return (
    <div className="wc-thread" role="log" aria-live="polite" aria-label="Conversation">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          showByline={i === firstBotIndex}
          showTyping={msg.role === 'assistant' && msg.content === '' && streaming}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
