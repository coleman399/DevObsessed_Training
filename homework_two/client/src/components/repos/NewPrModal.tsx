import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { BranchSummary, PrDraft, RepoPlatform, RepoSummary } from '../../lib/types';

type DraftState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  repos: RepoSummary[];
  onGetBranches: (platform: RepoPlatform, repoId: string) => Promise<BranchSummary[]>;
  onGetDraft: (platform: RepoPlatform, repoId: string, src: string, tgt: string) => Promise<PrDraft>;
  onCreatePr: (platform: RepoPlatform, repoId: string, title: string, body: string, src: string, tgt: string) => Promise<void>;
  onClose: () => void;
}

export function NewPrModal({ repos, onGetBranches, onGetDraft, onCreatePr, onClose }: Props) {
  const { toast } = useToast();
  const [repoIdx, setRepoIdx] = useState(0);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [creating, setCreating] = useState(false);

  const repo = repos[repoIdx];

  useEffect(() => {
    if (!repo) return;
    setBranches([]);
    setSourceBranch('');
    setTargetBranch('');
    setDraftState('idle');
    setBranchesLoading(true);
    onGetBranches(repo.platform, repo.id)
      .then(bs => {
        setBranches(bs);
        const def = repo.defaultBranch ?? (bs[0]?.name ?? '');
        setTargetBranch(def);
        const nonDefault = bs.find(b => b.name !== def);
        setSourceBranch(nonDefault?.name ?? '');
      })
      .catch(() => {/* ignore — user can type branches */})
      .finally(() => setBranchesLoading(false));
  }, [repoIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDraft() {
    if (!repo || !sourceBranch || !targetBranch) return;
    setDraftState('loading');
    setDraftError(null);
    try {
      const draft = await onGetDraft(repo.platform, repo.id, sourceBranch, targetBranch);
      setTitle(draft.title);
      setBody(draft.body);
      setDraftState('ready');
    } catch {
      setDraftState('error');
      setDraftError('Draft failed. You can still write manually.');
    }
  }

  async function handleCreate() {
    if (!repo || !title || !sourceBranch || !targetBranch) return;
    setCreating(true);
    try {
      await onCreatePr(repo.platform, repo.id, title, body, sourceBranch, targetBranch);
      toast('PR opened');
      onClose();
    } catch {
      toast('Failed to open PR.');
      setCreating(false);
    }
  }

  if (!repos.length) return (
    <div className="npm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="npm-modal">
        <div className="npm-header">
          <span style={{ fontWeight: 600 }}>New Pull Request</span>
          <button type="button" className="compose-close" onClick={onClose}>×</button>
        </div>
        <div className="npm-body">
          <div className="m365-empty" style={{ padding: '2rem 0' }}>
            <div className="m365-empty-title">No repos configured</div>
            <div className="m365-empty-desc">Set your DevOps org/project or GitHub org+PAT in Profile Settings.</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="npm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="npm-modal">
        <div className="npm-header">
          <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>New Pull Request</span>
          <button type="button" className="compose-close" onClick={onClose}>×</button>
        </div>

        <div className="npm-body">
          {/* Repo picker */}
          <div>
            <label className="npm-label">Repository</label>
            <select className="npm-select" value={repoIdx}
              onChange={e => setRepoIdx(Number(e.target.value))}>
              {repos.map((r, i) => (
                <option key={r.id} value={i}>
                  [{r.platform.toUpperCase()}] {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="npm-label">Source branch</label>
              {branchesLoading ? (
                <div className="npm-skel-bar" style={{ height: '2rem', borderRadius: 'var(--r-sm)' }} />
              ) : branches.length ? (
                <select className="npm-select" value={sourceBranch}
                  onChange={e => setSourceBranch(e.target.value)}>
                  <option value="">Select…</option>
                  {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              ) : (
                <input className="npm-input" type="text" placeholder="feature/my-branch"
                  value={sourceBranch} onChange={e => setSourceBranch(e.target.value)} />
              )}
            </div>
            <div>
              <label className="npm-label">Into (target)</label>
              <input className="npm-input" type="text"
                value={targetBranch} readOnly
                style={{ background: 'var(--surface-3)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          {/* Draft button */}
          <div>
            <button className="btn btn-ghost" type="button"
              disabled={!sourceBranch || !targetBranch || draftState === 'loading'}
              onClick={handleDraft}
              style={{ width: '100%', justifyContent: 'center' }}>
              {draftState === 'loading' ? 'Drafting with AI…' : 'Draft with AI ✦'}
            </button>
            {draftState === 'error' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--agp-red)', marginTop: '0.25rem' }}>
                {draftError} <button type="button" onClick={handleDraft} style={{ color: 'inherit', textDecoration: 'underline' }}>Retry</button>
              </div>
            )}
          </div>

          {/* Skeleton while drafting */}
          {draftState === 'loading' && (
            <div className="npm-skeleton-bars">
              <div className="npm-skel-bar" style={{ width: '65%' }} />
              <div className="npm-skel-bar" style={{ width: '90%' }} />
              <div className="npm-skel-bar" style={{ width: '80%' }} />
            </div>
          )}

          {/* Title + body (always editable) */}
          <div>
            <label className="npm-label">Title</label>
            <input className="npm-input" type="text" placeholder="PR title"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="npm-label">Description</label>
            <textarea className="npm-textarea" rows={6} placeholder="Describe what changed and why…"
              value={body} onChange={e => setBody(e.target.value)} />
          </div>
        </div>

        <div className="npm-footer">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="button"
            disabled={!title || !sourceBranch || creating}
            onClick={handleCreate}>
            {creating ? 'Opening…' : 'Open pull request'}
          </button>
        </div>
      </div>
    </div>
  );
}
