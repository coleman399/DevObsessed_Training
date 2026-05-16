interface Props {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export function MessageBubble({ role, content, streaming }: Props) {
  return (
    <div className={`chat-msg ${role}`}>
      <div className={`chat-bubble${streaming ? ' streaming' : ''}`}>
        {content || (streaming ? '' : '…')}
      </div>
    </div>
  );
}
