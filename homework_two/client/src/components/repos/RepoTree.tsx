import { useState } from 'react';
import type { FileContent, RepoPlatform, TreeNode } from '../../lib/types';

interface Props {
  platform: RepoPlatform;
  repoId: string;
  repoName: string;
  onGetTree: (platform: RepoPlatform, repoId: string, path: string) => Promise<TreeNode[]>;
  onGetFile: (platform: RepoPlatform, repoId: string, path: string) => Promise<FileContent>;
  onPinFile: (path: string) => void;
}

interface NodeState {
  nodes: TreeNode[];
  expanded: boolean;
  loading: boolean;
}

export function RepoTree({ platform, repoId, repoName, onGetTree, onGetFile, onPinFile }: Props) {
  const [rootNodes, setRootNodes] = useState<TreeNode[] | null>(null);
  const [rootLoading, setRootLoading] = useState(false);
  const [rootError, setRootError] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, NodeState>>({});
  const [openFile, setOpenFile] = useState<FileContent | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  async function loadRoot() {
    setRootLoading(true);
    setRootError(false);
    try {
      const nodes = await onGetTree(platform, repoId, '/');
      setRootNodes(nodes);
    } catch {
      setRootError(true);
    } finally {
      setRootLoading(false);
    }
  }

  async function toggleFolder(node: TreeNode) {
    if (node.type !== 'folder') return;
    const current = expanded[node.path];
    if (current?.expanded) {
      setExpanded(prev => ({ ...prev, [node.path]: { ...prev[node.path], expanded: false } }));
      return;
    }
    if (current?.nodes.length) {
      setExpanded(prev => ({ ...prev, [node.path]: { ...prev[node.path], expanded: true } }));
      return;
    }
    setExpanded(prev => ({ ...prev, [node.path]: { nodes: [], expanded: false, loading: true } }));
    try {
      const children = await onGetTree(platform, repoId, node.path);
      setExpanded(prev => ({ ...prev, [node.path]: { nodes: children, expanded: true, loading: false } }));
    } catch {
      setExpanded(prev => ({ ...prev, [node.path]: { nodes: [], expanded: false, loading: false } }));
    }
  }

  async function openFileNode(node: TreeNode) {
    setFileLoading(true);
    setOpenFile(null);
    try {
      const f = await onGetFile(platform, repoId, node.path);
      setOpenFile(f);
    } catch {
      setOpenFile({ path: node.path, content: 'Failed to load file.', language: 'plaintext', url: null });
    } finally {
      setFileLoading(false);
    }
  }

  function renderNodes(nodes: TreeNode[], depth = 0): React.ReactNode {
    return nodes.map(node => (
      <div key={node.path}>
        <div className="tree-node"
          style={{ paddingLeft: `${0.875 + depth * 1}rem` }}
          onClick={() => node.type === 'folder' ? toggleFolder(node) : openFileNode(node)}>
          <span className={`tree-node-icon ${node.type}`}>
            {node.type === 'folder'
              ? (expanded[node.path]?.expanded ? '▾' : '▸')
              : '·'}
          </span>
          <span className="tree-node-name">{node.name}</span>
          {node.type === 'file' && (
            <button type="button" className="tree-node-pin"
              onClick={e => { e.stopPropagation(); onPinFile(node.path); }}
              title="Pin to chat">
              📌
            </button>
          )}
        </div>
        {node.type === 'folder' && expanded[node.path]?.loading && (
          <div style={{ paddingLeft: `${1.875 + depth * 1}rem` }}>
            <div className="tree-skeleton-row" style={{ width: '60%' }} />
          </div>
        )}
        {node.type === 'folder' && expanded[node.path]?.expanded &&
          renderNodes(expanded[node.path].nodes, depth + 1)}
      </div>
    ));
  }

  return (
    <>
      <div className="tree-panel">
        <div className="tree-panel-header">
          <span>{repoName}</span>
          {rootNodes === null && !rootLoading && (
            <button type="button" onClick={loadRoot}
              style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}>
              Browse files
            </button>
          )}
        </div>

        {rootLoading && (
          <div style={{ padding: '0.5rem 0' }}>
            {[1, 2, 3].map(n => <div key={n} className="tree-skeleton-row" style={{ width: `${40 + n * 15}%` }} />)}
          </div>
        )}

        {rootError && (
          <div style={{ padding: '0.75rem 0.875rem', fontSize: '0.8125rem', color: 'var(--agp-red)' }}>
            Failed to load. <button type="button" onClick={loadRoot} style={{ color: 'inherit', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {rootNodes !== null && (
          <div className="tree-list">
            {renderNodes(rootNodes)}
          </div>
        )}
      </div>

      {(fileLoading || openFile) && (
        <div className="file-viewer">
          <div className="file-viewer-header">
            <span>{openFile?.path ?? '…'}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {openFile && (
                <button type="button" onClick={() => onPinFile(openFile.path)}
                  style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                  📌 Pin to chat
                </button>
              )}
              {openFile?.url && (
                <a href={openFile.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>↗</a>
              )}
              <button type="button" onClick={() => setOpenFile(null)}
                style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>×</button>
            </div>
          </div>
          {fileLoading ? (
            <div style={{ padding: '0.75rem' }}>
              {[1, 2, 3].map(n => <div key={n} className="tree-skeleton-row" style={{ marginBottom: '0.375rem', width: `${50 + n * 10}%` }} />)}
            </div>
          ) : (
            <pre className="file-viewer-content">{openFile?.content}</pre>
          )}
        </div>
      )}
    </>
  );
}
