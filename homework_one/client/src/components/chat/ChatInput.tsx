import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatInput() {
  const { streaming, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    void sendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    setInput(ta.value);
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(140, ta.scrollHeight)}px`;
  };

  const disabled = !input.trim() || streaming;

  return (
    <div className="wc-composer">
      <textarea
        ref={textareaRef}
        className="wc-textarea"
        placeholder="Ask Nova anything…"
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-label="Ask Nova anything"
      />
      <button
        type="button"
        className={`wc-send${disabled ? ' wc-send-disabled' : ''}`}
        onClick={submit}
        disabled={disabled}
        aria-label="Send"
      >
        <SendIcon />
      </button>
    </div>
  );
}
