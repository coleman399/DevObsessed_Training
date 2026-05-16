import { useState } from 'react';
import { RepoTree } from './RepoTree';
import { PullRequestCard } from './PullRequestCard';
import { NewPrModal } from './NewPrModal';
import { useRepos } from '../../hooks/useRepos';
import { useChat } from '../../hooks/useChat';
import type { RepoPlatform, RepoSummary, UserProfile } from '../../lib/types';
import '../../styles/repos.css';

type SubTab = 'browse' | 'prs';

interface Props {
  profile: UserProfile;
}

export function RepoPanel({ profile }: Props) {
  const {
    adoRepos, ghRepos, prs, loadState, load,
    getTree, getFile, getBranches,
    getPrDraft, getPrSummary, createPr, voteOnPr, addPrComment,
  } = useRepos(
    profile.devOpsOrganization, profile.devOpsProject,
    profile.gitHubOrganization, profile.hasGitHubPat,
  );
  const { pinFile } = useChat();

  const [subTab, setSubTab] = useState<SubTab>('browse');
  const [selectedRepo, setSelectedRepo] = useState<RepoSummary | null>(null);
  const [newPrOpen, setNewPrOpen] = useState(false);
  const [credDismissed, setCredDismissed] = useState(false);

  const allRepos = [...adoRepos, ...ghRepos];
  const notConfigured = !profile.devOpsOrganization && !profile.gitHubOrganization;

  if (notConfigured) return (
    <div className="rp-panel">
      <div className="m365-empty">
        <div className="m365-empty-title">No repos configured</div>
        <div className="m365-empty-desc">Set your DevOps org/project or GitHub org+PAT in Profile Settings.</div>
      </div>
    </div>
  );

  return (
    <div className="rp-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexShrink: 0 }}>
        <div className="rp-tabs" style={{ margin: 0, border: 'none' }}>
          <button type="button" className={`rp-tab ${subTab === 'browse' ? 'active' : ''}`}
            onClick={() => setSubTab('browse')}>Browse</button>
          <button type="button" className={`rp-tab ${subTab === 'prs' ? 'active' : ''}`}
            onClick={() => setSubTab('prs')}>Pull Requests</button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>↻</button>
          <button className="btn btn-primary" type="button" onClick={() => setNewPrOpen(true)}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>+ New PR</button>
        </div>
      </div>

      {loadState === 'cred-error' && !credDismissed && (
        <div className="m365-cred-banner">
          <span>Repo connection expired. <a href="#profile">Update in Profile Settings</a></span>
          <button type="button" onClick={() => setCredDismissed(true)} style={{ opacity: 0.6, fontSize: '1rem' }}>×</button>
        </div>
      )}

      {loadState === 'loading' && (
        <div className="m365-skeleton-list">
          {[1, 2, 3].map(n => <div key={n} className="m365-skeleton-row" />)}
        </div>
      )}

      {loadState === 'error' && (
        <div className="m365-error-card">
          <span>Failed to load repos.</span>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>Retry</button>
        </div>
      )}

      {/* Browse tab */}
      {loadState === 'ok' && subTab === 'browse' && (
        <>
          {allRepos.length === 0 ? (
            <div className="m365-empty">
              <div className="m365-empty-title">No repos found</div>
            </div>
          ) : (
            <>
              <div className="repo-list" style={{ marginBottom: '1rem' }}>
                {allRepos.map(r => (
                  <div key={r.id}
                    className={`repo-row ${selectedRepo?.id === r.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRepo(prev => prev?.id === r.id ? null : r)}>
                    <span className={`repo-platform-badge ${r.platform}`}>
                      {r.platform === 'ado' ? 'ADO' : 'GH'}
                    </span>
                    <span className="repo-name">{r.name}</span>
                    {r.defaultBranch && <span className="repo-branch">{r.defaultBranch}</span>}
                  </div>
                ))}
              </div>

              {selectedRepo && (
                <RepoTree
                  platform={selectedRepo.platform}
                  repoId={selectedRepo.id}
                  repoName={selectedRepo.name}
                  onGetTree={getTree}
                  onGetFile={getFile}
                  onPinFile={pinFile}
                />
              )}
            </>
          )}
        </>
      )}

      {/* PRs tab */}
      {loadState === 'ok' && subTab === 'prs' && (
        <>
          {prs.length === 0 ? (
            <div className="m365-empty">
              <div className="m365-empty-title">No open PRs assigned to you</div>
            </div>
          ) : (
            <div className="pr-list">
              {prs.map(pr => (
                <PullRequestCard
                  key={`${pr.platform}-${pr.id}`}
                  pr={pr}
                  onSummarize={getPrSummary}
                  onApprove={pr.platform === 'ado' ? (repoId, prId) => voteOnPr(repoId, prId, 10) : undefined}
                  onAddComment={(prId, text) => addPrComment(pr.platform as RepoPlatform, pr.repoId, prId, text)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {newPrOpen && (
        <NewPrModal
          repos={allRepos}
          onGetBranches={getBranches}
          onGetDraft={getPrDraft}
          onCreatePr={createPr}
          onClose={() => setNewPrOpen(false)}
        />
      )}
    </div>
  );
}
