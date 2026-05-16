import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getDevOpsToken } from '../lib/auth';
import type {
  BranchSummary, CommitSummary, FileContent, PrDraft,
  PullRequestSummary, RepoPlatform, RepoSummary, TreeNode,
} from '../lib/types';

type LoadState = 'idle' | 'loading' | 'ok' | 'error' | 'cred-error';

async function adoHeaders(): Promise<Record<string, string>> {
  const token = await getDevOpsToken();
  const h: Record<string, string> = {};
  if (token) h['X-DevOps-Token'] = token;
  return h;
}

export function useRepos(
  devOpsOrg: string | null,
  devOpsProject: string | null,
  gitHubOrg: string | null,
  hasGitHubPat: boolean,
) {
  const [adoRepos, setAdoRepos] = useState<RepoSummary[]>([]);
  const [ghRepos, setGhRepos] = useState<RepoSummary[]>([]);
  const [prs, setPrs] = useState<PullRequestSummary[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const initialized = useRef(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const [adoR, ghR, adoPrs] = await Promise.allSettled([
        devOpsOrg && devOpsProject
          ? apiFetch<RepoSummary[]>('/api/devops/repos', { headers: await adoHeaders() })
          : Promise.resolve([]),
        gitHubOrg && hasGitHubPat
          ? apiFetch<RepoSummary[]>('/api/repos/github')
          : Promise.resolve([]),
        devOpsOrg && devOpsProject
          ? apiFetch<PullRequestSummary[]>('/api/devops/pullrequests', { headers: await adoHeaders() })
          : Promise.resolve([]),
      ]);

      setAdoRepos(adoR.status === 'fulfilled' ? adoR.value : []);
      setGhRepos(ghR.status === 'fulfilled' ? ghR.value : []);
      const adoPrList = adoPrs.status === 'fulfilled' ? adoPrs.value : [];
      setPrs(adoPrList);
      setLoadState('ok');
    } catch (e) {
      const status = (e as { status?: number }).status;
      setLoadState(status === 401 || status === 403 ? 'cred-error' : 'error');
    }
  }, [devOpsOrg, devOpsProject, gitHubOrg, hasGitHubPat]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  const loadGhPrs = useCallback(async (owner: string, repo: string): Promise<PullRequestSummary[]> => {
    return apiFetch<PullRequestSummary[]>(`/api/repos/github/${owner}/${repo}/pulls`);
  }, []);

  const getTree = useCallback(async (platform: RepoPlatform, repoId: string, path = '/'): Promise<TreeNode[]> => {
    if (platform === 'ado') {
      return apiFetch<TreeNode[]>(`/api/devops/repos/${repoId}/tree?path=${encodeURIComponent(path)}`,
        { headers: await adoHeaders() });
    }
    const [owner, repo] = repoId.split('/');
    return apiFetch<TreeNode[]>(`/api/repos/github/${owner}/${repo}/tree`);
  }, []);

  const getFile = useCallback(async (platform: RepoPlatform, repoId: string, filePath: string): Promise<FileContent> => {
    if (platform === 'ado') {
      return apiFetch<FileContent>(`/api/devops/repos/${repoId}/file?path=${encodeURIComponent(filePath)}`,
        { headers: await adoHeaders() });
    }
    const [owner, repo] = repoId.split('/');
    return apiFetch<FileContent>(`/api/repos/github/${owner}/${repo}/file?path=${encodeURIComponent(filePath)}`);
  }, []);

  const getBranches = useCallback(async (platform: RepoPlatform, repoId: string): Promise<BranchSummary[]> => {
    if (platform === 'ado') {
      return apiFetch<BranchSummary[]>(`/api/devops/repos/${repoId}/branches`,
        { headers: await adoHeaders() });
    }
    const [owner, repo] = repoId.split('/');
    return apiFetch<BranchSummary[]>(`/api/repos/github/${owner}/${repo}/branches`);
  }, []);

  const getCommits = useCallback(async (platform: RepoPlatform, repoId: string, branch: string): Promise<CommitSummary[]> => {
    if (platform === 'ado') {
      return apiFetch<CommitSummary[]>(`/api/devops/repos/${repoId}/commits?branch=${encodeURIComponent(branch)}&top=10`,
        { headers: await adoHeaders() });
    }
    const [owner, repo] = repoId.split('/');
    return apiFetch<CommitSummary[]>(`/api/repos/github/${owner}/${repo}/commits?branch=${encodeURIComponent(branch)}&top=10`);
  }, []);

  const getPrDraft = useCallback(async (
    platform: RepoPlatform, repoId: string, sourceBranch: string, targetBranch: string
  ): Promise<PrDraft> => {
    return apiFetch<PrDraft>('/api/chat/pr-draft', {
      method: 'POST',
      body: { platform, repoId, sourceBranch, targetBranch },
    });
  }, []);

  const getPrSummary = useCallback(async (
    title: string, description: string | null, changedFiles: string[]
  ): Promise<string> => {
    const result = await apiFetch<{ summary: string }>('/api/chat/pr-summary', {
      method: 'POST',
      body: { title, description, changedFiles },
    });
    return result.summary;
  }, []);

  const createPr = useCallback(async (
    platform: RepoPlatform, repoId: string, title: string, body: string, sourceBranch: string, targetBranch: string
  ): Promise<void> => {
    if (platform === 'ado') {
      await apiFetch(`/api/devops/repos/${repoId}/pullrequests`, {
        method: 'POST',
        body: { title, body, sourceBranch, targetBranch },
        headers: await adoHeaders(),
      });
    } else {
      const [owner, repo] = repoId.split('/');
      await apiFetch(`/api/repos/github/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: { title, body, sourceBranch, targetBranch },
      });
    }
    void load();
  }, [load]);

  const voteOnPr = useCallback(async (repoId: string, prId: string, vote: number): Promise<void> => {
    await apiFetch(`/api/devops/pullrequests/${prId}/vote?repoId=${encodeURIComponent(repoId)}`, {
      method: 'PUT',
      body: { vote },
      headers: await adoHeaders(),
    });
    void load();
  }, [load]);

  const addPrComment = useCallback(async (
    platform: RepoPlatform, repoId: string, prId: string, text: string
  ): Promise<void> => {
    if (platform === 'ado') {
      await apiFetch(`/api/devops/pullrequests/${prId}/threads?repoId=${encodeURIComponent(repoId)}`, {
        method: 'POST',
        body: { text },
        headers: await adoHeaders(),
      });
    } else {
      const [owner, repo] = repoId.split('/');
      await apiFetch(`/api/repos/github/${owner}/${repo}/pulls/${prId}/reviews`, {
        method: 'POST',
        body: { body: text, event: 'COMMENT' },
      });
    }
  }, []);

  return {
    adoRepos, ghRepos, prs, loadState, load, loadGhPrs,
    getTree, getFile, getBranches, getCommits,
    getPrDraft, getPrSummary, createPr, voteOnPr, addPrComment,
  };
}
