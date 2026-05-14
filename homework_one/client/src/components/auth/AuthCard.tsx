import { useState, type ReactNode } from 'react';
import { ModeToggle, type Mode } from './ModeToggle';
import { SignInForm, type SignInSubmitArgs } from './SignInForm';
import { SignUpForm, type SignUpSubmitArgs } from './SignUpForm';

interface AuthCardProps {
  onSignUp: (args: SignUpSubmitArgs) => Promise<void>;
  onSignIn: (args: SignInSubmitArgs) => Promise<void>;
  /** Form-level message shown under the sign-in form on auth failure. */
  signInError?: string | null;
  /** Inline error under the sign-up email field (409 duplicate). */
  signUpEmailError?: string | null;
  /** Caller clears the relevant error when the user changes input. */
  onClearSignInError?: () => void;
  onClearSignUpEmailError?: () => void;
  /** Sign-up surfaces a 409 → AuthCard prompts to "Switch to Sign in" preserving the typed email. */
  signUpDuplicateEmailHint?: string;
}

export function AuthCard({
  onSignUp,
  onSignIn,
  signInError = null,
  signUpEmailError = null,
  onClearSignInError,
  onClearSignUpEmailError,
  signUpDuplicateEmailHint,
}: AuthCardProps) {
  const [mode, setMode] = useState<Mode>('signup');
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [signInPrefill, setSignInPrefill] = useState('');

  const handleSignUp = async (args: SignUpSubmitArgs) => {
    setLoading(true);
    try {
      await onSignUp(args);
      setLeaving(true);
    } catch {
      // Errors surface via signUpEmailError / banner — caller is responsible for state.
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (args: SignInSubmitArgs) => {
    setLoading(true);
    try {
      await onSignIn(args);
      setLeaving(true);
    } catch {
      // Caller sets signInError; we just stop the spinner.
    } finally {
      setLoading(false);
    }
  };

  const switchToSignIn = (hintEmail: string) => {
    setSignInPrefill(hintEmail);
    onClearSignUpEmailError?.();
    setMode('signin');
  };

  let body: ReactNode;
  if (mode === 'signup') {
    body = (
      <>
        <h1 className="heading">Create your account</h1>
        <p className="subhead">A few details and your workspace is yours.</p>
        <ModeToggle mode={mode} onChange={setMode} />
        <SignUpForm
          onSubmit={handleSignUp}
          loading={loading}
          emailError={signUpEmailError}
          onClearEmailError={onClearSignUpEmailError}
        />
        {signUpEmailError && signUpDuplicateEmailHint && (
          <p className="swap">
            <button
              type="button"
              onClick={() => switchToSignIn(signUpDuplicateEmailHint)}
            >
              Switch to Sign in
            </button>
          </p>
        )}
      </>
    );
  } else {
    body = (
      <>
        <h1 className="heading">Welcome back</h1>
        <p className="subhead">Sign in to pick up where you left off.</p>
        <ModeToggle mode={mode} onChange={setMode} />
        <SignInForm
          onSubmit={handleSignIn}
          loading={loading}
          initialEmail={signInPrefill}
          formError={signInError}
          onClearError={onClearSignInError}
        />
      </>
    );
  }

  return (
    <div className={`auth-card${leaving ? ' leaving' : ''}`}>
      <aside className="left">
        <div>
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">Lumen</span>
          </div>
          <p className="quote">
            A quieter place to <em>think, plan, and ship.</em>
          </p>
        </div>
        <span className="meta">v2.4 · build 8821</span>
      </aside>
      <section className="right">{body}</section>
    </div>
  );
}
