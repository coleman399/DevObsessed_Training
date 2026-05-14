import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../icons';
import { emailValid } from '../../lib/validation';
import { FieldRow } from './FieldRow';

export interface SignInSubmitArgs {
  email: string;
  password: string;
  remember: boolean;
}

interface SignInFormProps {
  onSubmit: (args: SignInSubmitArgs) => Promise<void> | void;
  loading?: boolean;
  initialEmail?: string;
  formError?: string | null;
  onClearError?: () => void;
}

export function SignInForm({
  onSubmit,
  loading = false,
  initialEmail = '',
  formError = null,
  onClearError,
}: SignInFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [forgotShown, setForgotShown] = useState(false);

  // Re-sync if AuthCard hands us a new initialEmail (e.g. the SignUpForm 409 "Switch to Sign in" link).
  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const emailIsValid = email.length > 0 && emailValid(email);
  const eShowError = emailTouched && email.length > 0 && !emailIsValid;
  const pwError = pwTouched && password.length > 0 && password.length < 6;
  const canSubmit = emailIsValid && password.length >= 6 && !loading;

  const onPwKey = (e: KeyboardEvent<HTMLInputElement>) => {
    setCaps(e.getModifierState('CapsLock'));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void onSubmit({ email, password, remember });
  };

  const showForgot = () => {
    setForgotShown(true);
    // eslint-disable-next-line no-console
    console.info('TODO: password reset flow');
    setTimeout(() => setForgotShown(false), 3000);
  };

  return (
    <form className="form-area" onSubmit={handleSubmit} noValidate>
      <FieldRow
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        leadingIcon={<MailIcon />}
        onChange={(e) => {
          setEmail(e.target.value);
          if (formError) onClearError?.();
        }}
        onBlur={() => setEmailTouched(true)}
        valid={emailIsValid}
        error={eShowError ? "That doesn't look right." : undefined}
        hint="The address on your account."
      />

      <FieldRow
        label="Password"
        name="password"
        type={showPw ? 'text' : 'password'}
        autoComplete="current-password"
        value={password}
        leadingIcon={<LockIcon />}
        onChange={(e) => {
          setPassword(e.target.value);
          if (formError) onClearError?.();
        }}
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

      {caps && (
        <p className="caps" role="status">
          <span aria-hidden="true">⇪</span> Caps Lock is on.
        </p>
      )}

      <div className="row">
        <label className="check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>
        <button type="button" className="forgot" onClick={showForgot}>
          Forgot?
        </button>
      </div>
      {forgotShown && <span className="forgot-msg" role="status">Password reset isn't available yet.</span>}

      <button type="submit" className="submit" disabled={!canSubmit} aria-busy={loading || undefined}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <span className="arr" aria-hidden="true">
              <ArrowRightIcon />
            </span>
          </>
        )}
      </button>

      {formError && (
        <div className="banner-error" role="alert">
          {formError}
        </div>
      )}
    </form>
  );
}
