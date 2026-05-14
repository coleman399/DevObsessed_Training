import { STRENGTH_LABELS, type Strength } from '../../lib/validation';

interface PasswordStrengthProps {
  strength: Strength;
}

export function PasswordStrength({ strength }: PasswordStrengthProps) {
  return (
    <div className="field-meta" aria-live="polite">
      <div className="strength" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <i key={bar} className={strength >= bar ? `on-${strength}` : ''} />
        ))}
      </div>
      <span className="strength-label mono">{STRENGTH_LABELS[strength]}</span>
    </div>
  );
}
