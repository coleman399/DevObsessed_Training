import { useState } from 'react';
import { WorkItemCard } from './WorkItemCard';
import { WorkItemBuilder } from './WorkItemBuilder';
import { useWorkItems } from '../../hooks/useWorkItems';
import type { UserProfile } from '../../lib/types';
import '../../styles/workitems.css';

interface Props {
  profile: UserProfile;
}

export function WorkItemList({ profile }: Props) {
  const { items, loadState, load, updateState, addComment, createWorkItem, getDraft } = useWorkItems(
    profile.devOpsOrganization,
    profile.devOpsProject
  );
  const [builderOpen, setBuilderOpen] = useState(false);
  const [credDismissed, setCredDismissed] = useState(false);

  const notConfigured = !profile.devOpsOrganization || !profile.devOpsProject;

  if (notConfigured) {
    return (
      <div className="wi-panel">
        <div className="wi-empty">
          <div className="wi-empty-title">Azure DevOps not configured</div>
          <div className="wi-empty-desc">
            Set your DevOps org and project in <strong>Profile Settings</strong> to see your work items.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wi-panel">
      <div className="wi-panel-header">
        <span className="wi-panel-title">Work Items</span>
        <div className="wi-panel-actions">
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>
            ↻ Refresh
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setBuilderOpen(true)}
            style={{ fontSize: '0.75rem', padding: '0.3125rem 0.625rem' }}>
            + New
          </button>
        </div>
      </div>

      {/* Credential error banner */}
      {loadState === 'cred-error' && !credDismissed && (
        <div className="wi-cred-banner">
          <span>Your DevOps connection expired. <a href="#profile" onClick={e => { e.preventDefault(); }}>Update in Profile Settings</a></span>
          <button type="button" className="wi-cred-dismiss" onClick={() => setCredDismissed(true)}>×</button>
        </div>
      )}

      {/* Loading */}
      {loadState === 'loading' && (
        <div className="wi-skeleton-list">
          {[1, 2, 3].map(n => <div key={n} className="wi-skeleton-card" />)}
        </div>
      )}

      {/* API error */}
      {loadState === 'error' && (
        <div className="wi-error-card">
          <span>Failed to load work items.</span>
          <button className="btn btn-ghost" type="button" onClick={() => void load()}
            style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {loadState === 'ok' && items.length === 0 && (
        <div className="wi-empty">
          <div className="wi-empty-title">No open work items</div>
          <div className="wi-empty-desc">Nothing assigned to you right now.</div>
        </div>
      )}

      {/* List */}
      {loadState === 'ok' && items.length > 0 && (
        <div className="wi-list">
          {items.map(item => (
            <WorkItemCard
              key={item.id}
              item={item}
              onStateChange={updateState}
              onAddComment={addComment}
            />
          ))}
        </div>
      )}

      {/* Builder modal */}
      {builderOpen && (
        <WorkItemBuilder
          role={profile.role}
          onGetDraft={getDraft}
          onCreate={createWorkItem}
          onClose={() => setBuilderOpen(false)}
        />
      )}
    </div>
  );
}
