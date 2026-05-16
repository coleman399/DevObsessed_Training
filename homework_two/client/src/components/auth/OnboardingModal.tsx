import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { UpdateProfileRequest, UserProfile, UserRole } from '../../lib/types';
import '../../styles/onboarding.css';

interface Props {
  profile: UserProfile;
  onComplete: (updated: UserProfile) => void;
}

const ROLES: { key: UserRole; label: string; desc: string }[] = [
  { key: 'ProductOwner', label: 'Product Owner', desc: 'Backlog, user stories, acceptance criteria' },
  { key: 'SoftwareEngineer', label: 'Software Engineer', desc: 'Tasks, PRs, codebase navigation' },
  { key: 'QA', label: 'QA Engineer', desc: 'Test cases, bug reports, edge cases' },
];

export function OnboardingModal({ profile, onComplete }: Props) {
  const [role, setRole] = useState<UserRole>(profile.role);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [adoOrg, setAdoOrg] = useState(profile.devOpsOrganization ?? '');
  const [adoProject, setAdoProject] = useState(profile.devOpsProject ?? '');
  const [ghOrg, setGhOrg] = useState(profile.gitHubOrganization ?? '');
  const [ghPat, setGhPat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = (profile.displayName || 'there').split(' ')[0];

  async function handleComplete(skip = false) {
    setSaving(true);
    setError(null);
    try {
      const req: UpdateProfileRequest = { role };
      if (!skip) {
        if (anthropicKey) req.anthropicApiKey = anthropicKey;
        if (adoOrg) req.devOpsOrganization = adoOrg;
        if (adoProject) req.devOpsProject = adoProject;
        if (ghOrg) req.gitHubOrganization = ghOrg;
        if (ghPat) req.gitHubPat = ghPat;
      }
      const updated = await apiFetch<UserProfile>('/api/profile', { method: 'PATCH', body: req });
      onComplete(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-overlay theme-light">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-header-title">Set up your workbench</div>
          <div className="onboarding-header-meta">Connect to continue</div>
        </div>

        <div className="onboarding-body">
          <div className="onboarding-greeting">
            <h1>Hi, {firstName}. Let&apos;s get connected.</h1>
            <p>
              Hook up the services your workbench needs. Each credential is encrypted with AES-256-GCM
              before storage and used only to scope you, not to act as you.
            </p>
          </div>

          {/* Role */}
          <div className="ob-section">
            <div className="ob-section-header">
              <div className="ob-section-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5a5 5 0 0 1 10 0"/>
                </svg>
              </div>
              <div className="ob-section-text">
                <h3>Your role</h3>
                <p>Shapes the assistant&apos;s system prompt. Everyone can build work items, ship PRs, etc.</p>
              </div>
            </div>
            <div className="role-cards">
              {ROLES.map((r) => (
                <button key={r.key} type="button"
                  className={`role-card ${role === r.key ? 'selected' : ''}`}
                  onClick={() => setRole(r.key)}>
                  <div className="role-card-title">{r.label}</div>
                  <div className="role-card-desc">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Anthropic */}
          <div className="ob-section">
            <div className="ob-section-header">
              <div className="ob-section-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11 4.3 13.5l1.4-4.3L2 6.5h4.5z"/>
                </svg>
              </div>
              <div className="ob-section-text">
                <h3>Anthropic API key</h3>
                <p>Bring your own key (sk-ant-…). Your assistant reads its name from your local Claude config.</p>
              </div>
            </div>
            <div className="ob-field">
              <label className="ob-label">API key</label>
              <input
                className="ob-input mono"
                type="password"
                placeholder="sk-ant-api03-…"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <div className="ob-hint">Encrypted with AES-256-GCM before storage.</div>
            </div>
          </div>

          {/* Azure DevOps */}
          <div className="ob-section">
            <div className="ob-section-header">
              <div className="ob-section-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2 12l3-9 4 6 3-3 2 6H2z"/>
                </svg>
              </div>
              <div className="ob-section-text">
                <h3>Azure DevOps</h3>
                <p>Inherited from your Microsoft sign-in — no PAT needed.</p>
              </div>
            </div>
            <div className="ob-row2">
              <div className="ob-field">
                <label className="ob-label">Organization</label>
                <input className="ob-input mono" type="text" placeholder="agp-co"
                  value={adoOrg} onChange={(e) => setAdoOrg(e.target.value)} />
              </div>
              <div className="ob-field">
                <label className="ob-label">Project</label>
                <input className="ob-input" type="text" placeholder="ELO Platform"
                  value={adoProject} onChange={(e) => setAdoProject(e.target.value)} />
              </div>
            </div>
            <div className="ob-conn-status ok">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 8.5l3 3 7-7"/>
              </svg>
              <span>Signed in as <strong>{profile.email}</strong> · Azure DevOps auth comes through your Microsoft token automatically.</span>
            </div>
          </div>

          {/* GitHub */}
          <div className="ob-section">
            <div className="ob-section-header">
              <div className="ob-section-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .2A8 8 0 0 0 5.47 15.8c.4.07.55-.17.55-.38v-1.3c-2.22.48-2.69-1.07-2.69-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.63-.89-3.63-3.95 0-.87.31-1.58.83-2.14-.08-.2-.36-1.01.08-2.1 0 0 .67-.22 2.2.82A7.65 7.65 0 0 1 8 4.07c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.52.56.83 1.27.83 2.14 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 8 .2z"/>
                </svg>
              </div>
              <div className="ob-section-text">
                <h3>GitHub</h3>
                <p>For org repos, PRs, and code search outside Azure DevOps.</p>
              </div>
            </div>
            <div className="ob-row2">
              <div className="ob-field">
                <label className="ob-label">Org or username</label>
                <input className="ob-input mono" type="text" placeholder="agp-co"
                  value={ghOrg} onChange={(e) => setGhOrg(e.target.value)} />
              </div>
              <div className="ob-field">
                <label className="ob-label">Personal access token</label>
                <input className="ob-input mono" type="password" placeholder="ghp_…"
                  value={ghPat} onChange={(e) => setGhPat(e.target.value)} />
                <div className="ob-hint">Fine-grained token with repo + pull_request scopes.</div>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="ob-section">
            <div className="ob-section-header">
              <div className="ob-section-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="10" cy="5" r="2"/><path d="M13 11.5c0-1.7-1.3-3-3-3s-3 1.3-3 3"/>
                  <circle cx="5.5" cy="6.5" r="1.5"/><path d="M2 13c0-1.4 1.1-2.5 2.5-2.5"/>
                </svg>
              </div>
              <div className="ob-section-text">
                <h3>Teams channels</h3>
                <p>Configure in Profile Settings after login — the channel picker loads from Graph API.</p>
              </div>
            </div>
            <div className="scope-warning">
              ⚠️ <strong>ChannelMessage.Send</strong> requires IT admin consent. Until granted, Teams is read-only.
              Contact your Azure AD admin to approve the permission.
            </div>
          </div>

          {error && <div style={{ color: 'var(--agp-red)', fontSize: '0.875rem', marginTop: '0.875rem' }}>{error}</div>}

          <div className="onboarding-footer">
            <button className="btn btn-ghost" type="button" onClick={() => handleComplete(true)} disabled={saving}>
              Skip for now
            </button>
            <button className="btn btn-primary" type="button" onClick={() => handleComplete(false)} disabled={saving}>
              {saving ? 'Saving…' : 'Open my workbench →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
