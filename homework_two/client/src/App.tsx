import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ChatProvider } from './hooks/useChat';
import { ToastProvider } from './hooks/useToast';
import { SignInPage } from './components/auth/SignInPage';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { CommandStation } from './components/command/CommandStation';
import { ProfileSettings } from './components/profile/ProfileSettings';
import type { UserProfile } from './lib/types';
import './styles/global.css';

function AppInner() {
  const { profile, isLoading, isAuthenticated, signIn, refreshProfile } = useAuth();
  const [signInError, setSignInError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  async function handleSignIn() {
    setSignInError(null);
    try {
      await signIn();
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    }
  }

  function handleProfileSave(_updated: UserProfile) {
    void refreshProfile();
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return <SignInPage onSignIn={handleSignIn} isLoading={isLoading} error={signInError} />;
  }

  const firstName = (profile.displayName || 'there').split(' ')[0];

  return (
    <ChatProvider firstName={firstName}>
      {!profile.onboardingComplete && (
        <OnboardingModal
          profile={profile}
          onComplete={() => { void refreshProfile(); }}
        />
      )}

      {showProfile ? (
        <ProfileSettings
          profile={profile}
          onSave={handleProfileSave}
          onBack={() => setShowProfile(false)}
        />
      ) : (
        <CommandStation onOpenProfile={() => setShowProfile(true)} />
      )}
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}
