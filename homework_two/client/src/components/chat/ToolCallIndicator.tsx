interface Props { label: string; }

export function ToolCallIndicator({ label }: Props) {
  return (
    <div className="tool-call-indicator">
      <span className="tool-call-dot" />
      {label}
    </div>
  );
}
