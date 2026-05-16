import '../../styles/signin.css';

interface Props {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function SignInPage({ onSignIn, isLoading, error }: Props) {
  const scopes = ['User.Read', 'Mail.Read', 'Mail.Send', 'Calendars.ReadWrite', 'Chat.Read', 'ChannelMessage.Read.User'];

  return (
    <div className="signin-page theme-light">
      <div className="signin-card">
        <div className="signin-logo">
          <div className="signin-logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4L24 10V18L14 24L4 18V10L14 4Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div className="signin-brand-name">AGP Command Station</div>
          <div className="signin-tagline">Command Station · v2.0</div>
        </div>

        <h1 className="signin-heading">Welcome to your workbench.</h1>
        <p className="signin-sub">
          Sign in with your AGP account to load your work items, PRs, inbox, and team channels.
        </p>

        <button
          className="ms-sign-in-btn"
          onClick={onSignIn}
          disabled={isLoading}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          {isLoading ? 'Signing in…' : 'Sign in with Microsoft'}
        </button>

        {error && <div className="signin-error">{error}</div>}

        <div className="signin-scopes">
          <div className="signin-scopes-label">Requested scopes</div>
          <div className="signin-scopes-list">
            {scopes.map((s) => <span key={s} className="scope-pill">{s}</span>)}
          </div>
        </div>

        <p className="signin-footer">Your Graph token never leaves your browser session.</p>
      </div>
    </div>
  );
}
