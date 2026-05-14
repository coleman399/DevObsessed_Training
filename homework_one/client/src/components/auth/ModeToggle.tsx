import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

export type Mode = 'signup' | 'signin';

interface ModeToggleProps {
  mode: Mode;
  onChange: (next: Mode) => void;
}

interface PillStyle {
  left: number;
  width: number;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLButtonElement>(null);
  const signinRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState<PillStyle>({ left: 3, width: 0 });

  useLayoutEffect(() => {
    const active = mode === 'signup' ? signupRef.current : signinRef.current;
    const container = containerRef.current;
    if (!active || !container) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setPill({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  }, [mode]);

  const pillStyle: CSSProperties = {
    left: `${pill.left}px`,
    width: `${pill.width}px`,
  };

  return (
    <div className="toggle" role="tablist" aria-label="Auth mode" ref={containerRef}>
      <span className="pill" style={pillStyle} aria-hidden="true" />
      <button
        ref={signupRef}
        type="button"
        role="tab"
        aria-selected={mode === 'signup'}
        className={mode === 'signup' ? 'active' : ''}
        onClick={() => onChange('signup')}
      >
        Sign up
      </button>
      <button
        ref={signinRef}
        type="button"
        role="tab"
        aria-selected={mode === 'signin'}
        className={mode === 'signin' ? 'active' : ''}
        onClick={() => onChange('signin')}
      >
        Sign in
      </button>
    </div>
  );
}
