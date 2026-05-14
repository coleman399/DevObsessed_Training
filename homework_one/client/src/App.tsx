import { useState } from 'react';
import { AuthCard } from './components/auth/AuthCard';
import { OrbsBackground } from './components/backgrounds/OrbsBackground';
import { WelcomePage } from './components/welcome/WelcomePage';
import { useAuth } from './hooks/useAuth';
import { ApiError } from './lib/types';

function AuthScreen() {
  const { login, register } = useAuth();
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpEmailError, setSignUpEmailError] = useState<string | null>(null);
  const [duplicateEmailHint, setDuplicateEmailHint] = useState<string>('');

  return (
    <AuthCard
      signInError={signInError}
      signUpEmailError={signUpEmailError}
      signUpDuplicateEmailHint={duplicateEmailHint}
      onClearSignInError={() => setSignInError(null)}
      onClearSignUpEmailError={() => {
        setSignUpEmailError(null);
        setDuplicateEmailHint('');
      }}
      onSignUp={async ({ name, email, password }) => {
        setSignUpEmailError(null);
        setDuplicateEmailHint('');
        try {
          await register(name, email, password);
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            setSignUpEmailError('That email is already in use. Try signing in instead.');
            setDuplicateEmailHint(email);
          } else {
            setSignUpEmailError("We couldn't create your account. Please check your details.");
          }
          throw err;
        }
      }}
      onSignIn={async ({ email, password, remember }) => {
        setSignInError(null);
        try {
          await login(email, password, remember);
        } catch (err) {
          if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
            setSignInError("That doesn't match our records.");
          } else {
            setSignInError("Something went wrong. Please try again.");
          }
          throw err;
        }
      }}
    />
  );
}

export default function App() {
  const { status } = useAuth();
  const isAuthed = status === 'authenticated';
  return (
    <div className="app">
      <OrbsBackground screen={isAuthed ? 'welcome' : 'auth'} />
      {isAuthed ? (
        <WelcomePage />
      ) : (
        <main className="stage">
          <AuthScreen />
        </main>
      )}
    </div>
  );
}
