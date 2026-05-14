import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon } from '../icons';
import { emailValid, passwordStrength } from '../../lib/validation';
import { FieldRow } from './FieldRow';
import { PasswordStrength } from './PasswordStrength';

export interface SignUpSubmitArgs {
  name: string;
  email: string;
  password: string;
}

interface SignUpFormProps {
  onSubmit: (args: SignUpSubmitArgs) => Promise<void> | void;
  loading?: boolean;
  initialEmail?: string;
  initialName?: string;
  emailError?: string | null;
  onClearEmailError?: () => void;
}

export function SignUpForm({
  onSubmit,
  loading = false,
  initialEmail = '',
  initialName = '',
  emailError = null,
  onClearEmailError,
}: SignUpFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);

  const strength = passwordStrength(password);
  const emailIsValid = email.length > 0 && emailValid(email);
  const eShowLocalError = emailTouched && email.length > 0 && !emailIsValid;
  const pwError = pwTouched && password.length > 0 && password.length < 6;
  const canSubmit =
    name.trim().length > 0 && emailIsValid && password.length >= 6 && !loading;

  const onPwKey = (e: KeyboardEvent<HTMLInputElement>) => {
    setCaps(e.getModifierState('CapsLock'));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void onSubmit({ name: name.trim(), email, password });
  };

  return (
    <form className="form-area" onSubmit={handleSubmit} noValidate>
      <FieldRow
        label="Full name"
        name="name"
        autoComplete="name"
        value={name}
        leadingIcon={<UserIcon />}
        onChange={(e) => setName(e.target.value)}
        hint="What should we call you?"
      />

      <FieldRow
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        leadingIcon={<MailIcon />}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) onClearEmailError?.();
        }}
        onBlur={() => setEmailTouched(true)}
        valid={emailIsValid}
        error={emailError ?? (eShowLocalError ? "That doesn't look right." : undefined)}
        hint="We'll never share it."
      />

      <FieldRow
        label="Password"
        name="password"
        type={showPw ? 'text' : 'password'}
        autoComplete="new-password"
        value={password}
        leadingIcon={<LockIcon />}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setPwTouched(true)}
        onKeyDown={onPwKey}
        onKeyUp={onPwKey}
        error={pwError ? 'Use at least 6 characters.' : undefined}
        trailing={
          <button
            type="button"
            className="eye"
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
      />

      {password.length > 0 && <PasswordStrength strength={strength} />}
      {caps && (
        <p className="caps" role="status">
          <span aria-hidden="true">⇪</span> Caps Lock is on.
        </p>
      )}

      <button type="submit" className="submit" disabled={!canSubmit} aria-busy={loading || undefined}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <span>Creating account…</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <span className="arr" aria-hidden="true">
              <ArrowRightIcon />
            </span>
          </>
        )}
      </button>

      <p className="legal">By continuing you agree to our Terms and Privacy.</p>
    </form>
  );
}
