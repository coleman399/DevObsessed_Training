import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { UpdateProfileRequest, UserProfile, UserRole } from '../../lib/types';
import '../../styles/profile.css';

interface Props {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onBack: () => void;
}

const ROLES: { key: UserRole; label: string }[] = [
  { key: 'ProductOwner', label: 'Product Owner' },
  { key: 'SoftwareEngineer', label: 'Software Engineer' },
  { key: 'QA', label: 'QA Engineer' },
];

function useSectionSave(onSave: (p: UserProfile) => void) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(req: UpdateProfileRequest) {
    setSaving(true); setSaved(false); setError(null);
    try {
      const updated = await apiFetch<UserProfile>('/api/profile', { method: 'PATCH', body: req });
      onSave(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return { saving, saved, error, save };
}

export function ProfileSettings({ profile, onSave, onBack }: Props) {
  return (
    <div className="cs-root theme-light" style={{ overflowY: 'auto' }}>
      <div className="profile-page">
        <button type="button" className="profile-back-btn" onClick={onBack}>
          ← Back to workbench
        </button>
        <h1 className="profile-heading">Profile Settings</h1>
        <p className="profile-sub">Each section saves independently — changing your GitHub PAT won&apos;t require re-entering your Anthropic key.</p>

        <RoleSection profile={profile} onSave={onSave} />
        <AnthropicSection profile={profile} onSave={onSave} />
        <DevOpsSection profile={profile} onSave={onSave} />
        <GitHubSection profile={profile} onSave={onSave} />
      </div>
    </div>
  );
}

function RoleSection({ profile, onSave }: { profile: UserProfile; onSave: (p: UserProfile) => void }) {
  const [role, setRole] = useState<UserRole>(profile.role);
  const [dirty, setDirty] = useState(false);
  const { saving, saved, error, save } = useSectionSave(onSave);

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <div>
          <div className="profile-section-title">Role</div>
          <div className="profile-section-desc">Shapes the assistant&apos;s system prompt. Takes effect on next chat message.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {ROLES.map((r) => (
          <button key={r.key} type="button"
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--r-sm)',
              border: `1px solid ${role === r.key ? 'var(--primary)' : 'var(--border)'}`,
              background: role === r.key ? 'var(--primary-soft)' : 'var(--surface-2)',
              color: role === r.key ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: role === r.key ? 600 : 400,
              fontSize: '0.875rem',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
            onClick={() => { setRole(r.key); setDirty(r.key !== profile.role); }}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="profile-save-row">
        {saved && <span className="profile-saved-msg">✓ Saved</span>}
        {error && <span className="profile-error-msg">{error}</span>}
        <button className="btn btn-primary" type="button" disabled={!dirty || saving}
          onClick={() => save({ role })}>
          {saving ? 'Saving…' : 'Save role'}
        </button>
      </div>
    </div>
  );
}

function AnthropicSection({ profile, onSave }: { profile: UserProfile; onSave: (p: UserProfile) => void }) {
  const [key, setKey] = useState('');
  const { saving, saved, error, save } = useSectionSave(onSave);
  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <div>
          <div className="profile-section-title">Anthropic API key</div>
          <div className="profile-section-desc">
            {profile.hasAnthropicKey ? 'A key is stored. Enter a new one to replace it.' : 'No key stored yet.'}
          </div>
        </div>
      </div>
      <div className="profile-field">
        <label className="profile-label">API key</label>
        <input className="profile-input mono" type="password" placeholder="sk-ant-api03-…"
          value={key} onChange={(e) => setKey(e.target.value)} />
      </div>
      <div className="profile-save-row">
        {saved && <span className="profile-saved-msg">✓ Saved</span>}
        {error && <span className="profile-error-msg">{error}</span>}
        <button className="btn btn-primary" type="button" disabled={!key || saving}
          onClick={() => save({ anthropicApiKey: key })}>
          {saving ? 'Saving…' : 'Save key'}
        </button>
      </div>
    </div>
  );
}

function DevOpsSection({ profile, onSave }: { profile: UserProfile; onSave: (p: UserProfile) => void }) {
  const [org, setOrg] = useState(profile.devOpsOrganization ?? '');
  const [project, setProject] = useState(profile.devOpsProject ?? '');
  const dirty = org !== (profile.devOpsOrganization ?? '') || project !== (profile.devOpsProject ?? '');
  const { saving, saved, error, save } = useSectionSave(onSave);
  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <div>
          <div className="profile-section-title">Azure DevOps</div>
          <div className="profile-section-desc">Auth comes through your Microsoft login — no PAT required.</div>
        </div>
      </div>
      <div className="profile-row2">
        <div className="profile-field">
          <label className="profile-label">Organization</label>
          <input className="profile-input mono" type="text" placeholder="agp-co"
            value={org} onChange={(e) => setOrg(e.target.value)} />
        </div>
        <div className="profile-field">
          <label className="profile-label">Project</label>
          <input className="profile-input" type="text" placeholder="ELO Platform"
            value={project} onChange={(e) => setProject(e.target.value)} />
        </div>
      </div>
      <div className="profile-save-row">
        {saved && <span className="profile-saved-msg">✓ Saved</span>}
        {error && <span className="profile-error-msg">{error}</span>}
        <button className="btn btn-primary" type="button" disabled={!dirty || saving}
          onClick={() => save({ devOpsOrganization: org, devOpsProject: project })}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function GitHubSection({ profile, onSave }: { profile: UserProfile; onSave: (p: UserProfile) => void }) {
  const [ghOrg, setGhOrg] = useState(profile.gitHubOrganization ?? '');
  const [pat, setPat] = useState('');
  const dirty = ghOrg !== (profile.gitHubOrganization ?? '') || !!pat;
  const { saving, saved, error, save } = useSectionSave(onSave);
  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <div>
          <div className="profile-section-title">GitHub</div>
          <div className="profile-section-desc">
            {profile.hasGitHubPat ? 'A PAT is stored. Enter a new one to replace it.' : 'No PAT stored yet.'}
          </div>
        </div>
      </div>
      <div className="profile-row2">
        <div className="profile-field">
          <label className="profile-label">Org or username</label>
          <input className="profile-input mono" type="text" placeholder="agp-co"
            value={ghOrg} onChange={(e) => setGhOrg(e.target.value)} />
        </div>
        <div className="profile-field">
          <label className="profile-label">Personal access token</label>
          <input className="profile-input mono" type="password" placeholder="ghp_…"
            value={pat} onChange={(e) => setPat(e.target.value)} />
        </div>
      </div>
      <div className="profile-save-row">
        {saved && <span className="profile-saved-msg">✓ Saved</span>}
        {error && <span className="profile-error-msg">{error}</span>}
        <button className="btn btn-primary" type="button" disabled={!dirty || saving}
          onClick={() => save({ gitHubOrganization: ghOrg, ...(pat ? { gitHubPat: pat } : {}) })}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
