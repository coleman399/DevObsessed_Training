import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { getDevOpsToken } from '../lib/auth';
import type { WorkItemDraft, WorkItemSummary, WorkItemType } from '../lib/types';

type LoadState = 'idle' | 'loading' | 'ok' | 'error' | 'cred-error';

export function useWorkItems(devOpsOrg: string | null, devOpsProject: string | null) {
  const [items, setItems] = useState<WorkItemSummary[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const initialized = useRef(false);

  const load = useCallback(async () => {
    if (!devOpsOrg || !devOpsProject) { setLoadState('idle'); return; }
    setLoadState('loading');
    try {
      const token = await getDevOpsToken();
      const data = await apiFetch<WorkItemSummary[]>('/api/devops/workitems', {
        headers: token ? { 'X-DevOps-Token': token } : {},
      });
      setItems(data);
      setLoadState('ok');
    } catch (e) {
      const status = (e as { status?: number }).status;
      setLoadState(status === 401 || status === 403 ? 'cred-error' : 'error');
    }
  }, [devOpsOrg, devOpsProject]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void load();
  }, [load]);

  const updateState = useCallback(async (id: number, state: string) => {
    const token = await getDevOpsToken();
    await apiFetch(`/api/devops/workitems/${id}/state`, {
      method: 'PATCH',
      body: { state },
      headers: token ? { 'X-DevOps-Token': token } : {},
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, state } : i));
  }, []);

  const addComment = useCallback(async (id: number, text: string) => {
    const token = await getDevOpsToken();
    await apiFetch(`/api/devops/workitems/${id}/comments`, {
      method: 'POST',
      body: { text },
      headers: token ? { 'X-DevOps-Token': token } : {},
    });
  }, []);

  const createWorkItem = useCallback(async (draft: WorkItemDraft): Promise<void> => {
    const token = await getDevOpsToken();
    const fields = buildPatchDocument(draft);
    await apiFetch(`/api/devops/workitems/${encodeURIComponent(draft.workItemType)}`, {
      method: 'POST',
      body: fields,
      headers: token ? { 'X-DevOps-Token': token } : {},
    });
    await load();
  }, [load]);

  const getDraft = useCallback(async (description: string, type: WorkItemType): Promise<WorkItemDraft> => {
    return apiFetch<WorkItemDraft>('/api/chat/workitem-draft', {
      method: 'POST',
      body: { description, workItemType: type },
    });
  }, []);

  return { items, loadState, load, updateState, addComment, createWorkItem, getDraft };
}

// Converts a draft to an ADO JSON Patch document
function buildPatchDocument(draft: WorkItemDraft) {
  const ops: { op: string; path: string; value: string }[] = [
    { op: 'add', path: '/fields/System.Title', value: draft.title },
    { op: 'add', path: '/fields/System.Description', value: draft.description },
  ];

  if (draft.tags.length)
    ops.push({ op: 'add', path: '/fields/System.Tags', value: draft.tags.join('; ') });

  if (draft.reproSteps)
    ops.push({ op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: draft.reproSteps });

  if (draft.remainingWork != null)
    ops.push({ op: 'add', path: '/fields/Microsoft.VSTS.Scheduling.RemainingWork', value: String(draft.remainingWork) });

  if (draft.acceptanceCriteria?.length)
    ops.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.AcceptanceCriteria', value: draft.acceptanceCriteria.join('\n') });

  return ops;
}
