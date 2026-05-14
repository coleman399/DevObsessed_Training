import type { ReactNode, InputHTMLAttributes } from 'react';
import { TickIcon, WarnIcon } from '../icons';

interface FieldRowProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  leadingIcon: ReactNode;
  trailing?: ReactNode;
  hint?: string;
  error?: string;
  valid?: boolean;
}

export function FieldRow({
  label,
  leadingIcon,
  trailing,
  hint,
  error,
  valid,
  id,
  className,
  ...inputProps
}: FieldRowProps) {
  const inputId = id ?? inputProps.name ?? label.toLowerCase();
  const errorId = `${inputId}-error`;
  const wrapClass = [
    'field-wrap',
    error ? 'error' : '',
    !error && valid ? 'valid' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className={wrapClass}>
        <span className="field-icon" aria-hidden="true">
          {leadingIcon}
        </span>
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {error && (
          <span className="field-icon warn" aria-hidden="true">
            <WarnIcon />
          </span>
        )}
        {!error && valid && (
          <span className="field-icon tick" aria-hidden="true">
            <TickIcon />
          </span>
        )}
        {trailing}
      </div>
      <div className="field-meta">
        {error ? (
          <span id={errorId} className="field-err" role="alert">
            <WarnIcon width={12} height={12} />
            {error}
          </span>
        ) : (
          <span className="field-hint">{valid ? 'Looks good' : hint ?? ''}</span>
        )}
      </div>
    </div>
  );
}
